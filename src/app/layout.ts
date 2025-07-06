import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins'
});

export const metadata: Metadata = {
  title: {
    default: 'Hawaii Today - Your Real-Time Hawaii Dashboard',
    template: '%s | Hawaii Today'
  },
  description: 'Get real-time weather, surf conditions, local news, events, and traffic updates for all Hawaiian islands. Your essential daily Hawaii briefing in one place.',
  keywords: [
    'Hawaii weather',
    'surf conditions',
    'Hawaii news',
    'Hawaii events',
    'traffic updates',
    'Hawaii dashboard',
    'local information',
    'island life',
    'Oahu',
    'Maui',
    'Big Island',
    'Kauai'
  ],
  authors: [{ name: 'Hawaii Today Team' }],
  creator: 'Hawaii Today',
  publisher: 'Hawaii Today',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hawaiitoday.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
      'ja-JP': '/ja-JP',
      'ko-KR': '/ko-KR',
    },
  },
  openGraph: {
    title: 'Hawaii Today - Your Real-Time Hawaii Dashboard',
    description: 'Get real-time weather, surf conditions, local news, events, and traffic updates for all Hawaiian islands.',
    url: 'https://www.hawaiitoday.com',
    siteName: 'Hawaii Today',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Hawaii Today Dashboard',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hawaii Today - Your Real-Time Hawaii Dashboard',
    description: 'Get real-time weather, surf conditions, local news, events, and traffic updates for all Hawaiian islands.',
    images: ['/og-image.jpg'],
    creator: '@HawaiiToday',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_ID,
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Hawaii Today',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#0ea5e9',
    'theme-color': '#0ea5e9',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Hawaii Today",
              "url": "https://www.hawaiitoday.com",
              "description": "Real-time Hawaii dashboard with weather, surf, news, and events",
              "publisher": {
                "@type": "Organization",
                "name": "Hawaii Today",
                "url": "https://www.hawaiitoday.com"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.hawaiitoday.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className="font-sans antialiased bg-gradient-to-br from-ocean-50 to-sky-50 min-h-screen">
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-ocean rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">HT</span>
                  </div>
                  <h1 className="font-display font-bold text-xl text-gray-900">
                    Hawaii Today
                  </h1>
                </div>
                <nav className="hidden md:flex items-center space-x-6">
                  <a href="#weather" className="text-gray-600 hover:text-gray-900 font-medium">
                    Weather
                  </a>
                  <a href="#surf" className="text-gray-600 hover:text-gray-900 font-medium">
                    Surf
                  </a>
                  <a href="#news" className="text-gray-600 hover:text-gray-900 font-medium">
                    News
                  </a>
                  <a href="#events" className="text-gray-600 hover:text-gray-900 font-medium">
                    Events
                  </a>
                </nav>
              </div>
            </div>
          </header>

          <main className="flex-1 w-full">
            {children}
          </main>

          <footer className="bg-gray-900 text-white py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-ocean rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">HT</span>
                    </div>
                    <h3 className="font-display font-bold text-xl">Hawaii Today</h3>
                  </div>
                  <p className="text-gray-300 mb-4">
                    Your essential daily Hawaii briefing. Real-time weather, surf, news, and events for all islands.
                  </p>
                  <p className="text-gray-400 text-sm">
                    Made with aloha for Hawaii residents and visitors.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-4">Quick Links</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li><a href="/about" className="hover:text-white">About</a></li>
                    <li><a href="/privacy" className="hover:text-white">Privacy</a></li>
                    <li><a href="/terms" className="hover:text-white">Terms</a></li>
                    <li><a href="/contact" className="hover:text-white">Contact</a></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-4">Data Sources</h4>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>NOAA Weather Service</li>
                    <li>Surfline</li>
                    <li>Local News Partners</li>
                    <li>Hawaii DOT</li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                <p>&copy; {new Date().getFullYear()} Hawaii Today. All rights reserved.</p>
                <p className="text-sm mt-2">
                  Last updated: {new Date().toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' })} HST
                </p>
              </div>
            </div>
          </footer>
        </div>
        
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}