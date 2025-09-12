import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentId, daycareId } = body;

    if (!parentId || !daycareId) {
      return NextResponse.json(
        { success: false, error: "Parent ID and Daycare ID are required" },
        { status: 400 }
      );
    }

    // Handle daycare ID mapping (like in bookings)
    let actualDaycareId = daycareId;
    if (typeof daycareId === 'number' || !isNaN(Number(daycareId))) {
      const allDaycares = await prisma.daycare.findMany({
        select: { id: true },
        orderBy: { createdAt: 'asc' }
      });
      
      const daycareIndex = Number(daycareId) - 1;
      if (daycareIndex >= 0 && daycareIndex < allDaycares.length) {
        actualDaycareId = allDaycares[daycareIndex].id;
      }
    }

    // Check if already favorited
    const existing = await prisma.savedDaycare.findUnique({
      where: {
        parentId_daycareId: {
          parentId,
          daycareId: actualDaycareId
        }
      }
    });

    if (existing) {
      // Remove from favorites
      await prisma.savedDaycare.delete({
        where: { id: existing.id }
      });
      
      return NextResponse.json({
        success: true,
        action: 'removed',
        message: 'Removed from favorites'
      });
    } else {
      // Add to favorites
      const favorite = await prisma.savedDaycare.create({
        data: {
          parentId,
          daycareId: actualDaycareId
        },
        include: {
          daycare: {
            select: { name: true }
          }
        }
      });

      return NextResponse.json({
        success: true,
        action: 'added',
        message: `Added ${favorite.daycare.name} to favorites`,
        favorite
      });
    }

  } catch (error) {
    console.error('Favorites error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to update favorites" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json(
        { success: false, error: "Parent ID is required" },
        { status: 400 }
      );
    }

    const favorites = await prisma.savedDaycare.findMany({
      where: { parentId },
      include: {
        daycare: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            city: true,
            dailyRate: true,
            averageRating: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      favorites
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to get favorites" },
      { status: 500 }
    );
  }
}