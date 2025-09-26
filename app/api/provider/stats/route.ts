import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest, requireProvider } from '../../../utils/auth';

// GET /api/provider/stats - Get provider dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const provider = requireProvider(user);
    const providerId = provider.id;
    
    // Get provider's daycares
    const daycares = await prisma.daycare.findMany({
      where: {
        ownerId: providerId,
      },
      select: {
        id: true,
        capacity: true,
        currentOccupancy: true,
        dailyRate: true,
      }
    });

    if (daycares.length === 0) {
      return NextResponse.json({
        totalRevenue: 0,
        activeBookings: 0,
        pendingRequests: 0,
        occupancyRate: 0,
        totalCapacity: 0,
        totalOccupied: 0,
      });
    }

    const daycareIds = daycares.map(d => d.id);

    // Get booking statistics
    const [activeBookings, pendingRequests, completedBookings] = await Promise.all([
      prisma.booking.count({
        where: {
          daycareId: { in: daycareIds },
          status: 'CONFIRMED',
        }
      }),
      prisma.booking.count({
        where: {
          daycareId: { in: daycareIds },
          status: 'PENDING',
        }
      }),
      prisma.booking.findMany({
        where: {
          daycareId: { in: daycareIds },
          status: 'COMPLETED',
        },
        select: {
          totalCost: true,
        }
      })
    ]);

    // Calculate revenue from completed bookings
    const totalRevenue = completedBookings.reduce((sum, booking) => {
      return sum + (booking.totalCost || 0);
    }, 0);

    // Calculate occupancy rate
    const totalCapacity = daycares.reduce((sum, daycare) => sum + daycare.capacity, 0);
    const totalOccupied = daycares.reduce((sum, daycare) => sum + daycare.currentOccupancy, 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    return NextResponse.json({
      totalRevenue,
      activeBookings,
      pendingRequests,
      occupancyRate,
      totalCapacity,
      totalOccupied,
    });
  } catch (error: any) {
    console.error('Provider stats fetch error:', error);
    
    if (error?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error?.message === 'Provider access required') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}