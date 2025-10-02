import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET - Fetch today's attendance for a daycare (provider view)
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as {
      userId: string;
    };

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { userType: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const daycareId = searchParams.get('daycareId');

    if (!daycareId) {
      return NextResponse.json({ error: 'Daycare ID is required' }, { status: 400 });
    }

    // Verify provider owns the daycare
    if (user.userType === 'PROVIDER') {
      const daycare = await prisma.daycare.findUnique({
        where: { id: daycareId },
      });

      if (!daycare || daycare.ownerId !== decoded.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch today's attendance
    const attendance = await prisma.attendance.findMany({
      where: {
        daycareId,
        checkInTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            childName: true,
            childAge: true,
            parent: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        checkInUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });

    // Get all active bookings for comparison
    const activeBookings = await prisma.booking.findMany({
      where: {
        daycareId,
        status: 'CONFIRMED',
        startDate: {
          lte: today,
        },
        OR: [
          { endDate: null },
          { endDate: { gte: today } },
        ],
      },
      select: {
        id: true,
        childName: true,
        childAge: true,
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Separate checked in vs checked out
    const checkedIn = attendance.filter(a => a.status === 'CHECKED_IN');
    const checkedOut = attendance.filter(a => a.status === 'CHECKED_OUT' || a.status === 'LATE');
    const absent = activeBookings.filter(
      booking => !attendance.some(a => a.bookingId === booking.id)
    );

    return NextResponse.json({
      success: true,
      date: today.toISOString(),
      summary: {
        total: attendance.length,
        checkedIn: checkedIn.length,
        checkedOut: checkedOut.length,
        absent: absent.length,
        expectedTotal: activeBookings.length,
      },
      attendance: {
        checkedIn,
        checkedOut,
        absent: absent.map(booking => ({
          booking,
          status: 'ABSENT',
        })),
      },
    });
  } catch (error: any) {
    console.error('Today attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today\'s attendance', details: error.message },
      { status: 500 }
    );
  }
}
