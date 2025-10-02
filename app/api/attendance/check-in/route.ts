import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
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

    // Get request body
    const body = await req.json();
    const {
      bookingId,
      checkInNotes,
      temperature,
      mood,
      emergencyContact,
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Verify booking exists and get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        daycare: true,
        parent: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user has permission (provider of the daycare or parent)
    if (user.userType === 'PROVIDER' && booking.daycare.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (user.userType === 'PARENT' && booking.parentId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckIn = await prisma.attendance.findFirst({
      where: {
        bookingId,
        checkInTime: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ['CHECKED_IN', 'CHECKED_OUT'],
        },
      },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        { error: 'Child is already checked in for today' },
        { status: 400 }
      );
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        bookingId,
        daycareId: booking.daycareId,
        childName: booking.childName,
        checkInTime: new Date(),
        checkInBy: decoded.userId,
        checkInNotes: checkInNotes || null,
        temperature: temperature ? parseFloat(temperature) : null,
        mood: mood || null,
        emergencyContact: emergencyContact || null,
        status: 'CHECKED_IN',
      },
      include: {
        booking: {
          select: {
            childName: true,
            childAge: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      attendance,
      message: `${booking.childName} checked in successfully`,
    });
  } catch (error: any) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to check in', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check current check-in status
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as {
      userId: string;
    };

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Get today's attendance for this booking
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        bookingId,
        checkInTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });

    return NextResponse.json({
      isCheckedIn: attendance?.status === 'CHECKED_IN',
      attendance: attendance || null,
    });
  } catch (error: any) {
    console.error('Check-in status error:', error);
    return NextResponse.json(
      { error: 'Failed to get check-in status', details: error.message },
      { status: 500 }
    );
  }
}
