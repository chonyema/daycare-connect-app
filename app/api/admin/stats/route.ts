import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireSuperAdmin } from '@/app/lib/rbac/authorization';

// GET - Get system statistics
export async function GET(request: NextRequest) {
  const authCheck = await requireSuperAdmin(request);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: 401 }
    );
  }

  try {
    const [
      totalUsers,
      activeUsers,
      totalDaycares,
      activeDaycares,
      totalBookings,
      totalWaitlistEntries,
      totalReviews,
      usersByRole,
      usersByType,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.daycare.count(),
      prisma.daycare.count({ where: { active: true } }),
      prisma.booking.count(),
      prisma.waitlistEntry.count(),
      prisma.review.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.user.groupBy({
        by: ['userType'],
        _count: true,
      }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Get growth metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [newUsers, newDaycares, newBookings] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.daycare.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.booking.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          new30Days: newUsers,
          byRole: usersByRole.reduce((acc: any, curr: any) => {
            acc[curr.role] = curr._count;
            return acc;
          }, {}),
          byType: usersByType.reduce((acc: any, curr: any) => {
            acc[curr.userType] = curr._count;
            return acc;
          }, {}),
        },
        daycares: {
          total: totalDaycares,
          active: activeDaycares,
          inactive: totalDaycares - activeDaycares,
          new30Days: newDaycares,
        },
        bookings: {
          total: totalBookings,
          new30Days: newBookings,
        },
        waitlist: {
          total: totalWaitlistEntries,
        },
        reviews: {
          total: totalReviews,
        },
        recentActivity,
      },
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: error.message },
      { status: 500 }
    );
  }
}
