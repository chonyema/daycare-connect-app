import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '../../../utils/auth';

/**
 * GET /api/parent/children
 *
 * Returns all children associated with the parent's bookings
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

    // Get all bookings for this parent
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
            address: true,
            phone: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    // Build unique children list from bookings
    const childrenMap = new Map();

    for (const booking of bookings) {
      const childKey = `${booking.childName}-${booking.parentEmail}`;

      if (!childrenMap.has(childKey)) {
        childrenMap.set(childKey, {
          id: booking.id,
          fullName: booking.childName,
          dateOfBirth: booking.startDate, // Using start date as proxy - ideally would have actual DOB
          age: booking.childAge || 'Not specified',
          daycare: booking.daycare,
          parentName: booking.parentName || user.name || 'Parent',
          parentContact: booking.parentPhone || booking.parentEmail,
          enrollmentStart: booking.startDate,
          expectedExit: booking.endDate,
          isActive: booking.status === 'CONFIRMED',
          notes: booking.specialNeeds || booking.notes,
        });
      }
    }

    const children = Array.from(childrenMap.values());

    return NextResponse.json(children);
  } catch (error: any) {
    console.error('Parent children fetch error:', error);

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
