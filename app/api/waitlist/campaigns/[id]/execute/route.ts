import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { CampaignStatus, WaitlistStatus, OfferResponse, WaitlistAction } from '@prisma/client';
import { CapacityManager } from '@/app/utils/waitlist/capacityManager';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { performedBy, dryRun = false } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Get campaign details
    const campaign = await prisma.waitlistCampaign.findUnique({
      where: { id },
      include: {
        daycare: { select: { name: true } },
        program: { select: { name: true } }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      return NextResponse.json(
        { success: false, error: "Campaign is not in draft status" },
        { status: 400 }
      );
    }

    if (campaign.spotsRemaining <= 0) {
      return NextResponse.json(
        { success: false, error: "No spots remaining in campaign" },
        { status: 400 }
      );
    }

    // Get eligible waitlist entries
    const whereClause: any = {
      daycareId: campaign.daycareId,
      status: WaitlistStatus.ACTIVE
    };

    if (campaign.programId) {
      whereClause.programId = campaign.programId;
    }

    const eligibleEntries = await prisma.waitlistEntry.findMany({
      where: whereClause,
      include: {
        parent: {
          select: { id: true, name: true, email: true }
        },
        offers: {
          where: {
            OR: [
              { response: 'PENDING' },
              { response: null }
            ],
            offerExpiresAt: { gt: new Date() }
          }
        }
      },
      orderBy: [
        { priorityScore: 'desc' },
        { joinedAt: 'asc' }
      ]
    });

    // Filter out entries that already have active offers
    const availableEntries = eligibleEntries.filter(entry => (entry as any).offers.length === 0);

    if (availableEntries.length === 0) {
      return NextResponse.json(
        { success: false, error: "No eligible waitlist entries found" },
        { status: 400 }
      );
    }

    // Check actual capacity before sending offers
    const capacityCheck = await CapacityManager.checkCapacity({
      daycareId: campaign.daycareId,
      programId: campaign.programId || undefined,
      requiredSlots: campaign.spotsRemaining
    });

    if (!capacityCheck.hasCapacity) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient capacity. Available: ${capacityCheck.availableSlots}, Required: ${campaign.spotsRemaining}`,
          capacityInfo: capacityCheck
        },
        { status: 400 }
      );
    }

    // Calculate how many offers to send based on actual available capacity
    const maxOffersToSend = Math.min(
      capacityCheck.availableSlots * campaign.maxOfferAttempts,
      availableEntries.length,
      campaign.spotsRemaining * campaign.maxOfferAttempts
    );

    const entriesToOffer = availableEntries.slice(0, maxOffersToSend);

    // Calculate offer expiration time
    const offerExpiresAt = new Date();
    offerExpiresAt.setHours(offerExpiresAt.getHours() + campaign.offerWindowHours);

    const executionPlan = {
      campaignId: campaign.id,
      campaignName: campaign.name,
      spotsAvailable: campaign.spotsAvailable,
      spotsRemaining: campaign.spotsRemaining,
      maxOfferAttempts: campaign.maxOfferAttempts,
      offerWindowHours: campaign.offerWindowHours,
      eligibleEntries: eligibleEntries.length,
      availableEntries: availableEntries.length,
      plannedOffers: entriesToOffer.length,
      offerExpiresAt,
      entries: entriesToOffer.map((entry, index) => ({
        entryId: entry.id,
        childName: entry.childName,
        parentName: (entry as any).parent.name,
        parentEmail: (entry as any).parent.email,
        position: entry.position,
        priorityScore: entry.priorityScore,
        daysOnWaitlist: Math.floor(
          (new Date().getTime() - entry.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
        order: index + 1
      }))
    };

    // If dry run, return execution plan without making changes
    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: "Campaign execution plan generated (dry run)",
        data: executionPlan
      });
    }

    // Execute the campaign
    const results = {
      offersCreated: 0,
      entriesUpdated: 0,
      errors: [] as string[]
    };

    // Start transaction for campaign execution
    await prisma.$transaction(async (tx) => {
      // Update campaign status
      await tx.waitlistCampaign.update({
        where: { id: campaign.id },
        data: {
          status: CampaignStatus.ACTIVE,
          startedAt: new Date()
        }
      });

      // Create offers for selected entries with atomic capacity reservation
      for (const entry of entriesToOffer) {
        try {
          // First reserve capacity atomically
          const reservationResult = await CapacityManager.reserveCapacity({
            daycareId: campaign.daycareId,
            programId: campaign.programId || undefined,
            slots: 1, // Each offer reserves 1 slot
            offerId: `temp-${entry.id}-${Date.now()}`, // Temporary ID
            expiresAt: offerExpiresAt,
            userId: performedBy
          });

          if (!reservationResult.success) {
            console.error(`Failed to reserve capacity for entry ${entry.id}:`, reservationResult.error);
            results.errors.push(`Failed to reserve capacity for ${entry.childName}: ${reservationResult.error}`);
            continue;
          }

          // Create the offer with confirmed capacity
          const offer = await tx.waitlistOffer.create({
            data: {
              waitlistEntryId: entry.id,
              campaignId: campaign.id,
              spotAvailableDate: campaign.spotAvailableDate,
              offerExpiresAt,
              isAutomated: true,
              priorityAtOffer: entry.priorityScore,
              positionAtOffer: entry.position,
              createdBy: performedBy
            }
          });

          // Update waitlist entry status
          await tx.waitlistEntry.update({
            where: { id: entry.id },
            data: {
              status: WaitlistStatus.OFFERED,
              lastOfferSentAt: new Date(),
              offerExpiresAt,
              offerAttempts: { increment: 1 }
            }
          });

          // Create audit log
          await tx.waitlistAuditLog.create({
            data: {
              waitlistEntryId: entry.id,
              daycareId: campaign.daycareId,
              action: WaitlistAction.OFFER_SENT,
              description: `Offer sent via campaign "${campaign.name}" - spot available ${campaign.spotAvailableDate.toDateString()}`,
              performedBy,
              performedByType: 'PROVIDER',
              newValues: JSON.stringify({
                offerId: offer.id,
                campaignId: campaign.id,
                offerExpiresAt,
                spotAvailableDate: campaign.spotAvailableDate,
                priorityAtOffer: entry.priorityScore,
                positionAtOffer: entry.position
              }),
              metadata: JSON.stringify({
                automated: true,
                campaignName: campaign.name,
                offerWindowHours: campaign.offerWindowHours
              })
            }
          });

          results.offersCreated++;
          results.entriesUpdated++;

        } catch (error: any) {
          console.error(`Failed to create offer for entry ${entry.id}:`, error);
          results.errors.push(`Failed to create offer for ${entry.childName}: ${error.message}`);
        }
      }

      // Update campaign statistics
      await tx.waitlistCampaign.update({
        where: { id: campaign.id },
        data: {
          totalOffered: { increment: results.offersCreated }
        }
      });
    });

    // TODO: Send notification emails/push notifications to parents
    // This would integrate with the messaging system

    return NextResponse.json({
      success: true,
      message: `Campaign executed successfully - ${results.offersCreated} offers sent`,
      data: {
        ...executionPlan,
        executionResults: results,
        actualOffersSent: results.offersCreated
      }
    });

  } catch (error: any) {
    console.error('Execute campaign error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to execute campaign" },
      { status: 500 }
    );
  }
}