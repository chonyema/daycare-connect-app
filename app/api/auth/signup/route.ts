import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Signup request body:', body);
    
    const { name, email, password, userType, phone } = body;
    
    console.log('Extracted fields:', { name, email, password: '***', userType, phone });

    // Validation
    if (!name || !email || !password || !userType) {
      return NextResponse.json(
        { message: 'Name, email, password, and user type are required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate userType
    if (!['PARENT', 'PROVIDER'].includes(userType)) {
      return NextResponse.json(
        { message: 'Invalid user type' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        userType: userType, // Use userType, not type
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        userType: true,
        createdAt: true,
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    // Create response
    const response = NextResponse.json({
      message: 'User created successfully',
      user
    });

    // Set JWT as HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send welcome email (don't block registration if email fails)
    try {
      // Get the current request URL to determine the correct port
      const requestUrl = new URL(request.url);
      const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

      // Use AbortController to add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const emailResponse = await fetch(`${baseUrl}/api/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`, // Include auth for the email API
        },
        body: JSON.stringify({
          type: 'welcome',
          data: {
            email: user.email,
            name: user.name,
            userType: user.userType,
          },
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!emailResponse.ok) {
        console.error('Failed to send welcome email, but registration succeeded');
      }
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
      // Continue - don't fail registration because of email issues
    }

    return response;

  } catch (error: any) {
    console.error('Signup error details:', {
      error: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code
    });

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    if (error?.name === 'PrismaClientValidationError') {
      console.error('Prisma validation error:', error?.message);
      return NextResponse.json(
        { message: 'Database validation error: ' + (error?.message || 'Unknown validation error') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error: ' + error?.message },
      { status: 500 }
    );
  }
}