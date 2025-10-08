import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '../../../utils/auth';

/**
 * GET /api/parent/dashboard
 *
 * Returns aggregated dashboard data for parents including:
 * - Active bookings count
 * - Upcoming check-ins today
 * - Unread messages count
 * - Pending waitlist offers
 * - Children summary
 * - Recent daily reports
 * - Today's schedule
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Allow both PARENT and PROVIDER users (providers can switch to parent view)
    if (user.userType !== 'PARENT' && user.userType !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Parent or provider access required' },
        { status: 403 }
      );
    }

    const userId = user.id;

    // Get active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        parentId: userId,
        status: 'CONFIRMED',
      },
    });

    // Get children from bookings (using parentContact to match)
    const bookings = await prisma.booking.findMany({
      where: {
        parentId: userId,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      include: {
        daycare: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    // Build children summary
    const childrenMap = new Map();
    for (const booking of bookings) {
      if (!childrenMap.has(booking.childName)) {
        childrenMap.set(booking.childName, {
          id: booking.id,
          name: booking.childName,
          age: booking.childAge || 'Not specified',
          daycareName: booking.daycare.name,
          daycareId: booking.daycare.id,
          status: booking.status === 'CONFIRMED' ? 'UPCOMING' : 'NOT_SCHEDULED',
          nextCheckIn: booking.startDate.toISOString(),
        });
      }
    }
    const children = Array.from(childrenMap.values());

    // Count upcoming check-ins (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingCheckIns = bookings.filter((b) => {
      const startDate = new Date(b.startDate);
      return startDate >= today && startDate < tomorrow;
    }).length;

    // Get unread messages count
    const unreadMessages = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    // Get pending waitlist offers
    const pendingWaitlistOffers = await prisma.waitlistEntry.count({
      where: {
        parentId: userId,
        status: 'OFFERED',
      },
    });

    // Get recent daily reports
    const recentReports = await prisma.dailyReport.findMany({
      where: {
        booking: {
          parentId: userId,
        },
        reportDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        daycare: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        reportDate: 'desc',
      },
      take: 5,
    });

    const formattedReports = recentReports.map((report) => ({
      id: report.id,
      childName: report.childName,
      daycareName: report.daycare.name,
      mood: report.overallMood,
      notes: report.generalNotes,
      reportDate: report.reportDate.toISOString(),
    }));

    // Build today's schedule
    const todaySchedule = bookings
      .filter((b) => {
        const startDate = new Date(b.startDate);
        return startDate >= today && startDate < tomorrow;
      })
      .map((b) => ({
        id: b.id,
        childName: b.childName,
        daycareName: b.daycare.name,
        checkInTime: new Date(b.startDate).toLocaleTimeString(),
        checkOutTime: b.endDate ? new Date(b.endDate).toLocaleTimeString() : 'TBD',
        status: 'PENDING',
      }));

    return NextResponse.json({
      activeBookings,
      upcomingCheckIns,
      unreadMessages,
      pendingWaitlistOffers,
      children,
      recentReports: formattedReports,
      todaySchedule,
    });
  } catch (error: any) {
    console.error('Parent dashboard error:', error);

    if (error?.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    );
  }
}
