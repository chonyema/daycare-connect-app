import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireProvider } from '../../../utils/auth';
import { emailService } from '../../../utils/email';

const prisma = new PrismaClient();

// GET /api/provider/bookings - Get provider's bookings
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const provider = requireProvider(user);
    const providerId = provider.id;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const daycareId = searchParams.get('daycareId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      daycare: {
        ownerId: providerId
      }
    };

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (daycareId && daycareId !== 'ALL') {
      whereClause.daycareId = daycareId;
    }

    // Get bookings with pagination
    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          daycare: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              phone: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.booking.count({
        where: whereClause
      })
    ]);

    // Get status counts for summary
    const statusCounts = await prisma.booking.groupBy({
      by: ['status'],
      where: {
        daycare: {
          ownerId: providerId
        }
      },
      _count: {
        status: true
      }
    });

    const statusSummary = {
      ALL: totalCount,
      PENDING: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
      COMPLETED: 0,
      WAITLIST: 0
    };

    statusCounts.forEach(item => {
      statusSummary[item.status as keyof typeof statusSummary] = item._count.status;
    });

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      statusSummary
    });

  } catch (error: any) {
    console.error('Provider bookings fetch error:', error);

    if (error?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (error?.message === 'Provider access required') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// PATCH /api/provider/bookings - Update booking status
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const provider = requireProvider(user);
    const providerId = provider.id;

    const body = await request.json();
    const { bookingId, status, notes } = body;

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'WAITLIST'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid booking status' },
        { status: 400 }
      );
    }

    // First, verify the booking belongs to this provider
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        daycare: {
          ownerId: providerId
        }
      },
      include: {
        parent: {
          select: {
            name: true,
            email: true,
          }
        },
        daycare: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      );
    }

    // Check capacity before confirming booking
    if (status === 'CONFIRMED' && existingBooking.status !== 'CONFIRMED') {
      // Get current confirmed bookings count
      const confirmedBookingsCount = await prisma.booking.count({
        where: {
          daycareId: existingBooking.daycareId,
          status: 'CONFIRMED'
        }
      });

      // Get daycare capacity
      const daycare = await prisma.daycare.findUnique({
        where: { id: existingBooking.daycareId },
        select: { capacity: true, name: true }
      });

      if (daycare && confirmedBookingsCount >= daycare.capacity) {
        return NextResponse.json(
          {
            error: `Cannot confirm booking. ${daycare.name} is at full capacity (${daycare.capacity} spots). Please add the child to the waitlist instead.`,
            suggestWaitlist: true
          },
          { status: 400 }
        );
      }
    }

    // Update the booking
    const booking = await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status,
        notes: notes || undefined,
        updatedAt: new Date(),
      },
      include: {
        parent: {
          select: {
            name: true,
            email: true,
          }
        },
        daycare: {
          select: {
            name: true,
          }
        }
      }
    });

    // Update daycare occupancy based on status change
    if (status === 'CONFIRMED' && existingBooking.status !== 'CONFIRMED') {
      // Booking was confirmed - increase occupancy
      await prisma.daycare.update({
        where: { id: existingBooking.daycareId },
        data: {
          currentOccupancy: {
            increment: 1
          }
        }
      });
    } else if (existingBooking.status === 'CONFIRMED' && status !== 'CONFIRMED') {
      // Booking was un-confirmed (cancelled/waitlisted) - decrease occupancy
      await prisma.daycare.update({
        where: { id: existingBooking.daycareId },
        data: {
          currentOccupancy: {
            decrement: 1
          }
        }
      });
    }

    // Send notification email to parent about status change
    try {
      const emailData = {
        parentName: booking.parent.name || 'Parent',
        childName: booking.childName,
        daycareName: booking.daycare.name,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate?.toISOString() || booking.startDate.toISOString(),
        dailyRate: booking.dailyRate,
        totalCost: booking.totalCost || booking.dailyRate,
      };

      await emailService.sendBookingStatusUpdate(
        booking.parent.email,
        status.toLowerCase(),
        emailData
      );
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the booking update if email fails
    }

    return NextResponse.json({
      success: true,
      booking,
      message: `Booking ${status.toLowerCase()}`
    });
  } catch (error: any) {
    console.error('Booking update error:', error);

    if (error?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (error?.message === 'Provider access required') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}