/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@upstash/redis']
  },
  images: {
    domains: [
      'www.noaa.gov',
      'surfline.com',
      'goakamai.org', 
      'images.unsplash.com',
      'www.hawaiinewsnow.com',
      'www.khon2.com',
      'www.kitv.com',
      'www.staradvertiser.com'
    ],
    formats: ['image/webp', 'image/avif']
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.surfline.com https://api.weather.gov https://vitals.vercel-insights.com",
              "frame-src 'self' https://www.google.com https://googleads.g.doubleclick.net"
            ].join('; ')
          }
        ]
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap'
      },
      {
        source: '/rss.xml',
        destination: '/api/rss'
      }
    ];
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  env: {
    CUSTOM_TIMEZONE: 'Pacific/Honolulu'
  }
};

const sentryWebpackPluginOptions = {
  silent: true,
  org: 'hawaii-today',
  project: 'hawaii-today-web'
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);