import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest, requireProvider } from '@/app/utils/auth';

// GET - Get waitlist position and status for a parent
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.userType !== 'PARENT') {
      return NextResponse.json(
        { error: 'Unauthorized - Parent access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const waitlistEntryId = searchParams.get('entryId');
    const daycareId = searchParams.get('daycareId');

    let entries;

    if (waitlistEntryId) {
      // Get specific entry
      const entry = await prisma.waitlistEntry.findFirst({
        where: {
          id: waitlistEntryId,
          parentId: user.id,
        },
        include: {
          daycare: {
            select: {
              id: true,
              name: true,
            },
          },
          program: {
            select: {
              id: true,
              name: true,
              waitlistCount: true,
            },
          },
          offers: {
            where: {
              response: null,
              offerExpiresAt: {
                gte: new Date(),
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!entry) {
        return NextResponse.json(
          { error: 'Waitlist entry not found' },
          { status: 404 }
        );
      }

      entries = [entry];
    } else {
      // Get all entries for parent (optionally filtered by daycare)
      const whereClause: any = {
        parentId: user.id,
      };

      if (daycareId) {
        whereClause.daycareId = daycareId;
      }

      entries = await prisma.waitlistEntry.findMany({
        where: whereClause,
        include: {
          daycare: {
            select: {
              id: true,
              name: true,
            },
          },
          program: {
            select: {
              id: true,
              name: true,
              waitlistCount: true,
            },
          },
          offers: {
            where: {
              response: null,
              offerExpiresAt: {
                gte: new Date(),
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          joinedAt: 'desc',
        },
      });
    }

    // Enrich with position insights
    const enrichedEntries = await Promise.all(
      entries.map(async (entry) => {
        // Check for active offers ahead in queue
        const offersAheadCount = await prisma.waitlistOffer.count({
          where: {
            waitlistEntry: {
              daycareId: entry.daycareId,
              programId: entry.programId,
              position: {
                lt: entry.position,
              },
            },
            response: null,
            offerExpiresAt: {
              gte: new Date(),
            },
          },
        });

        return {
          ...entry,
          insights: {
            totalInQueue: entry.program?.waitlistCount || 0,
            currentPosition: entry.position,
            offersInProgress: offersAheadCount,
            hasActiveOffer: entry.offers.length > 0,
            estimatedWaitTime:
              entry.estimatedWaitDays !== null
                ? `${entry.estimatedWaitDays} days`
                : 'Unknown',
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      entries: enrichedEntries,
      count: enrichedEntries.length,
    });
  } catch (error: any) {
    console.error('Get position error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch position' },
      { status: 500 }
    );
  }
}
