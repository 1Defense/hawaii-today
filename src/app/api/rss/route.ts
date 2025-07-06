import { NextRequest, NextResponse } from 'next/server';
import { NewsArticle } from '@/types';

interface RSSItem {
  title: string;
  description: string;
  link: string;
  guid: string;
  pubDate: string;
  category?: string;
  author?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hawaiitoday.com';
    
    // Get recent news articles (in real implementation, this would query the database)
    const articles = await getRecentArticles(category, limit);
    
    // Convert to RSS items
    const rssItems: RSSItem[] = articles.map(article => ({
      title: article.title,
      description: article.summary,
      link: `${baseUrl}/news/${article.id}`,
      guid: `${baseUrl}/news/${article.id}`,
      pubDate: new Date(article.publishedAt).toUTCString(),
      category: article.category,
      author: article.publisher.name
    }));

    // Generate RSS feed
    const rssFeed = generateRSSFeed(baseUrl, rssItems, category);

    return new NextResponse(rssFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml',
        'Cache-Control': 'public, max-age=900, s-maxage=900', // Cache for 15 minutes
      },
    });

  } catch (error) {
    console.error('RSS generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    );
  }
}

async function getRecentArticles(category?: string | null, limit: number = 20): Promise<NewsArticle[]> {
  // Mock news articles - in real implementation, this would query the database
  const mockArticles: NewsArticle[] = [
    {
      id: 'article-1',
      title: 'Hawaii Legislature Passes Historic Climate Resilience Bill',
      summary: 'The Hawaii State Legislature unanimously passed comprehensive climate resilience legislation, allocating $500M for coastal protection and renewable energy infrastructure. The bill includes funding for sea wall construction, solar panel installations, and electric vehicle charging networks across all islands.',
      originalUrl: 'https://www.staradvertiser.com/climate-bill',
      publisher: {
        name: 'Honolulu Star-Advertiser',
        logoUrl: '/logos/star-advertiser.png',
        domain: 'staradvertiser.com'
      },
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      category: 'local',
      relevanceScore: 0.95,
      imageUrl: '/images/legislature.jpg'
    },
    {
      id: 'article-2',
      title: 'North Shore Experiences Record Surf Heights',
      summary: 'Professional surfers and spectators flocked to Pipeline and Sunset Beach as wave heights reached 25-30 feet, marking the largest surf of the winter season. The Eddie Aikau competition remains on hold pending further evaluation of conditions by WSL officials.',
      originalUrl: 'https://www.hawaiinewsnow.com/surf-record',
      publisher: {
        name: 'Hawaii News Now',
        logoUrl: '/logos/hawaii-news-now.png',
        domain: 'hawaiinewsnow.com'
      },
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      category: 'weather',
      relevanceScore: 0.88
    },
    {
      id: 'article-3',
      title: 'New Direct Flight Route Connects Maui to Tokyo',
      summary: 'Hawaiian Airlines announced a new direct flight service between Kahului Airport and Tokyo Narita, beginning March 2024. The service will operate three times weekly using Airbus A330 aircraft, reducing travel time by 4 hours compared to current connecting flights.',
      originalUrl: 'https://www.khon2.com/maui-tokyo-flight',
      publisher: {
        name: 'KHON2',
        logoUrl: '/logos/khon2.png',
        domain: 'khon2.com'
      },
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      category: 'business',
      relevanceScore: 0.82
    },
    {
      id: 'article-4',
      title: 'Honolulu Rail Project Reaches Ala Moana Milestone',
      summary: 'HART announced successful completion of rail line testing to Ala Moana Center, marking a major milestone in the $12B transit project. Revenue service to downtown Honolulu is expected to begin in Q3 2024, with full airport connection by 2025.',
      originalUrl: 'https://www.kitv.com/rail-milestone',
      publisher: {
        name: 'KITV4',
        logoUrl: '/logos/kitv.png',
        domain: 'kitv.com'
      },
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      category: 'local',
      relevanceScore: 0.79
    },
    {
      id: 'article-5',
      title: 'Hawaiian Monk Seal Population Shows Continued Recovery',
      summary: 'NOAA researchers report Hawaiian monk seal population has increased to approximately 1,570 individuals, representing a 3% annual growth. Conservation efforts including beach protection and marine debris removal continue to support species recovery across the Northwestern Hawaiian Islands.',
      originalUrl: 'https://www.hawaiinewsnow.com/monk-seals',
      publisher: {
        name: 'Hawaii News Now',
        logoUrl: '/logos/hawaii-news-now.png',
        domain: 'hawaiinewsnow.com'
      },
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      category: 'environment',
      relevanceScore: 0.75
    }
  ];

  // Filter by category if provided
  let filteredArticles = category ? 
    mockArticles.filter(article => article.category === category) : 
    mockArticles;

  // Sort by publish date (newest first)
  filteredArticles.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Limit results
  return filteredArticles.slice(0, limit);
}

function generateRSSFeed(baseUrl: string, items: RSSItem[], category?: string | null): string {
  const feedTitle = category ? 
    `Hawaii Today - ${category.charAt(0).toUpperCase() + category.slice(1)} News` : 
    'Hawaii Today - Latest News';
  
  const feedDescription = category ?
    `Latest ${category} news and updates from Hawaii Today` :
    'Real-time Hawaii news, weather, surf conditions, events, and local information';

  const currentDate = new Date().toUTCString();

  const rssItems = items.map(item => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <description>${escapeXml(item.description)}</description>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      <pubDate>${item.pubDate}</pubDate>
      ${item.category ? `<category>${escapeXml(item.category)}</category>` : ''}
      ${item.author ? `<dc:creator>${escapeXml(item.author)}</dc:creator>` : ''}
    </item>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <description>${escapeXml(feedDescription)}</description>
    <link>${escapeXml(baseUrl)}</link>
    <atom:link href="${escapeXml(baseUrl)}/rss.xml" rel="self" type="application/rss+xml" />
    <language>en-US</language>
    <copyright>© ${new Date().getFullYear()} Hawaii Today. All rights reserved.</copyright>
    <managingEditor>contact@hawaiitoday.com (Hawaii Today Team)</managingEditor>
    <webMaster>contact@hawaiitoday.com (Hawaii Today Team)</webMaster>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <pubDate>${currentDate}</pubDate>
    <ttl>15</ttl>
    <image>
      <url>${escapeXml(baseUrl)}/logo.png</url>
      <title>${escapeXml(feedTitle)}</title>
      <link>${escapeXml(baseUrl)}</link>
      <width>144</width>
      <height>144</height>
    </image>
    ${rssItems}
  </channel>
</rss>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}