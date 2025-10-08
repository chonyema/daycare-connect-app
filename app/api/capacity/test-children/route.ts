import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest, requireProvider } from '../../../utils/auth';

/**
 * POST /api/capacity/test-children
 *
 * Create sample children for testing capacity planning
 *
 * Request body:
 *   - daycareId: ID of the daycare to add children to
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const provider = requireProvider(user);

    const body = await request.json();
    const { daycareId } = body;

    if (!daycareId) {
      return NextResponse.json(
        { error: 'daycareId is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const daycare = await prisma.daycare.findUnique({
      where: { id: daycareId },
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

    // Create sample children with diverse ages
    const today = new Date();
    const sampleChildren = [
      {
        fullName: 'Emma Johnson',
        dateOfBirth: new Date(today.getFullYear() - 1, 5, 15), // 1.5 years old
        daycareId,
        isProviderChild: false,
        enrollmentStart: new Date(today.getFullYear(), 0, 10),
        isActive: true,
        parentName: 'Sarah Johnson',
        parentContact: 'sarah.j@email.com',
        notes: 'Allergic to peanuts',
      },
      {
        fullName: 'Liam Smith',
        dateOfBirth: new Date(today.getFullYear() - 3, 8, 22), // 3 years old
        daycareId,
        isProviderChild: false,
        enrollmentStart: new Date(today.getFullYear() - 1, 8, 1),
        isActive: true,
        parentName: 'Michael Smith',
        parentContact: '416-555-0123',
        notes: 'Loves dinosaurs',
      },
      {
        fullName: 'Olivia Davis',
        dateOfBirth: new Date(today.getFullYear(), 2, 3), // 7 months old
        daycareId,
        isProviderChild: false,
        enrollmentStart: new Date(today.getFullYear(), 6, 1),
        isActive: true,
        parentName: 'Jennifer Davis',
        parentContact: 'jen.davis@email.com',
        notes: 'First time in daycare',
      },
      {
        fullName: 'Noah Brown',
        dateOfBirth: new Date(today.getFullYear() - 2, 11, 10), // Just turned 2
        daycareId,
        isProviderChild: false,
        enrollmentStart: new Date(today.getFullYear() - 1, 3, 15),
        expectedExit: new Date(today.getFullYear() + 1, 8, 1), // Expected to leave next year
        isActive: true,
        parentName: 'Amanda Brown',
        parentContact: '647-555-0199',
        notes: 'Potty training',
      },
      {
        fullName: 'Sophia Martinez',
        dateOfBirth: new Date(today.getFullYear() - 4, 3, 18), // 4 years old
        daycareId,
        isProviderChild: true, // Provider's own child
        enrollmentStart: new Date(today.getFullYear() - 2, 0, 1),
        isActive: true,
        parentName: 'Provider',
        notes: 'Provider\'s daughter',
      },
      {
        fullName: 'Ava Wilson',
        dateOfBirth: new Date(today.getFullYear() - 1, 1, 28), // 1 year 8 months
        daycareId,
        isProviderChild: false,
        enrollmentStart: new Date(today.getFullYear(), 5, 1),
        isActive: true,
        parentName: 'Robert Wilson',
        parentContact: 'rwilson@email.com',
        notes: 'Naps twice a day',
      },
    ];

    // Create all children
    const createdChildren = await Promise.all(
      sampleChildren.map((child) =>
        prisma.child.create({
          data: child,
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Created ${createdChildren.length} sample children`,
      children: createdChildren.map((child) => ({
        id: child.id,
        fullName: child.fullName,
        age: calculateAge(child.dateOfBirth),
        isProviderChild: child.isProviderChild,
      })),
    });
  } catch (error: any) {
    console.error('Test children creation error:', error);

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
      { error: 'Failed to create test children', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/capacity/test-children
 *
 * Remove all children for a daycare (for testing cleanup)
 *
 * Request body:
 *   - daycareId: ID of the daycare
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const provider = requireProvider(user);

    const body = await request.json();
    const { daycareId } = body;

    if (!daycareId) {
      return NextResponse.json(
        { error: 'daycareId is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const daycare = await prisma.daycare.findUnique({
      where: { id: daycareId },
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

    // Delete all children for this daycare
    const result = await prisma.child.deleteMany({
      where: { daycareId },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} children`,
      count: result.count,
    });
  } catch (error: any) {
    console.error('Test children deletion error:', error);

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
      { error: 'Failed to delete test children', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function
function calculateAge(dob: Date): string {
  const today = new Date();
  const birthDate = new Date(dob);
  const years = today.getFullYear() - birthDate.getFullYear();
  const months = today.getMonth() - birthDate.getMonth();

  let totalMonths = years * 12 + months;
  if (today.getDate() < birthDate.getDate()) {
    totalMonths--;
  }

  const ageYears = Math.floor(totalMonths / 12);
  const ageMonths = totalMonths % 12;

  if (ageYears === 0) {
    return `${ageMonths}mo`;
  } else if (ageMonths === 0) {
    return `${ageYears}y`;
  } else {
    return `${ageYears}y ${ageMonths}mo`;
  }
}
