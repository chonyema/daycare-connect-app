import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAuthorizedUser, can, canAccessDaycare, logActivity } from '@/app/lib/rbac/authorization';
import { Permission } from '@/app/lib/rbac/permissions';
import bcrypt from 'bcryptjs';

// GET - List staff for provider's daycare(s)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!can(user, Permission.STAFF_READ)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const daycareId = searchParams.get('daycareId');

    let staff;

    if (daycareId) {
      // Check if user can access this daycare
      const hasAccess = await canAccessDaycare(user, daycareId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied to this daycare' },
          { status: 403 }
        );
      }

      staff = await prisma.user.findMany({
        where: {
          daycareId,
          role: 'STAFF',
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          employedAt: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } else {
      // Get staff for all daycares owned by this provider
      const daycares = await prisma.daycare.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      });

      const daycareIds = daycares.map(d => d.id);

      staff = await prisma.user.findMany({
        where: {
          daycareId: { in: daycareIds },
          role: 'STAFF',
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          employedAt: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      staff,
      count: staff.length,
    });
  } catch (error: any) {
    console.error('Get staff error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new staff member
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!can(user, Permission.STAFF_CREATE)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, phone, password, daycareId } = body;

    // Validate required fields
    if (!email || !password || !daycareId) {
      return NextResponse.json(
        { error: 'Email, password, and daycareId are required' },
        { status: 400 }
      );
    }

    // Check if user can access this daycare
    const hasAccess = await canAccessDaycare(user, daycareId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this daycare' },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create staff member
    const staffMember = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        password: hashedPassword,
        userType: 'PROVIDER',
        role: 'STAFF',
        daycareId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        employedAt: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    await logActivity(
      user.id,
      'STAFF_CREATED',
      'User',
      staffMember.id,
      `Created staff member ${staffMember.email}`,
      { daycareId, staffEmail: staffMember.email },
      request
    );

    return NextResponse.json({
      success: true,
      staff: staffMember,
    });
  } catch (error: any) {
    console.error('Create staff error:', error);
    return NextResponse.json(
      { error: 'Failed to create staff member', details: error.message },
      { status: 500 }
    );
  }
}
