import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/services/emailService';
import { Island } from '@/types';

// Rate limiting storage (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const rateLimitData = rateLimitMap.get(ip);

  if (!rateLimitData || now > rateLimitData.resetTime) {
    // Reset or create new rate limit window
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (rateLimitData.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  rateLimitData.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  // Get IP from various headers (depending on deployment)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  return realIP || cfConnectingIP || '127.0.0.1';
}

// Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP, 5, 60000)) { // 5 requests per minute
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, island = 'oahu' } = body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    if (!['oahu', 'maui', 'hawaii', 'kauai', 'molokai', 'lanai'].includes(island)) {
      return NextResponse.json(
        { error: 'Invalid island selection' },
        { status: 400 }
      );
    }

    // Subscribe email
    const result = await emailService.subscribeEmail(email.toLowerCase().trim(), island as Island);

    if (result.success) {
      // Track subscription analytics (in production, send to analytics service)
      console.log(`Newsletter subscription: ${email} for ${island}`);
      
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    return NextResponse.json(
      { error: 'Subscription failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Unsubscribe from newsletter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    const result = await emailService.unsubscribeEmail(email.toLowerCase().trim(), token || undefined);

    if (result.success) {
      // Track unsubscription analytics
      console.log(`Newsletter unsubscription: ${email}`);
      
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Newsletter unsubscription error:', error);
    
    return NextResponse.json(
      { error: 'Unsubscription failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Get newsletter statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('admin_key');

    // Check admin authentication
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get subscriber statistics
    const totalSubscribers = emailService.getSubscriberCount();

    return NextResponse.json({
      success: true,
      stats: {
        totalSubscribers,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Newsletter stats error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get newsletter statistics' },
      { status: 500 }
    );
  }
}