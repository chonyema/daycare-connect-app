import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '../../utils/auth';

// GET /api/conversations - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = user.id;

    // Get conversations where user is either parent or provider
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { parentId: userId },
          { providerId: userId }
        ],
        isActive: true
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            userType: true
          }
        },
        daycare: {
          select: {
            id: true,
            name: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: userId,
                isRead: false
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.parentId === userId ? conv.provider : conv.parent;
      const lastMessage = conv.messages[0];

      return {
        id: conv.id,
        participant: otherParticipant,
        daycare: conv.daycare,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          sender: lastMessage.sender,
          isRead: lastMessage.isRead
        } : null,
        unreadCount: conv._count.messages,
        lastMessageAt: conv.lastMessageAt
      };
    });

    return NextResponse.json({
      success: true,
      conversations: formattedConversations
    });

  } catch (error: any) {
    console.error('Conversations fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create or get existing conversation
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { participantId, daycareId } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    // Verify participant exists
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
      select: { id: true, userType: true, name: true, email: true }
    });

    if (!participant) {
      console.error(`Participant not found: ${participantId}`);
      // Log available users for debugging
      const allUsers = await prisma.user.findMany({
        select: { id: true, name: true, email: true, userType: true }
      });
      console.log('Available users:', allUsers);

      return NextResponse.json(
        {
          error: 'Participant not found',
          debug: {
            searchedId: participantId,
            availableUserCount: allUsers.length
          }
        },
        { status: 404 }
      );
    }

    // Determine parent and provider based on user types
    let parentId: string;
    let providerId: string;

    if (user.userType === 'PARENT' && participant.userType === 'PROVIDER') {
      parentId = user.id;
      providerId = participantId;
    } else if (user.userType === 'PROVIDER' && participant.userType === 'PARENT') {
      parentId = participantId;
      providerId = user.id;
    } else {
      return NextResponse.json(
        { error: 'Invalid conversation participants' },
        { status: 400 }
      );
    }

    // Try to find existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        parentId,
        providerId,
        daycareId: daycareId || null
      },
      include: {
        parent: {
          select: { id: true, name: true, email: true, userType: true }
        },
        provider: {
          select: { id: true, name: true, email: true, userType: true }
        },
        daycare: {
          select: { id: true, name: true }
        }
      }
    });

    // Create new conversation if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          parentId,
          providerId,
          daycareId: daycareId || null
        },
        include: {
          parent: {
            select: { id: true, name: true, email: true, userType: true }
          },
          provider: {
            select: { id: true, name: true, email: true, userType: true }
          },
          daycare: {
            select: { id: true, name: true }
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      conversation
    });

  } catch (error: any) {
    console.error('Conversation creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}