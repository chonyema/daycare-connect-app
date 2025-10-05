import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireSuperAdmin, logActivity } from '@/app/lib/rbac/authorization';
import bcrypt from 'bcryptjs';

// GET - List all users with filtering
export async function GET(request: NextRequest) {
  const authCheck = await requireSuperAdmin(request);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userType = searchParams.get('userType');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const whereClause: any = {};

    if (role) whereClause.role = role;
    if (userType) whereClause.userType = userType;
    if (isActive !== null) whereClause.isActive = isActive === 'true';
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        userType: true,
        role: true,
        isActive: true,
        isSuperAdmin: true,
        daycareId: true,
        createdAt: true,
        lastLoginAt: true,
        employedAt: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            ownedDaycares: true,
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  const authCheck = await requireSuperAdmin(request);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      email,
      name,
      phone,
      password,
      userType,
      role,
      isActive = true,
      isSuperAdmin = false,
      daycareId,
    } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
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

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        password: hashedPassword,
        userType: userType || 'PARENT',
        role: role || 'USER',
        isActive,
        isSuperAdmin,
        daycareId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        role: true,
        isActive: true,
        isSuperAdmin: true,
        createdAt: true,
      },
    });

    // Log activity
    await logActivity(
      authCheck.user!.id,
      'USER_CREATED',
      'User',
      user.id,
      `Created user ${user.email}`,
      { userEmail: user.email, role: user.role },
      request
    );

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}
