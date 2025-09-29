// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { CareType, BookingStatus } from '@prisma/client';
import { emailService } from '../../utils/email';
import { getUserFromRequest } from '../../utils/auth';
import { CapacityManager } from '../../utils/waitlist/capacityManager';

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
    console.log('=== BOOKING CREATION DEBUG ===');
    const body: BookingData = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
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
      console.log('Validation errors:', errors);
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    console.log('Validation passed, proceeding with daycare ID mapping...');

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

    console.log('Mapped daycare ID:', actualDaycareId);
    console.log('Parent ID:', body.parentId);

    // Verify that the parent and daycare exist
    console.log('Verifying parent and daycare exist...');
    const [parent, daycare] = await Promise.all([
      prisma.user.findUnique({ where: { id: body.parentId } }),
      prisma.daycare.findUnique({ where: { id: actualDaycareId } })
    ]);

    console.log('Parent found:', !!parent);
    console.log('Daycare found:', !!daycare);

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

    // Check capacity before creating booking
    const capacityCheck = await CapacityManager.checkCapacity({
      daycareId: actualDaycareId,
      programId: undefined, // Regular bookings don't specify program for now
      requiredSlots: 1
    });

    if (!capacityCheck.hasCapacity) {
      return NextResponse.json(
        {
          success: false,
          error: "No capacity available",
          details: `Only ${capacityCheck.availableSlots} slots available. Current enrollment: ${capacityCheck.currentOccupancy}/${capacityCheck.totalCapacity}, Pending offers: ${capacityCheck.pendingOffers}`,
          capacityInfo: capacityCheck
        },
        { status: 409 } // Conflict status for capacity issues
      );
    }

    // Create the booking in the database with atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Double-check capacity within transaction with locks
      const daycareLocked = await tx.daycare.findUnique({
        where: { id: actualDaycareId },
        select: { capacity: true, currentOccupancy: true }
      });

      if (!daycareLocked) {
        throw new Error("Daycare not found");
      }

      // Count current confirmed bookings + pending offers
      const [confirmedBookings, pendingOffers] = await Promise.all([
        tx.booking.count({
          where: {
            daycareId: actualDaycareId,
            status: { in: ['CONFIRMED', 'PENDING'] }
          }
        }),
        tx.waitlistOffer.count({
          where: {
            waitlistEntry: { daycareId: actualDaycareId },
            OR: [
              { response: 'PENDING' },
              { response: null }
            ],
            offerExpiresAt: { gt: new Date() }
          }
        })
      ]);

      const totalOccupied = confirmedBookings + pendingOffers;

      if (totalOccupied >= daycareLocked.capacity) {
        throw new Error(`Capacity exceeded: ${totalOccupied}/${daycareLocked.capacity} (including pending offers)`);
      }

      // Create the booking
      const newBooking = await tx.booking.create({
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
          select: { id: true, name: true, address: true, phone: true, email: true, ownerId: true }
        }
      }
    });

      return newBooking;
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    });

    // Send email notifications (don't block response if emails fail)
    try {
      // Get provider email
      const provider = await prisma.user.findUnique({
        where: { id: result.daycare.ownerId },
        select: { email: true, name: true }
      });

      const emailData = {
        parentName: result.parent.name || 'Parent',
        childName: result.childName,
        daycareName: result.daycare.name,
        startDate: result.startDate.toISOString(),
        endDate: result.endDate?.toISOString() || result.startDate.toISOString(),
        dailyRate: result.dailyRate,
        totalCost: result.totalCost || result.dailyRate,
        parentEmail: result.parent.email,
        providerEmail: provider?.email,
      };

      // Send notification to parent (confirmation they submitted the request)
      await emailService.sendBookingConfirmationToParent(emailData);

      // Send notification to provider (new booking request)
      if (provider?.email) {
        await emailService.sendBookingNotificationToProvider(emailData);
      }

    } catch (emailError) {
      console.error('Failed to send booking emails:', emailError);
      // Continue - don't fail booking creation because of email issues
    }
    
    return NextResponse.json({
      success: true,
      booking: result,
      message: "Booking created successfully!"
    });

  } catch (error: any) {
    console.error('Booking creation error:', error);

    // Return more specific error information for debugging
    let errorMessage = "Failed to create booking. Please try again.";
    let statusCode = 500;

    if (error.message) {
      if (error.message.includes('Capacity exceeded')) {
        errorMessage = error.message;
        statusCode = 409;
      } else if (error.message.includes('not found')) {
        errorMessage = error.message;
        statusCode = 404;
      } else if (error.message.includes('Unique constraint') || error.code === 'P2002') {
        errorMessage = "A booking with these details already exists.";
        statusCode = 409;
      } else {
        // Include actual error message for debugging (remove in production)
        errorMessage = `Failed to create booking: ${error.message}`;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const daycareId = searchParams.get('daycareId');
    const status = searchParams.get('status');

    // Build the where clause for filtering - always filter by authenticated user's ID
    const where: any = {
      parentId: user.id // Only return bookings for the authenticated user
    };

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

  } catch (error: any) {
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
