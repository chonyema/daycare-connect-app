import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET - Fetch attendance records
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
    const bookingId = searchParams.get('bookingId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date'); // For specific date

    let whereClause: any = {};

    // Filter by daycare (for providers)
    if (daycareId) {
      // Verify provider owns the daycare
      if (user.userType === 'PROVIDER') {
        const daycare = await prisma.daycare.findUnique({
          where: { id: daycareId },
        });

        if (!daycare || daycare.ownerId !== decoded.userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }
      whereClause.daycareId = daycareId;
    }

    // Filter by booking (for parents)
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      if (user.userType === 'PARENT' && booking.parentId !== decoded.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      whereClause.bookingId = bookingId;
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by date range or specific date
    if (date) {
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);

      whereClause.checkInTime = {
        gte: selectedDate,
        lt: nextDate,
      };
    } else {
      if (startDate && endDate) {
        whereClause.checkInTime = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      } else if (startDate) {
        whereClause.checkInTime = {
          gte: new Date(startDate),
        };
      } else if (endDate) {
        whereClause.checkInTime = {
          lte: new Date(endDate),
        };
      }
    }

    // If parent, show only their bookings
    if (user.userType === 'PARENT' && !bookingId) {
      whereClause.booking = {
        parentId: decoded.userId,
      };
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
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
        daycare: {
          select: {
            id: true,
            name: true,
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

    return NextResponse.json({
      success: true,
      attendance,
      count: attendance.length,
    });
  } catch (error: any) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records', details: error.message },
      { status: 500 }
    );
  }
}
