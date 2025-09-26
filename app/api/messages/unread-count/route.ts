import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '../../../utils/auth';

// GET /api/messages/unread-count - Get unread message count for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Count unread messages where user is the receiver
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: user.id,
        isRead: false
      }
    });

    // Get recent conversations with unread messages
    const unreadConversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { parentId: user.id },
          { providerId: user.id }
        ],
        messages: {
          some: {
            receiverId: user.id,
            isRead: false
          }
        }
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
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
          where: {
            receiverId: user.id,
            isRead: false
          },
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
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    // Format the response
    const notifications = unreadConversations.map(conv => {
      const otherParticipant = conv.parentId === user.id ? conv.provider : conv.parent;
      const latestMessage = conv.messages[0];

      return {
        conversationId: conv.id,
        from: otherParticipant,
        daycare: conv.daycare,
        latestMessage: latestMessage ? {
          content: latestMessage.content,
          messageType: latestMessage.messageType,
          createdAt: latestMessage.createdAt,
          sender: latestMessage.sender
        } : null,
        unreadCount: conv.messages.length
      };
    });

    return NextResponse.json({
      success: true,
      totalUnreadCount: unreadCount,
      notifications
    });

  } catch (error: any) {
    console.error('Unread count fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}