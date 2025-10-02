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
    };

    // Get request body
    const body = await req.json();
    const { attendanceId, checkOutNotes } = body;

    if (!attendanceId) {
      return NextResponse.json({ error: 'Attendance ID is required' }, { status: 400 });
    }

    // Get the attendance record
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        booking: {
          include: {
            daycare: true,
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    // Verify user has permission
    if (user.userType === 'PROVIDER' && attendance.booking.daycare.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (user.userType === 'PARENT' && attendance.booking.parentId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if already checked out
    if (attendance.status === 'CHECKED_OUT') {
      return NextResponse.json(
        { error: 'Child is already checked out' },
        { status: 400 }
      );
    }

    const checkOutTime = new Date();
    const checkInTime = attendance.checkInTime;

    // Calculate total hours
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

    // Check for late pickup
    let isLatePickup = false;
    let lateMinutes = null;

    if (attendance.scheduledPickupTime) {
      const scheduledTime = new Date(attendance.scheduledPickupTime);
      if (checkOutTime > scheduledTime) {
        isLatePickup = true;
        const lateDiffMs = checkOutTime.getTime() - scheduledTime.getTime();
        lateMinutes = Math.floor(lateDiffMs / (1000 * 60));
      }
    }

    // Update attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        checkOutTime,
        checkOutBy: decoded.userId,
        checkOutNotes: checkOutNotes || null,
        totalHours,
        status: isLatePickup ? 'LATE' : 'CHECKED_OUT',
        isLatePickup,
        lateMinutes,
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
      attendance: updatedAttendance,
      message: `${attendance.childName} checked out successfully`,
      totalHours,
      isLatePickup,
      lateMinutes,
    });
  } catch (error: any) {
    console.error('Check-out error:', error);
    return NextResponse.json(
      { error: 'Failed to check out', details: error.message },
      { status: 500 }
    );
  }
}
