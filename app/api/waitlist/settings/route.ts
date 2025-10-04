import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserFromRequest, requireProvider } from '@/app/utils/auth';

// GET - Get waitlist settings for a daycare
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daycareId = searchParams.get('daycareId');

    if (!daycareId) {
      return NextResponse.json(
        { error: 'daycareId is required' },
        { status: 400 }
      );
    }

    // Get or create settings
    let settings = await prisma.waitlistSettings.findUnique({
      where: { daycareId },
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.waitlistSettings.create({
        data: {
          daycareId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Update waitlist settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.userType !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Unauthorized - Provider access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { daycareId, ...settingsData } = body;

    // Verify provider owns daycare
    const daycare = await prisma.daycare.findFirst({
      where: {
        id: daycareId,
        ownerId: user.id,
      },
    });

    if (!daycare) {
      return NextResponse.json(
        { error: 'Daycare not found or unauthorized' },
        { status: 404 }
      );
    }

    // Validate offer window hours
    if (settingsData.defaultOfferWindowHours) {
      const min = settingsData.minOfferWindowHours || 12;
      const max = settingsData.maxOfferWindowHours || 72;

      if (
        settingsData.defaultOfferWindowHours < min ||
        settingsData.defaultOfferWindowHours > max
      ) {
        return NextResponse.json(
          {
            error: `Offer window must be between ${min} and ${max} hours`,
          },
          { status: 400 }
        );
      }
    }

    // Upsert settings
    const settings = await prisma.waitlistSettings.upsert({
      where: { daycareId },
      create: {
        daycareId,
        ...settingsData,
      },
      update: settingsData,
    });

    return NextResponse.json({
      success: true,
      settings,
      message: 'Settings updated successfully',
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
