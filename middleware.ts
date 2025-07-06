import { NextRequest, NextResponse } from 'next/server';

// Rate limiting storage (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  requests: number;
  windowMs: number;
}

// Different rate limits for different endpoints
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/newsletter': { requests: 5, windowMs: 60000 }, // 5 per minute
  '/api/weather': { requests: 100, windowMs: 60000 }, // 100 per minute
  '/api/surf': { requests: 100, windowMs: 60000 }, // 100 per minute  
  '/api/news': { requests: 50, windowMs: 60000 }, // 50 per minute
  '/api/events': { requests: 50, windowMs: 60000 }, // 50 per minute
  '/api/cron': { requests: 10, windowMs: 60000 }, // 10 per minute (admin only)
  default: { requests: 200, windowMs: 60000 } // 200 per minute default
};

function getClientIP(request: NextRequest): string {
  // Get IP from various headers depending on deployment environment
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  return realIP || cfConnectingIP || vercelForwardedFor || '127.0.0.1';
}

function checkRateLimit(ip: string, pathname: string): { allowed: boolean; limit: number; remaining: number; resetTime: number } {
  const now = Date.now();
  
  // Find the most specific rate limit config
  let config = RATE_LIMITS.default;
  for (const [path, pathConfig] of Object.entries(RATE_LIMITS)) {
    if (path !== 'default' && pathname.startsWith(path)) {
      config = pathConfig;
      break;
    }
  }

  const key = `${ip}:${pathname}`;
  const rateLimitData = rateLimitMap.get(key);

  if (!rateLimitData || now > rateLimitData.resetTime) {
    // Reset or create new rate limit window
    const newResetTime = now + config.windowMs;
    rateLimitMap.set(key, { count: 1, resetTime: newResetTime });
    
    return {
      allowed: true,
      limit: config.requests,
      remaining: config.requests - 1,
      resetTime: newResetTime
    };
  }

  const remaining = Math.max(0, config.requests - rateLimitData.count);
  const allowed = rateLimitData.count < config.requests;

  if (allowed) {
    rateLimitData.count++;
  }

  return {
    allowed,
    limit: config.requests,
    remaining: remaining,
    resetTime: rateLimitData.resetTime
  };
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), location=()');
  
  // HSTS header for HTTPS sites
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://www.google-analytics.com https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.weather.gov https://services.surfline.com https://api.tidesandcurrents.noaa.gov https://vitals.vercel-insights.com https://vercel.live wss://ws-us3.pusher.com",
    "frame-src 'self' https://www.google.com https://googleads.g.doubleclick.net",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/manifest') ||
    pathname.includes('.') && (
      pathname.endsWith('.ico') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.woff') ||
      pathname.endsWith('.woff2') ||
      pathname.endsWith('.ttf')
    )
  );
}

function isBotRequest(userAgent: string): boolean {
  const botPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /telegrambot/i
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  
  // Skip middleware for static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Create response
  const response = NextResponse.next();

  // Add security headers to all responses
  addSecurityHeaders(response);

  // Skip rate limiting for bots and crawlers
  if (isBotRequest(userAgent)) {
    return response;
  }

  // Apply rate limiting only to API routes
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, pathname);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetTime / 1000).toString());

    // Block if rate limit exceeded
    if (!rateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
          }
        }
      );
    }
  }

  // Add cache headers for API responses
  if (pathname.startsWith('/api/')) {
    // Most API endpoints can be cached briefly
    if (pathname.includes('/weather') || pathname.includes('/surf')) {
      response.headers.set('Cache-Control', 'public, max-age=900, s-maxage=900'); // 15 minutes
    } else if (pathname.includes('/news') || pathname.includes('/events')) {
      response.headers.set('Cache-Control', 'public, max-age=600, s-maxage=600'); // 10 minutes
    } else if (pathname.includes('/status')) {
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60'); // 1 minute
    } else {
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300'); // 5 minutes default
    }
  }

  // Add CORS headers for API routes if needed
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'https://www.hawaiitoday.com',
      'https://hawaiitoday.com',
      'http://localhost:3000', // Development
      'http://localhost:3001'  // Development
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  }

  // Add performance timing header
  response.headers.set('X-Response-Time', Date.now().toString());

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};