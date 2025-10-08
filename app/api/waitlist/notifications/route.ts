import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Note: This is a basic implementation. In production, you might want to use a proper notification service
// or database table to store notifications persistently.

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType');

    if (!userId || !userType) {
      return NextResponse.json(
        { success: false, error: "User ID and user type are required" },
        { status: 400 }
      );
    }

    // For now, we'll generate notifications based on recent waitlist activity
    // In production, you'd store these in a notifications table
    const notifications = await generateWaitlistNotifications(userId, userType as 'PARENT' | 'PROVIDER');

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error: any) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to get notifications" },
      { status: 500 }
    );
  }
}

async function generateWaitlistNotifications(userId: string, userType: 'PARENT' | 'PROVIDER') {
  const notifications: any[] = [];

  if (userType === 'PARENT') {
    // Get parent's waitlist entries
    const waitlistEntries = await prisma.waitlistEntry.findMany({
      where: { parentId: userId },
      include: {
        daycare: { select: { name: true } },
        program: { select: { name: true } },
        offers: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    for (const entry of waitlistEntries) {
      // Check for recent offers
      for (const offer of entry.offers) {
        const isRecent = new Date().getTime() - offer.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
        if (isRecent) {
          // Check if offer has expired based on date
          const isExpired = new Date() > offer.offerExpiresAt;

          if (isExpired || offer.response === 'EXPIRED') {
            notifications.push({
              id: `offer-expired-${offer.id}`,
              type: 'offer_expired',
              title: 'Offer Expired',
              message: `Your spot offer for ${entry.childName} at ${entry.daycare.name} has expired. You're back on the active waitlist.`,
              timestamp: offer.offerExpiresAt,
              read: false,
              actionable: false,
              priority: 'medium',
              metadata: { offerId: offer.id, entryId: entry.id }
            });
          } else if (!offer.response || offer.response === 'PENDING') {
            notifications.push({
              id: `offer-${offer.id}`,
              type: 'offer_received',
              title: 'New Spot Offer!',
              message: `You have a new spot offer for ${entry.childName} at ${entry.daycare.name}. Expires ${offer.offerExpiresAt.toLocaleDateString()}.`,
              timestamp: offer.createdAt,
              read: false,
              actionable: false,
              priority: 'high',
              metadata: { offerId: offer.id, entryId: entry.id }
            });
          }
        }
      }

      // Check for position changes
      const positionChanges = entry.auditLogs.filter(log => log.action === 'POSITION_CHANGED');
      for (const change of positionChanges.slice(0, 2)) { // Only recent position changes
        const isRecent = new Date().getTime() - change.createdAt.getTime() < 3 * 24 * 60 * 60 * 1000; // 3 days
        if (isRecent) {
          const oldValues = change.oldValues ? JSON.parse(change.oldValues) : {};
          const newValues = change.newValues ? JSON.parse(change.newValues) : {};

          const positionChange = (oldValues.position || 0) - (newValues.position || 0);
          const moved = positionChange > 0 ? 'up' : 'down';
          const positions = Math.abs(positionChange);

          notifications.push({
            id: `position-${change.id}`,
            type: 'position_change',
            title: `Position Update`,
            message: `${entry.childName} moved ${moved} ${positions} position${positions > 1 ? 's' : ''} to #${newValues.position || entry.position} at ${entry.daycare.name}.`,
            timestamp: change.createdAt,
            read: false,
            actionable: true,
            priority: positionChange > 0 ? 'medium' : 'low',
            metadata: { entryId: entry.id, positionChange }
          });
        }
      }
    }

  } else if (userType === 'PROVIDER') {
    // Get provider's daycares
    const daycares = await prisma.daycare.findMany({
      where: {
        // Assuming the userId is the owner - you might need to adjust this based on your user model
        // For now, we'll get all daycares (this should be filtered by provider ownership)
      },
      include: {
        waitlistEntries: {
          where: {
            status: 'ACTIVE',
            joinedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          },
          include: {
            parent: { select: { name: true } }
          }
        },
        campaigns: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        }
      }
    });

    for (const daycare of daycares) {
      // New waitlist entries
      for (const entry of daycare.waitlistEntries) {
        notifications.push({
          id: `new-entry-${entry.id}`,
          type: 'general',
          title: 'New Waitlist Entry',
          message: `${entry.parent.name} added ${entry.childName} to the waitlist at ${daycare.name}.`,
          timestamp: entry.joinedAt,
          read: false,
          actionable: true,
          priority: 'low',
          metadata: { entryId: entry.id, daycareId: daycare.id }
        });
      }

      // Campaign updates
      for (const campaign of daycare.campaigns) {
        if (campaign.status === 'COMPLETED') {
          notifications.push({
            id: `campaign-completed-${campaign.id}`,
            type: 'campaign_update',
            title: 'Campaign Completed',
            message: `"${campaign.name}" campaign completed with ${campaign.totalAccepted} acceptances.`,
            timestamp: campaign.completedAt || campaign.createdAt,
            read: false,
            actionable: true,
            priority: 'medium',
            metadata: { campaignId: campaign.id, daycareId: daycare.id }
          });
        }
      }
    }
  }

  // Sort by timestamp (newest first) and limit to recent notifications
  return notifications
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20); // Limit to 20 most recent
}