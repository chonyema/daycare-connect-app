import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { BookingStatus } from '@prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentId, daycareId, childName, childAge, careType, notes } = body;

    if (!parentId || !daycareId || !childName) {
      return NextResponse.json(
        { success: false, error: "Parent ID, Daycare ID, and child name are required" },
        { status: 400 }
      );
    }

    // Handle daycare ID mapping (like in bookings)
    let actualDaycareId = daycareId;
    if (typeof daycareId === 'number' || !isNaN(Number(daycareId))) {
      const allDaycares = await prisma.daycare.findMany({
        select: { id: true },
        orderBy: { createdAt: 'asc' }
      });
      
      const daycareIndex = Number(daycareId) - 1;
      if (daycareIndex >= 0 && daycareIndex < allDaycares.length) {
        actualDaycareId = allDaycares[daycareIndex].id;
      }
    }

    // Get the daycare info for pricing
    const daycare = await prisma.daycare.findUnique({
      where: { id: actualDaycareId }
    });

    if (!daycare) {
      return NextResponse.json(
        { success: false, error: "Daycare not found" },
        { status: 404 }
      );
    }

    // Check if user is already on waitlist
    const existingWaitlist = await prisma.booking.findFirst({
      where: {
        parentId,
        daycareId: actualDaycareId,
        status: BookingStatus.WAITLIST
      }
    });

    if (existingWaitlist) {
      return NextResponse.json(
        { success: false, error: "You are already on the waitlist for this daycare" },
        { status: 400 }
      );
    }

    // Create a waitlist booking
    const waitlistBooking = await prisma.booking.create({
      data: {
        parentId,
        daycareId: actualDaycareId,
        childName,
        childAge: childAge || null,
        startDate: new Date(), // Current date for waitlist
        careType: careType || 'FULL_TIME',
        status: BookingStatus.WAITLIST,
        dailyRate: daycare.dailyRate,
        notes: notes ? `Waitlist: ${notes}` : 'Joined waitlist'
      },
      include: {
        parent: {
          select: { name: true, email: true }
        },
        daycare: {
          select: { name: true, address: true }
        }
      }
    });

    // Update daycare waitlist count
    await prisma.daycare.update({
      where: { id: actualDaycareId },
      data: {
        waitlistCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully joined waitlist for ${daycare.name}`,
      waitlistBooking
    });

  } catch (error: any) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json(
        { success: false, error: "Parent ID is required" },
        { status: 400 }
      );
    }

    const waitlistBookings = await prisma.booking.findMany({
      where: {
        parentId,
        status: BookingStatus.WAITLIST
      },
      include: {
        daycare: {
          select: {
            name: true,
            address: true,
            city: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      waitlistBookings
    });

  } catch (error: any) {
    console.error('Get waitlist error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to get waitlist" },
      { status: 500 }
    );
  }
}