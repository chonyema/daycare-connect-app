import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '../../utils/auth';

// GET /api/daily-reports - Get daily reports
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get('bookingId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause: any = {};

    if (user.userType === 'PROVIDER') {
      whereClause.providerId = user.id;
    } else if (user.userType === 'PARENT') {
      whereClause.booking = {
        parentId: user.id
      };
    }

    if (bookingId) {
      whereClause.bookingId = bookingId;
    }

    if (startDate || endDate) {
      whereClause.reportDate = {};
      if (startDate) {
        whereClause.reportDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.reportDate.lte = new Date(endDate);
      }
    }

    const reports = await prisma.dailyReport.findMany({
      where: whereClause,
      include: {
        activities: {
          orderBy: {
            startTime: 'asc'
          }
        },
        booking: {
          select: {
            id: true,
            childName: true,
            childAge: true,
            parent: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        daycare: {
          select: {
            id: true,
            name: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        reportDate: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      reports
    });

  } catch (error: any) {
    console.error('Daily reports fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch daily reports' },
      { status: 500 }
    );
  }
}

// POST /api/daily-reports - Create a new daily report
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.userType !== 'PROVIDER') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      bookingId,
      reportDate,
      overallMood,
      generalNotes,
      activities = []
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Verify the booking belongs to the provider's daycare
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        daycare: {
          ownerId: user.id
        }
      },
      include: {
        daycare: true
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or access denied' }, { status: 404 });
    }

    const reportDateObj = reportDate ? new Date(reportDate) : new Date();

    // Check if report already exists for this date
    const existingReport = await prisma.dailyReport.findFirst({
      where: {
        bookingId,
        reportDate: {
          gte: new Date(reportDateObj.toDateString()),
          lt: new Date(new Date(reportDateObj.toDateString()).getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existingReport) {
      return NextResponse.json({
        error: 'Daily report already exists for this date'
      }, { status: 409 });
    }

    // Create the daily report with activities
    const dailyReport = await prisma.dailyReport.create({
      data: {
        bookingId,
        daycareId: booking.daycareId,
        providerId: user.id,
        childName: booking.childName,
        childAge: booking.childAge || '',
        reportDate: reportDateObj,
        overallMood,
        generalNotes,
        activities: {
          create: activities.map((activity: any) => ({
            activityType: activity.activityType,
            title: activity.title,
            description: activity.description,
            startTime: new Date(activity.startTime),
            endTime: activity.endTime ? new Date(activity.endTime) : undefined,
            duration: activity.duration,
            mealType: activity.mealType,
            foodItems: activity.foodItems ? JSON.stringify(activity.foodItems) : undefined,
            amountEaten: activity.amountEaten,
            napQuality: activity.napQuality,
            photos: activity.photos ? JSON.stringify(activity.photos) : undefined,
            documents: activity.documents ? JSON.stringify(activity.documents) : undefined,
            notes: activity.notes
          }))
        }
      },
      include: {
        activities: true,
        booking: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        daycare: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      report: dailyReport
    });

  } catch (error: any) {
    console.error('Daily report creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create daily report' },
      { status: 500 }
    );
  }
}