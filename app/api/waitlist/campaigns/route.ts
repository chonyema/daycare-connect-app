import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { CampaignStatus, WaitlistStatus, OfferResponse, WaitlistAction } from '@prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      daycareId,
      programId,
      name,
      description,
      spotsAvailable,
      spotAvailableDate,
      offerWindowHours = 48,
      maxOfferAttempts = 3,
      createdBy
    } = body;

    if (!daycareId || !name || !spotsAvailable || !spotAvailableDate || !createdBy) {
      return NextResponse.json(
        { success: false, error: "Daycare ID, name, spots available, spot available date, and created by are required" },
        { status: 400 }
      );
    }

    // Validate daycare exists
    const daycare = await prisma.daycare.findUnique({
      where: { id: daycareId },
      select: { name: true }
    });

    if (!daycare) {
      return NextResponse.json(
        { success: false, error: "Daycare not found" },
        { status: 404 }
      );
    }

    // Validate program if provided
    if (programId) {
      const program = await prisma.program.findFirst({
        where: { id: programId, daycareId },
        select: { name: true }
      });

      if (!program) {
        return NextResponse.json(
          { success: false, error: "Program not found or doesn't belong to this daycare" },
          { status: 404 }
        );
      }
    }

    // Create the campaign
    const campaign = await prisma.waitlistCampaign.create({
      data: {
        daycareId,
        programId,
        name,
        description,
        spotsAvailable,
        spotsRemaining: spotsAvailable,
        spotAvailableDate: new Date(spotAvailableDate),
        offerWindowHours,
        maxOfferAttempts,
        createdBy,
        status: CampaignStatus.DRAFT
      },
      include: {
        daycare: {
          select: { name: true }
        },
        program: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Campaign "${name}" created successfully`,
      data: campaign
    });

  } catch (error: any) {
    console.error('Create campaign error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daycareId = searchParams.get('daycareId');
    const programId = searchParams.get('programId');
    const status = searchParams.get('status');
    const includeCompleted = searchParams.get('includeCompleted') === 'true';

    if (!daycareId) {
      return NextResponse.json(
        { success: false, error: "Daycare ID is required" },
        { status: 400 }
      );
    }

    const whereClause: any = { daycareId };

    if (programId) {
      whereClause.programId = programId;
    }

    if (status) {
      whereClause.status = status;
    } else if (!includeCompleted) {
      whereClause.status = { not: CampaignStatus.COMPLETED };
    }

    const campaigns = await prisma.waitlistCampaign.findMany({
      where: whereClause,
      include: {
        daycare: {
          select: { name: true }
        },
        program: {
          select: { name: true }
        },
        offers: {
          select: {
            id: true,
            response: true,
            respondedAt: true,
            offerSentAt: true,
            offerExpiresAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add calculated statistics
    const enhancedCampaigns = campaigns.map(campaign => {
      const offers = campaign.offers;
      const activeOffers = offers.filter(o => !o.response || o.response === OfferResponse.PENDING);
      const expiredOffers = offers.filter(o =>
        o.response === OfferResponse.EXPIRED ||
        (!o.respondedAt && new Date() > o.offerExpiresAt)
      );

      return {
        ...campaign,
        stats: {
          totalOffers: offers.length,
          activeOffers: activeOffers.length,
          acceptedOffers: offers.filter(o => o.response === OfferResponse.ACCEPTED).length,
          declinedOffers: offers.filter(o => o.response === OfferResponse.DECLINED).length,
          expiredOffers: expiredOffers.length,
          responseRate: offers.length > 0
            ? Math.round((offers.filter(o => o.respondedAt).length / offers.length) * 100)
            : 0,
          acceptanceRate: offers.length > 0
            ? Math.round((offers.filter(o => o.response === OfferResponse.ACCEPTED).length / offers.length) * 100)
            : 0
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: enhancedCampaigns,
      meta: {
        total: enhancedCampaigns.length,
        draft: enhancedCampaigns.filter(c => c.status === CampaignStatus.DRAFT).length,
        active: enhancedCampaigns.filter(c => c.status === CampaignStatus.ACTIVE).length,
        completed: enhancedCampaigns.filter(c => c.status === CampaignStatus.COMPLETED).length,
        cancelled: enhancedCampaigns.filter(c => c.status === CampaignStatus.CANCELLED).length
      }
    });

  } catch (error: any) {
    console.error('Get campaigns error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to get campaigns" },
      { status: 500 }
    );
  }
}