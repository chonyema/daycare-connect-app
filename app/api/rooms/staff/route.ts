import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET - Get staff assignments for a room
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as {
      userId: string;
    };

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }

    // Verify access to room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { daycare: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.daycare.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get staff assignments
    const staffAssignments = await prisma.roomStaff.findMany({
      where: { roomId, isActive: true },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { role: 'asc' },
      ],
    });

    return NextResponse.json({ staffAssignments });
  } catch (error: any) {
    console.error('Error fetching staff assignments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch staff assignments' },
      { status: 500 }
    );
  }
}

// POST - Assign staff to a room
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as {
      userId: string;
    };

    const body = await req.json();
    const {
      roomId,
      staffId,
      role,
      isPrimary,
      assignedDays,
      startTime,
      endTime,
      startDate,
    } = body;

    // Validate required fields
    if (!roomId || !staffId || !role || !assignedDays) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify room exists and user owns the daycare
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { daycare: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.daycare.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify staff exists and belongs to the same daycare
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    if (staff.daycareId !== room.daycareId) {
      return NextResponse.json(
        { error: 'Staff does not belong to this daycare' },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.roomStaff.findUnique({
      where: {
        roomId_staffId: {
          roomId,
          staffId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Staff member is already assigned to this room' },
        { status: 400 }
      );
    }

    // Create the assignment
    const assignment = await prisma.roomStaff.create({
      data: {
        roomId,
        staffId,
        role: role || 'ASSISTANT',
        isPrimary: isPrimary || false,
        assignedDays: JSON.stringify(assignedDays),
        startTime,
        endTime,
        startDate: startDate ? new Date(startDate) : new Date(),
        isActive: true,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error: any) {
    console.error('Error assigning staff to room:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign staff to room' },
      { status: 500 }
    );
  }
}

// PUT - Update staff assignment
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as {
      userId: string;
    };

    const body = await req.json();
    const { assignmentId, ...updateData } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    // Verify assignment exists and user owns the daycare
    const assignment = await prisma.roomStaff.findUnique({
      where: { id: assignmentId },
      include: {
        room: {
          include: {
            daycare: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.room.daycare.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Process update data
    const processedData: any = {};

    if (updateData.role !== undefined) processedData.role = updateData.role;
    if (updateData.isPrimary !== undefined) processedData.isPrimary = updateData.isPrimary;
    if (updateData.assignedDays !== undefined) processedData.assignedDays = JSON.stringify(updateData.assignedDays);
    if (updateData.startTime !== undefined) processedData.startTime = updateData.startTime;
    if (updateData.endTime !== undefined) processedData.endTime = updateData.endTime;
    if (updateData.isActive !== undefined) processedData.isActive = updateData.isActive;
    if (updateData.endDate !== undefined) processedData.endDate = new Date(updateData.endDate);

    // Update the assignment
    const updatedAssignment = await prisma.roomStaff.update({
      where: { id: assignmentId },
      data: processedData,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error: any) {
    console.error('Error updating staff assignment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update staff assignment' },
      { status: 500 }
    );
  }
}

// DELETE - Remove staff from room
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as {
      userId: string;
    };

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    // Verify assignment exists and user owns the daycare
    const assignment = await prisma.roomStaff.findUnique({
      where: { id: assignmentId },
      include: {
        room: {
          include: {
            daycare: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.room.daycare.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Soft delete by setting isActive to false and endDate
    await prisma.roomStaff.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });

    return NextResponse.json({ message: 'Staff assignment removed successfully' });
  } catch (error: any) {
    console.error('Error removing staff assignment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove staff assignment' },
      { status: 500 }
    );
  }
}
