import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '../../../utils/auth';

/**
 * GET /api/provider/children
 *
 * Returns all children enrolled in the provider's daycares
 * Optionally filter by daycare ID
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

    // Allow PROVIDER users only
    if (user.userType !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Provider access required' },
        { status: 403 }
      );
    }

    const userId = user.id;
    const searchParams = request.nextUrl.searchParams;
    const daycareId = searchParams.get('daycareId');

    // First, get all daycares owned by this provider
    const daycares = await prisma.daycare.findMany({
      where: {
        ownerId: userId,
      },
      select: {
        id: true,
      },
    });

    const daycareIds = daycares.map(d => d.id);

    if (daycareIds.length === 0) {
      return NextResponse.json([]);
    }

    // Build the where clause
    const whereClause: any = {
      daycareId: daycareId ? daycareId : { in: daycareIds },
      isActive: true,
    };

    // Get all children enrolled in these daycares
    const children = await prisma.child.findMany({
      where: whereClause,
      include: {
        daycare: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
      orderBy: {
        enrollmentStart: 'desc',
      },
    });

    // Format the response to match the expected structure
    const formattedChildren = children.map(child => {
      // Calculate age from date of birth
      const birthDate = new Date(child.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return {
        id: child.id,
        fullName: child.fullName,
        dateOfBirth: child.dateOfBirth,
        age: `${age} years`,
        daycare: {
          id: child.daycare.id,
          name: child.daycare.name,
        },
        parentName: child.parentName || 'Parent',
        parentContact: child.parentContact || 'Not provided',
        enrollmentStart: child.enrollmentStart,
        expectedExit: child.expectedExit,
        isActive: child.isActive,
        notes: child.notes,
        allergies: child.allergies,
        medications: child.medications,
        medicalConditions: child.medicalConditions,
        emergencyContactName: child.emergencyContactName,
        emergencyContactPhone: child.emergencyContactPhone,
        emergencyContactRelation: child.emergencyContactRelation,
        doctorName: child.doctorName,
        doctorPhone: child.doctorPhone,
        insuranceProvider: child.insuranceProvider,
        insurancePolicyNumber: child.insurancePolicyNumber,
      };
    });

    return NextResponse.json(formattedChildren);
  } catch (error: any) {
    console.error('Provider children fetch error:', error);

    if (error?.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch children data', details: error.message },
      { status: 500 }
    );
  }
}
