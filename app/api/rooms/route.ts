import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET - Fetch rooms for a daycare
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
    const daycareId = searchParams.get('daycareId');
    const isActive = searchParams.get('isActive');
    const roomType = searchParams.get('roomType');

    if (!daycareId) {
      return NextResponse.json({ error: 'daycareId is required' }, { status: 400 });
    }

    // Verify user has access to this daycare
    const daycare = await prisma.daycare.findUnique({
      where: { id: daycareId },
    });

    if (!daycare || daycare.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build filter
    const whereClause: any = { daycareId };

    if (isActive !== null && isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    if (roomType) {
      whereClause.roomType = roomType;
    }

    // Fetch rooms with staff and children counts
    const rooms = await prisma.room.findMany({
      where: whereClause,
      include: {
        staff: {
          where: { isActive: true },
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        children: {
          where: { isActive: true },
          include: {
            child: {
              select: {
                id: true,
                fullName: true,
                dateOfBirth: true,
              },
            },
          },
        },
        _count: {
          select: {
            staff: true,
            children: true,
            incidents: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ rooms });
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

// POST - Create a new room
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
      daycareId,
      name,
      description,
      roomType,
      minAgeMonths,
      maxAgeMonths,
      totalCapacity,
      staffChildRatio,
      minStaffRequired,
      maxStaffAllowed,
      operatingDays,
      openTime,
      closeTime,
      floorLevel,
      roomNumber,
      squareFootage,
      features,
      equipment,
      dailyRate,
      hourlyRate,
      licenseNumber,
    } = body;

    // Validate required fields
    if (!daycareId || !name || !minAgeMonths || !maxAgeMonths || !totalCapacity || !staffChildRatio || !operatingDays || !openTime || !closeTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user owns the daycare
    const daycare = await prisma.daycare.findUnique({
      where: { id: daycareId },
    });

    if (!daycare || daycare.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create the room
    const room = await prisma.room.create({
      data: {
        daycareId,
        name,
        description,
        roomType: roomType || 'CLASSROOM',
        minAgeMonths: parseInt(minAgeMonths),
        maxAgeMonths: parseInt(maxAgeMonths),
        totalCapacity: parseInt(totalCapacity),
        currentOccupancy: 0,
        staffChildRatio: staffChildRatio, // Store as-is, don't double-stringify
        minStaffRequired: parseInt(minStaffRequired) || 1,
        maxStaffAllowed: maxStaffAllowed ? parseInt(maxStaffAllowed) : null,
        operatingDays: JSON.stringify(operatingDays),
        openTime,
        closeTime,
        floorLevel,
        roomNumber,
        squareFootage: squareFootage ? parseInt(squareFootage) : null,
        features: features ? JSON.stringify(features) : null,
        equipment: equipment ? JSON.stringify(equipment) : null,
        dailyRate: dailyRate ? parseFloat(dailyRate) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        licenseNumber,
        isActive: true,
        acceptingEnrollments: true,
      },
      include: {
        staff: true,
        children: true,
      },
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create room' },
      { status: 500 }
    );
  }
}

// PUT - Update a room
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
    const { roomId, ...updateData } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }

    // Verify room exists and user owns the daycare
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        daycare: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.daycare.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Process update data
    const processedData: any = {};

    if (updateData.name !== undefined) processedData.name = updateData.name;
    if (updateData.description !== undefined) processedData.description = updateData.description;
    if (updateData.roomType !== undefined) processedData.roomType = updateData.roomType;
    if (updateData.minAgeMonths !== undefined) processedData.minAgeMonths = parseInt(updateData.minAgeMonths);
    if (updateData.maxAgeMonths !== undefined) processedData.maxAgeMonths = parseInt(updateData.maxAgeMonths);
    if (updateData.totalCapacity !== undefined) processedData.totalCapacity = parseInt(updateData.totalCapacity);
    if (updateData.staffChildRatio !== undefined) processedData.staffChildRatio = updateData.staffChildRatio; // Store as-is
    if (updateData.minStaffRequired !== undefined) processedData.minStaffRequired = parseInt(updateData.minStaffRequired);
    if (updateData.maxStaffAllowed !== undefined) processedData.maxStaffAllowed = parseInt(updateData.maxStaffAllowed);
    if (updateData.operatingDays !== undefined) processedData.operatingDays = JSON.stringify(updateData.operatingDays);
    if (updateData.openTime !== undefined) processedData.openTime = updateData.openTime;
    if (updateData.closeTime !== undefined) processedData.closeTime = updateData.closeTime;
    if (updateData.floorLevel !== undefined) processedData.floorLevel = updateData.floorLevel;
    if (updateData.roomNumber !== undefined) processedData.roomNumber = updateData.roomNumber;
    if (updateData.squareFootage !== undefined) processedData.squareFootage = parseInt(updateData.squareFootage);
    if (updateData.features !== undefined) processedData.features = JSON.stringify(updateData.features);
    if (updateData.equipment !== undefined) processedData.equipment = JSON.stringify(updateData.equipment);
    if (updateData.isActive !== undefined) processedData.isActive = updateData.isActive;
    if (updateData.acceptingEnrollments !== undefined) processedData.acceptingEnrollments = updateData.acceptingEnrollments;
    if (updateData.dailyRate !== undefined) processedData.dailyRate = parseFloat(updateData.dailyRate);
    if (updateData.hourlyRate !== undefined) processedData.hourlyRate = parseFloat(updateData.hourlyRate);
    if (updateData.licenseNumber !== undefined) processedData.licenseNumber = updateData.licenseNumber;

    // Update the room
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: processedData,
      include: {
        staff: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        children: {
          include: {
            child: {
              select: {
                id: true,
                fullName: true,
                dateOfBirth: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ room: updatedRoom });
  } catch (error: any) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update room' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a room (soft delete)
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
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }

    // Verify room exists and user owns the daycare
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        daycare: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.daycare.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Soft delete by setting isActive to false
    await prisma.room.update({
      where: { id: roomId },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete room' },
      { status: 500 }
    );
  }
}
