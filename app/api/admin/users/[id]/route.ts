import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireSuperAdmin, logActivity } from '@/app/lib/rbac/authorization';
import bcrypt from 'bcryptjs';

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireSuperAdmin(request);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        ownedDaycares: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        employedAt: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
            waitlistEntries: true,
            activityLogs: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      name,
      phone,
      password,
      userType,
      role,
      isActive,
      isSuperAdmin,
      daycareId,
      permissions,
    } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (userType !== undefined) updateData.userType = userType;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isSuperAdmin !== undefined) updateData.isSuperAdmin = isSuperAdmin;
    if (daycareId !== undefined) updateData.daycareId = daycareId;
    if (permissions !== undefined) {
      updateData.permissions = JSON.stringify(permissions);
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        role: true,
        isActive: true,
        isSuperAdmin: true,
        daycareId: true,
        updatedAt: true,
      },
    });

    // Log activity
    await logActivity(
      authCheck.user!.id,
      'USER_UPDATED',
      'User',
      user.id,
      `Updated user ${user.email}`,
      { changes: Object.keys(updateData) },
      request
    );

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireSuperAdmin(request);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: 401 }
    );
  }

  try {
    // Get user details before deletion
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent self-deletion
    if (params.id === authCheck.user!.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    // Log activity
    await logActivity(
      authCheck.user!.id,
      'USER_DELETED',
      'User',
      params.id,
      `Deleted user ${user.email}`,
      { userEmail: user.email },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    );
  }
}
