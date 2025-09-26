import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireProvider } from '../../../utils/auth';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const provider = requireProvider(user);
    const providerId = provider.id;

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';
    const range = searchParams.get('range') || '30d';
    const format_type = searchParams.get('format') || 'json';

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
      include: {
        bookings: {
          where: {
            createdAt: { gte: startDate, lte: endDate }
          },
          include: {
            parent: { select: { name: true, email: true } }
          }
        },
        reviews: true
      }
    });

    let reportData: any = {};

    switch (reportType) {
      case 'summary':
        reportData = await generateSummaryReport(daycares, startDate, endDate);
        break;
      case 'revenue':
        reportData = await generateRevenueReport(daycares, startDate, endDate);
        break;
      case 'bookings':
        reportData = await generateBookingsReport(daycares, startDate, endDate);
        break;
      case 'customers':
        reportData = await generateCustomersReport(daycares, startDate, endDate);
        break;
      default:
        reportData = await generateSummaryReport(daycares, startDate, endDate);
    }

    if (format_type === 'csv') {
      const csv = generateCSV(reportData, reportType);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.csv"`
        }
      });
    }

    return NextResponse.json(reportData);

  } catch (error: any) {
    console.error('Reports error:', error);
    
    if (error?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error?.message === 'Provider access required') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateSummaryReport(daycares: any[], startDate: Date, endDate: Date) {
  const totalDaycares = daycares.length;
  const totalCapacity = daycares.reduce((sum, d) => sum + d.capacity, 0);
  
  const allBookings = daycares.flatMap(d => d.bookings);
  const totalBookings = allBookings.length;
  const confirmedBookings = allBookings.filter(b => b.status === 'CONFIRMED').length;
  const totalRevenue = allBookings
    .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.totalCost || 0), 0);

  const allReviews = daycares.flatMap(d => d.reviews);
  const averageRating = allReviews.length > 0 
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
    : 0;

  return {
    reportType: 'Summary Report',
    period: `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`,
    metrics: {
      totalDaycares,
      totalCapacity,
      totalBookings,
      confirmedBookings,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageRating: Math.round(averageRating * 10) / 10,
      occupancyRate: totalCapacity > 0 ? Math.round((confirmedBookings / totalCapacity) * 100) : 0
    },
    daycareBreakdown: daycares.map(daycare => ({
      name: daycare.name,
      capacity: daycare.capacity,
      bookings: daycare.bookings.length,
      confirmedBookings: daycare.bookings.filter((b: any) => b.status === 'CONFIRMED').length,
      revenue: daycare.bookings
        .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .reduce((sum: number, b: any) => sum + (b.totalCost || 0), 0),
      averageRating: daycare.reviews.length > 0
        ? daycare.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / daycare.reviews.length
        : 0
    }))
  };
}

async function generateRevenueReport(daycares: any[], startDate: Date, endDate: Date) {
  const revenueBookings = daycares.flatMap((d: any) => d.bookings)
    .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED');

  const totalRevenue = revenueBookings.reduce((sum: number, b: any) => sum + (b.totalCost || 0), 0);
  
  // Group by month
  const monthlyRevenue: { [key: string]: number } = {};
  revenueBookings.forEach((booking: any) => {
    const month = format(booking.createdAt, 'yyyy-MM');
    if (!monthlyRevenue[month]) {
      monthlyRevenue[month] = 0;
    }
    monthlyRevenue[month] += booking.totalCost || 0;
  });

  return {
    reportType: 'Revenue Report',
    period: `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`,
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalBookings: revenueBookings.length,
      averageBookingValue: revenueBookings.length > 0 
        ? Math.round((totalRevenue / revenueBookings.length) * 100) / 100 
        : 0
    },
    monthlyBreakdown: Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue * 100) / 100
    })),
    bookingDetails: revenueBookings.map(booking => ({
      date: format(booking.createdAt, 'yyyy-MM-dd'),
      childName: booking.childName,
      parentName: booking.parent.name,
      daycare: booking.daycare?.name || 'Unknown',
      amount: booking.totalCost,
      status: booking.status
    }))
  };
}

