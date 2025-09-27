import { NextRequest, NextResponse } from 'next/server';
import { CapacityManager } from '@/app/utils/waitlist/capacityManager';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify this is called from a trusted source (you might want to add auth/API key)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('Starting waitlist cleanup job...');

    // Clean up expired offers
    const cleanupResult = await CapacityManager.cleanupExpiredOffers();

    const results = {
      expiredOffersReleased: cleanupResult.releasedCount,
      timestamp: new Date().toISOString()
    };

    console.log('Waitlist cleanup completed:', results);

    return NextResponse.json({
      success: true,
      message: `Cleanup completed - ${cleanupResult.releasedCount} expired offers processed`,
      data: results
    });

  } catch (error: any) {
    console.error('Waitlist cleanup failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Cleanup failed",
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Manual trigger for testing (GET request)
export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: "Not available in production" },
        { status: 403 }
      );
    }

    console.log('Manual waitlist cleanup triggered...');

    const cleanupResult = await CapacityManager.cleanupExpiredOffers();

    return NextResponse.json({
      success: true,
      message: `Manual cleanup completed - ${cleanupResult.releasedCount} expired offers processed`,
      data: {
        expiredOffersReleased: cleanupResult.releasedCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Manual cleanup failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Manual cleanup failed",
        details: error.message
      },
      { status: 500 }
    );
  }
}