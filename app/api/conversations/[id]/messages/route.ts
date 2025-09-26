import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '../../../../utils/auth';

// GET /api/conversations/[id]/messages - Get messages in a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const conversationId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Verify user is participant in this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { parentId: user.id },
          { providerId: user.id }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get messages with pagination
    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.message.count({
        where: {
          conversationId
        }
      })
    ]);

    // Mark messages as read for the current user
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      messages: messages.reverse(), // Reverse to get chronological order
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error: any) {
    console.error('Messages fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const conversationId = params.id;
    const body = await request.json();
    const { content, messageType = 'TEXT', fileName, fileUrl, fileType, fileSize } = body;

    // Validate content or file attachment
    if (messageType === 'TEXT' && (!content || content.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if ((messageType === 'IMAGE' || messageType === 'FILE') && (!fileUrl || !fileName)) {
      return NextResponse.json(
        { error: 'File data is required for file messages' },
        { status: 400 }
      );
    }

    // Verify user is participant in this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { parentId: user.id },
          { providerId: user.id }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Determine receiver
    const receiverId = conversation.parentId === user.id
      ? conversation.providerId
      : conversation.parentId;

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        receiverId,
        content: messageType === 'TEXT' ? content.trim() : (content || ''),
        messageType,
        fileName,
        fileUrl,
        fileType,
        fileSize
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

    // Update conversation's lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error: any) {
    console.error('Message send error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}