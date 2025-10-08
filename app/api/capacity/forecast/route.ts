import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest, requireProvider } from '../../../utils/auth';
import { generateCapacityForecast } from '@/app/lib/capacity-utils';

/**
 * GET /api/capacity/forecast
 *
 * Generate a 12-month capacity forecast for a daycare provider
 *
 * Query params:
 *   - daycareId: ID of the daycare
 *   - months: Number of months to forecast (default 12)
 *   - start: YYYY-MM-DD format (default: current month)
 *
 * Returns:
 *   Array of monthly forecasts with capacity counts and events
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const provider = requireProvider(user);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const daycareId = searchParams.get('daycareId');
    const months = parseInt(searchParams.get('months') || '12');
    const startParam = searchParams.get('start');

    if (!daycareId) {
      return NextResponse.json(
        { error: 'daycareId is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const daycare = await prisma.daycare.findUnique({
      where: { id: daycareId },
      include: {
        children: {
          where: {
            OR: [
              { isActive: true },
              { expectedExit: { gte: new Date() } }, // Include children with future exits
            ],
          },
          orderBy: { dateOfBirth: 'asc' },
        },
      },
    });

    if (!daycare) {
      return NextResponse.json(
        { error: 'Daycare not found' },
        { status: 404 }
      );
    }

    if (daycare.ownerId !== provider.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get jurisdiction rules
    const jurisdictionKey = daycare.isLicensed
      ? `${daycare.jurisdiction}-LICENSED`
      : `${daycare.jurisdiction}-UNLICENSED`;

    const rules = await prisma.jurisdictionRule.findUnique({
      where: { jurisdiction: jurisdictionKey },
    });

    if (!rules) {
      return NextResponse.json(
        {
          error: `No jurisdiction rules found for ${jurisdictionKey}. Please contact support.`
        },
        { status: 404 }
      );
    }

    // Parse start date or use current month
    const startDate = startParam ? new Date(startParam) : new Date();

    // Generate forecast
    const forecast = generateCapacityForecast(
      daycare.children,
      rules,
      startDate,
      months
    );

    return NextResponse.json({
      daycare: {
        id: daycare.id,
        name: daycare.name,
        jurisdiction: daycare.jurisdiction,
        isLicensed: daycare.isLicensed,
      },
      rules: {
        jurisdiction: rules.jurisdiction,
        name: rules.name,
        maxTotal: rules.maxTotal,
        maxUnder2: rules.maxUnder2,
        countUnder: rules.countUnder,
        under2Threshold: rules.under2Threshold,
      },
      forecast,
    });
  } catch (error: any) {
    console.error('Capacity forecast error:', error);

    if (error?.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error?.message === 'Provider access required') {
      return NextResponse.json(
        { error: 'Provider access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate forecast', details: error.message },
      { status: 500 }
    );
  }
}
