import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '../../../utils/auth';

// PATCH /api/messages/[id] - Mark message as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const messageId = params.id;
    const body = await request.json();
    const { isRead } = body;

    // Verify message exists and user is the receiver
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        receiverId: user.id
      }
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found or access denied' },
        { status: 404 }
      );
    }

    // Update message read status
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isRead: isRead !== undefined ? isRead : true,
        readAt: isRead !== false ? new Date() : null
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: updatedMessage
    });

  } catch (error: any) {
    console.error('Message update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[id] - Delete message (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const messageId = params.id;

    // Verify message exists and user is the sender
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: user.id
      }
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found or access denied' },
        { status: 404 }
      );
    }

    // Check if message is recent (can only delete within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (message.createdAt < fiveMinutesAgo) {
      return NextResponse.json(
        { error: 'Can only delete messages within 5 minutes of sending' },
        { status: 400 }
      );
    }

    // Soft delete by updating content
    const deletedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: '[Message deleted]',
        messageType: 'SYSTEM'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: deletedMessage
    });

  } catch (error: any) {
    console.error('Message delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}