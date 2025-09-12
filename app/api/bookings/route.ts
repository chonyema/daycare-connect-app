// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { CareType, BookingStatus } from '@prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Interface for booking data from the frontend
interface BookingData {
  childName: string;
  childAge?: string;
  startDate: string;
  endDate?: string;
  careType: string;
  daycareId: string;
  parentId: string;
  dailyRate: number;
  totalCost?: number;
  notes?: string;
  specialNeeds?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingData = await request.json();
    
    // Validation
    const errors: string[] = [];
    
    if (!body.childName || body.childName.trim().length < 2) {
      errors.push("Child's name must be at least 2 characters long");
    }
    
    if (!body.startDate) {
      errors.push("Start date is required");
    } else {
      const startDate = new Date(body.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        errors.push("Start date cannot be in the past");
      }
    }
    
    if (!body.careType || !Object.values(CareType).includes(body.careType as CareType)) {
      errors.push("Valid care type is required");
    }
    
    if (!body.daycareId) {
      errors.push("Daycare selection is required");
    }
    
    if (!body.parentId) {
      errors.push("Parent ID is required");
    }
    
    if (!body.dailyRate || body.dailyRate <= 0) {
      errors.push("Valid daily rate is required");
    }
    
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    // Handle daycare ID mapping (frontend uses numeric IDs, database uses string IDs)
    let actualDaycareId = body.daycareId;
    
    // If numeric ID is sent, map it to the actual database ID
    if (typeof body.daycareId === 'number' || !isNaN(Number(body.daycareId))) {
      const allDaycares = await prisma.daycare.findMany({
        select: { id: true },
        orderBy: { createdAt: 'asc' }
      });
      
      const daycareIndex = Number(body.daycareId) - 1; // Convert 1-based to 0-based
      if (daycareIndex >= 0 && daycareIndex < allDaycares.length) {
        actualDaycareId = allDaycares[daycareIndex].id;
      } else {
        return NextResponse.json(
          { success: false, error: "Invalid daycare selection" },
          { status: 400 }
        );
      }
    }

    // Verify that the parent and daycare exist
    const [parent, daycare] = await Promise.all([
      prisma.user.findUnique({ where: { id: body.parentId } }),
      prisma.daycare.findUnique({ where: { id: actualDaycareId } })
    ]);

    if (!parent) {
      return NextResponse.json(
        { success: false, error: "Parent not found" },
        { status: 404 }
      );
    }

    if (!daycare) {
      return NextResponse.json(
        { success: false, error: "Daycare not found" },
        { status: 404 }
      );
    }

    // Create the booking in the database
    const newBooking = await prisma.booking.create({
      data: {
        parentId: body.parentId,
        daycareId: actualDaycareId,
        childName: body.childName,
        childAge: body.childAge,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        careType: body.careType as CareType,
        status: BookingStatus.PENDING,
        dailyRate: body.dailyRate,
        totalCost: body.totalCost,
        notes: body.notes,
        specialNeeds: body.specialNeeds
      },
      include: {
        parent: {
          select: { id: true, name: true, email: true }
        },
        daycare: {
          select: { id: true, name: true, address: true, phone: true }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      booking: newBooking,
      message: "Booking created successfully!"
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create booking. Please try again." 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId');
    const daycareId = searchParams.get('daycareId');
    const status = searchParams.get('status');
    
    // Build the where clause for filtering
    const where: any = {};
    
    if (parentId) {
      where.parentId = parentId;
    }
    
    if (daycareId) {
      where.daycareId = daycareId;
    }
    
    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      where.status = status as BookingStatus;
    }
    
    // Fetch bookings from database
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        parent: {
          select: { id: true, name: true, email: true, phone: true }
        },
        daycare: {
          select: { 
            id: true, 
            name: true, 
            address: true, 
            city: true,
            phone: true, 
            email: true,
            dailyRate: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      bookings
    });

  } catch (error) {
    console.error('Fetch bookings error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch bookings" 
      },
      { status: 500 }
    );
  }
} 
