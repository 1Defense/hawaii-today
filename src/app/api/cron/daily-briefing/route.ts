import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/services/emailService';

// This endpoint should be called by a cron service (Vercel Cron, GitHub Actions, etc.)
// Schedule: 0 16 * * * (6 AM HST = 4 PM UTC)

export async function POST(request: NextRequest) {
  try {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting daily briefing cron job...');
    
    // Send daily briefings
    const result = await emailService.sendDailyBriefing();
    
    // Log results
    console.log(`Daily briefing completed: ${result.sent} sent, ${result.failed} failed`);
    
    // Send summary push notification to admins if there were failures
    if (result.failed > 0) {
      await emailService.sendPushNotification({
        title: 'Hawaii Today Admin Alert',
        body: `Daily briefing: ${result.sent} sent, ${result.failed} failed`,
        tag: 'admin-alert'
      }, ['admin']);
    }

    return NextResponse.json({
      success: true,
      message: 'Daily briefing sent successfully',
      stats: {
        sent: result.sent,
        failed: result.failed,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Daily briefing cron error:', error);
    
    // Send error notification to admins
    try {
      await emailService.sendPushNotification({
        title: 'Hawaii Today System Error',
        body: 'Daily briefing cron job failed',
        tag: 'system-error'
      }, ['admin']);
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError);
    }

    return NextResponse.json(
      { 
        error: 'Daily briefing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Manual trigger for testing (requires admin auth)
export async function GET(request: NextRequest) {
  try {
    // Check if this is a manual trigger from admin
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('admin_key');
    
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log('Manual daily briefing trigger...');
    
    const result = await emailService.sendDailyBriefing();
    
    return NextResponse.json({
      success: true,
      message: 'Manual daily briefing completed',
      stats: {
        sent: result.sent,
        failed: result.failed,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Manual briefing trigger error:', error);
    
    return NextResponse.json(
      { 
        error: 'Manual briefing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}