import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET - Get incidents for a room
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
    const status = searchParams.get('status');
    const incidentType = searchParams.get('incidentType');

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

    // Build filter
    const whereClause: any = { roomId };

    if (status) {
      whereClause.status = status;
    }

    if (incidentType) {
      whereClause.incidentType = incidentType;
    }

    // Get incidents
    const incidents = await prisma.roomIncident.findMany({
      where: whereClause,
      orderBy: {
        occurredAt: 'desc',
      },
    });

    return NextResponse.json({ incidents });
  } catch (error: any) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

// POST - Create an incident report
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
      incidentType,
      severity,
      title,
      description,
      occurredAt,
      childrenInvolved,
      staffInvolved,
      actionsTaken,
      requiresFollowUp,
      attachments,
    } = body;

    // Validate required fields
    if (!roomId || !incidentType || !title || !description || !occurredAt) {
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

    // Create the incident report
    const incident = await prisma.roomIncident.create({
      data: {
        roomId,
        incidentType,
        severity: severity || 'LOW',
        title,
        description,
        occurredAt: new Date(occurredAt),
        reportedBy: decoded.userId,
        childrenInvolved: childrenInvolved ? JSON.stringify(childrenInvolved) : null,
        staffInvolved: staffInvolved ? JSON.stringify(staffInvolved) : null,
        actionsTaken,
        requiresFollowUp: requiresFollowUp || false,
        attachments: attachments ? JSON.stringify(attachments) : null,
        status: 'REPORTED',
      },
    });

    return NextResponse.json({ incident }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create incident' },
      { status: 500 }
    );
  }
}

// PUT - Update an incident report
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
    const { incidentId, ...updateData } = body;

    if (!incidentId) {
      return NextResponse.json({ error: 'incidentId is required' }, { status: 400 });
    }

    // Verify incident exists and user owns the daycare
    const incident = await prisma.roomIncident.findUnique({
      where: { id: incidentId },
      include: {
        room: {
          include: {
            daycare: true,
          },
        },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    if (incident.room.daycare.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Process update data
    const processedData: any = {};

    if (updateData.incidentType !== undefined) processedData.incidentType = updateData.incidentType;
    if (updateData.severity !== undefined) processedData.severity = updateData.severity;
    if (updateData.title !== undefined) processedData.title = updateData.title;
    if (updateData.description !== undefined) processedData.description = updateData.description;
    if (updateData.occurredAt !== undefined) processedData.occurredAt = new Date(updateData.occurredAt);
    if (updateData.childrenInvolved !== undefined) processedData.childrenInvolved = JSON.stringify(updateData.childrenInvolved);
    if (updateData.staffInvolved !== undefined) processedData.staffInvolved = JSON.stringify(updateData.staffInvolved);
    if (updateData.actionsTaken !== undefined) processedData.actionsTaken = updateData.actionsTaken;
    if (updateData.requiresFollowUp !== undefined) processedData.requiresFollowUp = updateData.requiresFollowUp;
    if (updateData.followUpNotes !== undefined) processedData.followUpNotes = updateData.followUpNotes;
    if (updateData.followUpCompletedAt !== undefined) processedData.followUpCompletedAt = new Date(updateData.followUpCompletedAt);
    if (updateData.parentsNotified !== undefined) processedData.parentsNotified = updateData.parentsNotified;
    if (updateData.notifiedAt !== undefined) processedData.notifiedAt = new Date(updateData.notifiedAt);
    if (updateData.attachments !== undefined) processedData.attachments = JSON.stringify(updateData.attachments);
    if (updateData.status !== undefined) processedData.status = updateData.status;

    // Update the incident
    const updatedIncident = await prisma.roomIncident.update({
      where: { id: incidentId },
      data: processedData,
    });

    return NextResponse.json({ incident: updatedIncident });
  } catch (error: any) {
    console.error('Error updating incident:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update incident' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an incident report
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
    const incidentId = searchParams.get('incidentId');

    if (!incidentId) {
      return NextResponse.json({ error: 'incidentId is required' }, { status: 400 });
    }

    // Verify incident exists and user owns the daycare
    const incident = await prisma.roomIncident.findUnique({
      where: { id: incidentId },
      include: {
        room: {
          include: {
            daycare: true,
          },
        },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    if (incident.room.daycare.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the incident
    await prisma.roomIncident.delete({
      where: { id: incidentId },
    });

    return NextResponse.json({ message: 'Incident deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting incident:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete incident' },
      { status: 500 }
    );
  }
}
