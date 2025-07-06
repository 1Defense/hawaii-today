/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  },
  images: {
    domains: [
      'www.noaa.gov',
      'surfline.com',
      'images.unsplash.com',
      'www.hawaiinewsnow.com',
      'www.khon2.com',
      'www.kitv.com',
      'www.staradvertiser.com'
    ],
    formats: ['image/webp', 'image/avif']
  },
  compress: true,
  poweredByHeader: false,
  env: {
    CUSTOM_TIMEZONE: 'Pacific/Honolulu'
  }
};

module.exports = nextConfig;
