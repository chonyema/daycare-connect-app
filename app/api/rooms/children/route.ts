import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET - Get children assignments for a room
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

    // Get children assignments
    const childrenAssignments = await prisma.roomChild.findMany({
      where: { roomId, isActive: true },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            allergies: true,
            medicalConditions: true,
            emergencyContact: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json({ childrenAssignments });
  } catch (error: any) {
    console.error('Error fetching children assignments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch children assignments' },
      { status: 500 }
    );
  }
}

// POST - Assign child to a room
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
      childId,
      isPrimary,
      assignedDays,
      startTime,
      endTime,
      startDate,
      previousRoomId,
      transitionReason,
      transitionNotes,
    } = body;

    // Validate required fields
    if (!roomId || !childId || !assignedDays) {
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

    // Verify child exists and belongs to the same daycare
    const child = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    if (child.daycareId !== room.daycareId) {
      return NextResponse.json(
        { error: 'Child does not belong to this daycare' },
        { status: 400 }
      );
    }

    // Check room capacity
    const currentOccupancy = await prisma.roomChild.count({
      where: {
        roomId,
        isActive: true,
      },
    });

    if (currentOccupancy >= room.totalCapacity) {
      return NextResponse.json(
        { error: 'Room is at full capacity' },
        { status: 400 }
      );
    }

    // If this is a transfer, deactivate the previous room assignment
    if (previousRoomId) {
      await prisma.roomChild.updateMany({
        where: {
          childId,
          roomId: previousRoomId,
          isActive: true,
        },
        data: {
          isActive: false,
          endDate: new Date(),
        },
      });
    }

    // Create the assignment
    const assignment = await prisma.roomChild.create({
      data: {
        roomId,
        childId,
        isPrimary: isPrimary !== undefined ? isPrimary : true,
        assignedDays: JSON.stringify(assignedDays),
        startTime,
        endTime,
        startDate: startDate ? new Date(startDate) : new Date(),
        previousRoomId,
        transitionReason,
        transitionNotes,
        isActive: true,
      },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
          },
        },
      },
    });

    // Update room occupancy
    await prisma.room.update({
      where: { id: roomId },
      data: {
        currentOccupancy: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error: any) {
    console.error('Error assigning child to room:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign child to room' },
      { status: 500 }
    );
  }
}

// PUT - Update child assignment
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
    const assignment = await prisma.roomChild.findUnique({
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

    if (updateData.isPrimary !== undefined) processedData.isPrimary = updateData.isPrimary;
    if (updateData.assignedDays !== undefined) processedData.assignedDays = JSON.stringify(updateData.assignedDays);
    if (updateData.startTime !== undefined) processedData.startTime = updateData.startTime;
    if (updateData.endTime !== undefined) processedData.endTime = updateData.endTime;
    if (updateData.isActive !== undefined) processedData.isActive = updateData.isActive;
    if (updateData.endDate !== undefined) processedData.endDate = new Date(updateData.endDate);

    // Update the assignment
    const updatedAssignment = await prisma.roomChild.update({
      where: { id: assignmentId },
      data: processedData,
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
          },
        },
      },
    });

    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error: any) {
    console.error('Error updating child assignment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update child assignment' },
      { status: 500 }
    );
  }
}

// DELETE - Remove child from room
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
    const assignment = await prisma.roomChild.findUnique({
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
    await prisma.roomChild.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });

    // Update room occupancy
    await prisma.room.update({
      where: { id: assignment.roomId },
      data: {
        currentOccupancy: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({ message: 'Child assignment removed successfully' });
  } catch (error: any) {
    console.error('Error removing child assignment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove child assignment' },
      { status: 500 }
    );
  }
}
