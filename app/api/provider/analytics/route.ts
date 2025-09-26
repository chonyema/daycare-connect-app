import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireProvider } from '../../../utils/auth';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const provider = requireProvider(user);
    const providerId = provider.id;

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    let startDate: Date;
    let endDate = new Date();

    switch (range) {
      case '7d':
        startDate = subDays(endDate, 7);
        break;
      case '30d':
        startDate = subDays(endDate, 30);
        break;
      case '90d':
        startDate = subDays(endDate, 90);
        break;
      case '1y':
        startDate = subDays(endDate, 365);
        break;
      default:
        startDate = subDays(endDate, 30);
    }

    // Get provider's daycares
    const daycares = await prisma.daycare.findMany({
      where: { ownerId: providerId },
      select: { id: true, name: true, capacity: true, dailyRate: true }
    });

    const daycareIds = daycares.map(d => d.id);

    if (daycareIds.length === 0) {
      return NextResponse.json({
        revenue: { total: 0, growth: 0, monthly: [] },
        bookings: { total: 0, confirmed: 0, pending: 0, cancelled: 0, daily: [] },
        occupancy: { current: 0, capacity: 0, rate: 0, trend: [] },
        ratings: { average: 0, total: 0, distribution: [] },
        demographics: { ageGroups: [], careTypes: [] }
      });
    }

    // Revenue Analytics
    const bookings = await prisma.booking.findMany({
      where: {
        daycareId: { in: daycareIds },
        createdAt: { gte: startDate, lte: endDate }
      },
      include: {
        daycare: { select: { name: true } },
        parent: { select: { name: true } }
      }
    });

    const totalRevenue = bookings
      .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.totalCost || 0), 0);

    // Calculate revenue growth (compare with previous period)
    const prevStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    const prevBookings = await prisma.booking.findMany({
      where: {
        daycareId: { in: daycareIds },
        createdAt: { gte: prevStartDate, lt: startDate },
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      }
    });

    const prevRevenue = prevBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // Monthly revenue data (last 12 months)
    const monthlyRevenue = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subDays(new Date(), i * 30));
      const monthEnd = endOfMonth(monthStart);
      
      const monthBookings = await prisma.booking.findMany({
        where: {
          daycareId: { in: daycareIds },
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        }
      });
      
      monthlyRevenue.push({
        month: format(monthStart, 'MMM'),
        amount: monthBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0)
      });
    }

    // Bookings Analytics
    const bookingsByStatus = {
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
      pending: bookings.filter(b => b.status === 'PENDING').length,
      cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
    };

    // Daily bookings (last 30 days or range period)
    const dailyBookings = [];
    const daysToShow = Math.min(30, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
      
      const dayBookings = bookings.filter(b => 
        b.createdAt >= dayStart && b.createdAt < dayEnd
      ).length;
      
      dailyBookings.push({
        date: format(day, 'MMM dd'),
        bookings: dayBookings
      });
    }

    // Occupancy Analytics
    const totalCapacity = daycares.reduce((sum, d) => sum + d.capacity, 0);
    const currentBookings = await prisma.booking.count({
      where: {
        daycareId: { in: daycareIds },
        status: { in: ['CONFIRMED', 'PENDING'] },
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    });

    const occupancyRate = totalCapacity > 0 ? Math.round((currentBookings / totalCapacity) * 100) : 0;

    // Occupancy trend (simplified - daily occupancy rates)
    const occupancyTrend = dailyBookings.map(day => ({
      date: day.date,
      rate: Math.min(100, Math.max(0, occupancyRate + (Math.random() - 0.5) * 20)) // Mock variation
    }));

    // Ratings Analytics
    const reviews = await prisma.review.findMany({
      where: { daycareId: { in: daycareIds } }
    });

    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length
    }));

    // Demographics
    const ageGroups = [
      { age: '0-1 years', count: bookings.filter(b => b.childAge && parseInt(b.childAge) <= 1).length },
      { age: '1-2 years', count: bookings.filter(b => b.childAge && parseInt(b.childAge) > 1 && parseInt(b.childAge) <= 2).length },
      { age: '2-3 years', count: bookings.filter(b => b.childAge && parseInt(b.childAge) > 2 && parseInt(b.childAge) <= 3).length },
      { age: '3-4 years', count: bookings.filter(b => b.childAge && parseInt(b.childAge) > 3 && parseInt(b.childAge) <= 4).length },
      { age: '4+ years', count: bookings.filter(b => b.childAge && parseInt(b.childAge) > 4).length },
    ];

    const careTypes = [
      { type: 'Full Time', count: bookings.filter(b => b.careType === 'FULL_TIME').length },
      { type: 'Part Time', count: bookings.filter(b => b.careType === 'PART_TIME').length },
      { type: 'Drop In', count: bookings.filter(b => b.careType === 'DROP_IN').length },
      { type: 'Emergency', count: bookings.filter(b => b.careType === 'EMERGENCY').length },
    ];

    const analyticsData = {
      revenue: {
        total: Math.round(totalRevenue),
        growth: Math.round(revenueGrowth * 100) / 100,
        monthly: monthlyRevenue
      },
      bookings: {
        ...bookingsByStatus,
        daily: dailyBookings
      },
      occupancy: {
        current: currentBookings,
        capacity: totalCapacity,
        rate: occupancyRate,
        trend: occupancyTrend
      },
      ratings: {
        average: Math.round(avgRating * 10) / 10,
        total: reviews.length,
        distribution: ratingDistribution
      },
      demographics: {
        ageGroups,
        careTypes
      }
    };

    return NextResponse.json(analyticsData);

  } catch (error: any) {
    console.error('Analytics error:', error);

    if (error?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (error?.message === 'Provider access required') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}