async function generateBookingsReport(daycares: any[], startDate: Date, endDate: Date) {
  const allBookings = daycares.flatMap(d => d.bookings);
  
  const statusCounts = {
    CONFIRMED: allBookings.filter(b => b.status === 'CONFIRMED').length,
    PENDING: allBookings.filter(b => b.status === 'PENDING').length,
    CANCELLED: allBookings.filter(b => b.status === 'CANCELLED').length,
    COMPLETED: allBookings.filter(b => b.status === 'COMPLETED').length,
  };

  const careTypeCounts = {
    FULL_DAY: allBookings.filter(b => b.careType === 'FULL_DAY').length,
    HALF_DAY: allBookings.filter(b => b.careType === 'HALF_DAY').length,
    HOURLY: allBookings.filter(b => b.careType === 'HOURLY').length,
    EXTENDED_DAY: allBookings.filter(b => b.careType === 'EXTENDED_DAY').length,
  };

  return {
    reportType: 'Bookings Report',
    period: `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`,
    summary: {
      totalBookings: allBookings.length,
      statusBreakdown: statusCounts,
      careTypeBreakdown: careTypeCounts
    },
    bookingsList: allBookings.map(booking => ({
      id: booking.id,
      date: format(booking.createdAt, 'yyyy-MM-dd HH:mm'),
      childName: booking.childName,
      childAge: booking.childAge,
      parentName: booking.parent.name,
      parentEmail: booking.parent.email,
      daycare: booking.daycare?.name || 'Unknown',
      careType: booking.careType,
      status: booking.status,
      startDate: format(booking.startDate, 'yyyy-MM-dd'),
      endDate: booking.endDate ? format(booking.endDate, 'yyyy-MM-dd') : null,
      totalCost: booking.totalCost
    }))
  };
}

async function generateCustomersReport(daycares: any[], startDate: Date, endDate: Date) {
  const allBookings = daycares.flatMap((d: any) => d.bookings);

  // Group by parent
  const customerData: { [key: string]: any } = {};
  allBookings.forEach((booking: any) => {
    const parentId = booking.parent.email; // Using email as unique identifier
    if (!customerData[parentId]) {
      customerData[parentId] = {
        name: booking.parent.name,
        email: booking.parent.email,
        bookings: [],
        totalSpent: 0,
        totalBookings: 0
      };
    }
    customerData[parentId].bookings.push(booking);
    customerData[parentId].totalBookings++;
    if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
      customerData[parentId].totalSpent += booking.totalCost || 0;
    }
  });

  const customers = Object.values(customerData).sort((a: any, b: any) => b.totalSpent - a.totalSpent);

  return {
    reportType: 'Customers Report',
    period: `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`,
    summary: {
      totalCustomers: customers.length,
      totalRevenue: customers.reduce((sum: number, c: any) => sum + c.totalSpent, 0),
      averageCustomerValue: customers.length > 0 
        ? customers.reduce((sum: number, c: any) => sum + c.totalSpent, 0) / customers.length 
        : 0
    },
    customers: customers.map((customer: any) => ({
      name: customer.name,
      email: customer.email,
      totalBookings: customer.totalBookings,
      totalSpent: Math.round(customer.totalSpent * 100) / 100,
      lastBooking: customer.bookings.length > 0 
        ? format(new Date(Math.max(...customer.bookings.map((b: any) => new Date(b.createdAt).getTime()))), 'yyyy-MM-dd')
        : null
    }))
  };
}

function generateCSV(data: any, reportType: string): string {
  let csvContent = '';
  
  switch (reportType) {
    case 'bookings':
      csvContent = 'ID,Date,Child Name,Child Age,Parent Name,Parent Email,Daycare,Care Type,Status,Start Date,End Date,Total Cost\n';
      data.bookingsList.forEach((booking: any) => {
        csvContent += `${booking.id},${booking.date},"${booking.childName}",${booking.childAge},"${booking.parentName}",${booking.parentEmail},"${booking.daycare}",${booking.careType},${booking.status},${booking.startDate},${booking.endDate || ''},${booking.totalCost}\n`;
      });
      break;
    case 'revenue':
      csvContent = 'Date,Child Name,Parent Name,Daycare,Amount,Status\n';
      data.bookingDetails.forEach((booking: any) => {
        csvContent += `${booking.date},"${booking.childName}","${booking.parentName}","${booking.daycare}",${booking.amount},${booking.status}\n`;
      });
      break;
    case 'customers':
      csvContent = 'Name,Email,Total Bookings,Total Spent,Last Booking\n';
      data.customers.forEach((customer: any) => {
        csvContent += `"${customer.name}",${customer.email},${customer.totalBookings},${customer.totalSpent},${customer.lastBooking || ''}\n`;
      });
      break;
    default:
      csvContent = 'Report Type,Period,Total Daycares,Total Bookings,Total Revenue\n';
      csvContent += `"${data.reportType}","${data.period}",${data.metrics.totalDaycares},${data.metrics.totalBookings},${data.metrics.totalRevenue}\n`;
  }
  
  return csvContent;
}