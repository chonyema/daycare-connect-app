import { NextRequest, NextResponse } from 'next/server';
import { handleExpiredOffers } from '@/app/utils/waitlist/offerManager';
import { sendOfferExpirationReminder } from '@/app/utils/waitlist/notifications';
import { prisma } from '@/app/lib/prisma';

/**
 * Cron job to handle expired offers
 * Should be called every hour via Vercel Cron or similar
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting expired offers check...');

    // 1. Send expiration reminders (24 hours before expiry)
    const upcomingExpirations = await prisma.waitlistOffer.findMany({
      where: {
        response: null,
        offerExpiresAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 25 * 60 * 60 * 1000), // Next 25 hours
        },
      },
      include: {
        waitlistEntry: {
          include: {
            parent: true,
            daycare: true,
          },
        },
      },
    });

    console.log(`[CRON] Found ${upcomingExpirations.length} upcoming expirations`);

    for (const offer of upcomingExpirations) {
      const hoursRemaining = Math.floor(
        (new Date(offer.offerExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60)
      );

      // Send reminder if between 23-25 hours remaining and not already reminded
      if (hoursRemaining >= 23 && hoursRemaining <= 25) {
        try {
          await sendOfferExpirationReminder({ offer });
          console.log(`[CRON] Sent expiration reminder for offer ${offer.id}`);
        } catch (error) {
          console.error(`[CRON] Failed to send reminder for offer ${offer.id}:`, error);
        }
      }
    }

    // 2. Handle expired offers
    await handleExpiredOffers();
    console.log('[CRON] Expired offers processed');

    // 3. Get stats
    const stats = await prisma.waitlistOffer.groupBy({
      by: ['response'],
      _count: true,
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Expired offers processed successfully',
      stats: {
        reminders_sent: upcomingExpirations.length,
        offers_last_24h: stats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[CRON] Error processing expired offers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process expired offers' },
      { status: 500 }
    );
  }
}
