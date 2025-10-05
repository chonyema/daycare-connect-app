import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAuthorizedUser, can, canAccessDaycare, logActivity } from '@/app/lib/rbac/authorization';
import { Permission } from '@/app/lib/rbac/permissions';
import bcrypt from 'bcryptjs';

// PATCH - Update staff member
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthorizedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!can(user, Permission.STAFF_UPDATE)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, phone, password, isActive, daycareId } = body;

    // Get current staff member
    const staffMember = await prisma.user.findUnique({
      where: { id: params.id },
      select: { daycareId: true, role: true },
    });

    if (!staffMember || staffMember.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Check if user can access the staff member's daycare
    if (staffMember.daycareId) {
      const hasAccess = await canAccessDaycare(user, staffMember.daycareId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (daycareId !== undefined) {
      // Verify access to new daycare
      const hasAccess = await canAccessDaycare(user, daycareId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied to target daycare' },
          { status: 403 }
        );
      }
      updateData.daycareId = daycareId;
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isActive: true,
        updatedAt: true,
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
      'STAFF_UPDATED',
      'User',
      updated.id,
      `Updated staff member ${updated.email}`,
      { changes: Object.keys(updateData) },
      request
    );

    return NextResponse.json({
      success: true,
      staff: updated,
    });
  } catch (error: any) {
    console.error('Update staff error:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthorizedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!can(user, Permission.STAFF_DELETE)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get staff member
    const staffMember = await prisma.user.findUnique({
      where: { id: params.id },
      select: { email: true, daycareId: true, role: true },
    });

    if (!staffMember || staffMember.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Check access
    if (staffMember.daycareId) {
      const hasAccess = await canAccessDaycare(user, staffMember.daycareId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    // Log activity
    await logActivity(
      user.id,
      'STAFF_DELETED',
      'User',
      params.id,
      `Deleted staff member ${staffMember.email}`,
      { staffEmail: staffMember.email },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Staff member removed successfully',
    });
  } catch (error: any) {
    console.error('Delete staff error:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff member', details: error.message },
      { status: 500 }
    );
  }
}
