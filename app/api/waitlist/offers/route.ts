import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest, requireProvider } from '@/app/utils/auth';

// GET - List all offers (provider sees all for their daycare, parent sees theirs)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daycareId = searchParams.get('daycareId');
    const status = searchParams.get('status'); // 'active', 'expired', 'accepted', 'declined'

    let whereClause: any = {};

    if (user.userType === 'PROVIDER') {
      // Provider sees all offers for their daycares
      if (daycareId) {
        const daycare = await prisma.daycare.findFirst({
          where: {
            id: daycareId,
            ownerId: user.id,
          },
        });

        if (!daycare) {
          return NextResponse.json(
            { error: 'Daycare not found or unauthorized' },
            { status: 404 }
          );
        }

        whereClause = {
          waitlistEntry: {
            daycareId,
          },
        };
      } else {
        // All daycares owned by provider
        const daycares = await prisma.daycare.findMany({
          where: { ownerId: user.id },
          select: { id: true },
        });

        whereClause = {
          waitlistEntry: {
            daycareId: {
              in: daycares.map((d) => d.id),
            },
          },
        };
      }
    } else {
      // Parent sees only their offers
      whereClause = {
        waitlistEntry: {
          parentId: user.id,
        },
      };
    }

    // Filter by status
    if (status === 'active') {
      whereClause.response = null;
      whereClause.offerExpiresAt = { gte: new Date() };
    } else if (status === 'expired') {
      whereClause.response = 'EXPIRED';
    } else if (status === 'accepted') {
      whereClause.response = 'ACCEPTED';
    } else if (status === 'declined') {
      whereClause.response = 'DECLINED';
    }

    const offers = await prisma.waitlistOffer.findMany({
      where: whereClause,
      include: {
        waitlistEntry: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
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
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      offers,
      count: offers.length,
    });
  } catch (error: any) {
    console.error('Get offers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}
