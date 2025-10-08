import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest, requireProvider } from '../../../utils/auth';
import { whatIf } from '@/app/lib/capacity-utils';

/**
 * POST /api/capacity/what-if
 *
 * Simulate adding a new child to a daycare and check capacity eligibility
 *
 * Request body:
 *   - daycareId: ID of the daycare
 *   - proposedStart: YYYY-MM-DD when child would start
 *   - dateOfBirth: YYYY-MM-DD child's date of birth
 *   - isProviderChild: boolean (default false)
 *
 * Returns:
 *   Simulation result with capacity analysis and constraints
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const provider = requireProvider(user);

    const body = await request.json();
    const {
      daycareId,
      proposedStart,
      dateOfBirth,
      isProviderChild = false,
    } = body;

    // Validate required fields
    if (!daycareId || !proposedStart || !dateOfBirth) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['daycareId', 'proposedStart', 'dateOfBirth'],
        },
        { status: 400 }
      );
    }

    // Parse dates
    let proposedStartDate: Date;
    let childDOB: Date;

    try {
      proposedStartDate = new Date(proposedStart);
      childDOB = new Date(dateOfBirth);

      if (isNaN(proposedStartDate.getTime()) || isNaN(childDOB.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (err) {
      return NextResponse.json(
        {
          error: 'Invalid date format',
          details: 'Dates must be in YYYY-MM-DD format',
        },
        { status: 400 }
      );
    }

    // Verify ownership and get daycare with children
    const daycare = await prisma.daycare.findUnique({
      where: { id: daycareId },
      include: {
        children: {
          where: {
            OR: [
              { isActive: true },
              { expectedExit: { gte: proposedStartDate } },
            ],
          },
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

    // Run what-if simulation
    const simulation = whatIf(
      daycare,
      daycare.children,
      rules,
      proposedStartDate,
      childDOB,
      isProviderChild
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
      simulation: {
        proposedStart: proposedStartDate.toISOString().split('T')[0],
        childDateOfBirth: childDOB.toISOString().split('T')[0],
        isProviderChild,
        ...simulation,
      },
    });
  } catch (error: any) {
    console.error('What-if simulation error:', error);

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
      { error: 'Failed to run simulation', details: error.message },
      { status: 500 }
    );
  }
}
