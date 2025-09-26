import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '../../../utils/auth';

// GET /api/provider/parents - Get all parents who have bookings with this provider's daycares
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user || user.userType !== 'PROVIDER') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 });
    }

    // Get all unique parents who have bookings with this provider's daycares
    const parents = await prisma.user.findMany({
      where: {
        userType: 'PARENT',
        bookings: {
          some: {
            daycare: {
              ownerId: user.id
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bookings: {
          where: {
            daycare: {
              ownerId: user.id
            }
          },
          select: {
            id: true,
            childName: true,
            childAge: true,
            status: true,
            daycare: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Format the data to group children by parent
    const formattedParents = parents.map(parent => ({
      id: parent.id,
      name: parent.name,
      email: parent.email,
      phone: parent.phone,
      children: parent.bookings.map(booking => ({
        bookingId: booking.id,
        childName: booking.childName,
        childAge: booking.childAge,
        status: booking.status,
        daycare: booking.daycare
      }))
    }));

    return NextResponse.json({
      success: true,
      parents: formattedParents
    });

  } catch (error: any) {
    console.error('Provider parents fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parents' },
      { status: 500 }
    );
  }
}