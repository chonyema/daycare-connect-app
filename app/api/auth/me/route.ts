import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as {
      userId: string;
      email: string;
    };

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        userType: true,
        role: true,
        isActive: true,
        isSuperAdmin: true,
        permissions: true,
        daycareId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    console.log('=== API /auth/me DEBUG ===');
    console.log('User from database:', user);
    console.log('isSuperAdmin:', user.isSuperAdmin);
    console.log('role:', user.role);
    console.log('=========================');

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}