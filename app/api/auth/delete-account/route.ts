import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest } from '../../../utils/auth';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        parentId: user.id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (activeBookings > 0) {
      return NextResponse.json({
        error: 'Cannot delete account with active bookings. Please cancel all bookings first.'
      }, { status: 400 });
    }

    // If user is a provider, check for active daycares
    if (user.userType === 'PROVIDER') {
      const activeDaycares = await prisma.daycare.count({
        where: {
          ownerId: user.id,
          active: true
        }
      });

      if (activeDaycares > 0) {
        return NextResponse.json({
          error: 'Cannot delete account with active daycare listings. Please deactivate all daycares first.'
        }, { status: 400 });
      }
    }

    // Start transaction to delete user and all related data
    await prisma.$transaction(async (tx) => {
      // Delete user's saved daycares
      await tx.savedDaycare.deleteMany({
        where: { parentId: user.id }
      });

      // Delete user's reviews
      await tx.review.deleteMany({
        where: { parentId: user.id }
      });

      // Delete user's messages and conversations
      await tx.message.deleteMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      });

      await tx.conversation.deleteMany({
        where: {
          OR: [
            { parentId: user.id },
            { providerId: user.id }
          ]
        }
      });

      // Delete completed/cancelled bookings
      await tx.booking.deleteMany({
        where: {
          parentId: user.id,
          status: {
            in: ['COMPLETED', 'CANCELLED']
          }
        }
      });

      // If provider, delete inactive daycares
      if (user.userType === 'PROVIDER') {
        await tx.daycare.deleteMany({
          where: {
            ownerId: user.id,
            active: false
          }
        });
      }

      // Finally, delete the user
      await tx.user.delete({
        where: { id: user.id }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}