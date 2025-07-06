import { NextRequest, NextResponse } from 'next/server';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hawaiitoday.com';
    const currentDate = new Date().toISOString();
    
    // Define static pages
    const staticUrls: SitemapUrl[] = [
      {
        loc: `${baseUrl}/`,
        lastmod: currentDate,
        changefreq: 'hourly',
        priority: 1.0
      },
      {
        loc: `${baseUrl}/about`,
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: 0.8
      },
      {
        loc: `${baseUrl}/privacy`,
        lastmod: currentDate,
        changefreq: 'yearly',
        priority: 0.3
      },
      {
        loc: `${baseUrl}/terms`,
        lastmod: currentDate,
        changefreq: 'yearly',
        priority: 0.3
      },
      {
        loc: `${baseUrl}/contact`,
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: 0.5
      }
    ];

    // Add island-specific pages
    const islands = ['oahu', 'maui', 'hawaii', 'kauai', 'molokai', 'lanai'];
    const islandUrls: SitemapUrl[] = islands.map(island => ({
      loc: `${baseUrl}/${island}`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.9
    }));

    // Add weather pages
    const weatherUrls: SitemapUrl[] = islands.map(island => ({
      loc: `${baseUrl}/weather/${island}`,
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: 0.8
    }));

    // Add surf pages
    const surfUrls: SitemapUrl[] = islands.map(island => ({
      loc: `${baseUrl}/surf/${island}`,
      lastmod: currentDate,
      changefreq: 'hourly',
      priority: 0.8
    }));

    // Add news archive pages
    const newsUrls: SitemapUrl[] = [
      {
        loc: `${baseUrl}/news`,
        lastmod: currentDate,
        changefreq: 'hourly',
        priority: 0.9
      },
      {
        loc: `${baseUrl}/news/local`,
        lastmod: currentDate,
        changefreq: 'hourly',
        priority: 0.8
      },
      {
        loc: `${baseUrl}/news/weather`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 0.7
      },
      {
        loc: `${baseUrl}/news/business`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 0.7
      }
    ];

    // Add events pages
    const eventUrls: SitemapUrl[] = [
      {
        loc: `${baseUrl}/events`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 0.9
      },
      ...islands.map(island => ({
        loc: `${baseUrl}/events/${island}`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 0.8
      }))
    ];

    // Add specific category pages
    const categoryUrls: SitemapUrl[] = [
      {
        loc: `${baseUrl}/traffic`,
        lastmod: currentDate,
        changefreq: 'hourly',
        priority: 0.7
      },
      {
        loc: `${baseUrl}/flights`,
        lastmod: currentDate,
        changefreq: 'hourly',
        priority: 0.7
      },
      {
        loc: `${baseUrl}/power-outages`,
        lastmod: currentDate,
        changefreq: 'hourly',
        priority: 0.6
      },
      {
        loc: `${baseUrl}/jellyfish-forecast`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 0.6
      }
    ];

    // Combine all URLs
    const allUrls = [
      ...staticUrls,
      ...islandUrls,
      ...weatherUrls,
      ...surfUrls,
      ...newsUrls,
      ...eventUrls,
      ...categoryUrls
    ];

    // Generate XML sitemap
    const sitemap = generateSitemapXML(allUrls);

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Sitemap generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    );
  }
}

function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => {
    let entry = `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n`;
    
    if (url.lastmod) {
      entry += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }
    
    if (url.changefreq) {
      entry += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }
    
    if (url.priority !== undefined) {
      entry += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
    }
    
    entry += `  </url>`;
    return entry;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}