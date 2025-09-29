import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { OfferResponse, WaitlistStatus, WaitlistAction, CampaignStatus } from '@prisma/client';
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
    const { response, responseNotes, respondedBy } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Offer ID is required" },
        { status: 400 }
      );
    }

    if (!response || !Object.values(OfferResponse).includes(response)) {
      return NextResponse.json(
        { success: false, error: "Valid response is required (ACCEPTED, DECLINED)" },
        { status: 400 }
      );
    }

    // Get offer details
    const offer = await prisma.waitlistOffer.findUnique({
      where: { id },
      include: {
        waitlistEntry: {
          include: {
            parent: { select: { name: true, email: true } },
            daycare: { select: { name: true, dailyRate: true } },
            program: { select: { name: true } }
          }
        },
        campaign: {
          select: {
            id: true,
            name: true,
            spotsRemaining: true,
            status: true
          }
        }
      }
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, error: "Offer not found" },
        { status: 404 }
      );
    }

    // Check if offer has already been responded to
    if (offer.response && offer.response !== OfferResponse.PENDING) {
      return NextResponse.json(
        { success: false, error: "Offer has already been responded to" },
        { status: 400 }
      );
    }

    // Check if offer has expired
    if (new Date() > offer.offerExpiresAt) {
      return NextResponse.json(
        { success: false, error: "Offer has expired" },
        { status: 400 }
      );
    }

    const waitlistEntry = offer.waitlistEntry;
    const campaign = offer.campaign;

    // Process response in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the offer
      const updatedOffer = await tx.waitlistOffer.update({
        where: { id },
        data: {
          response: response as OfferResponse,
          responseNotes,
          respondedAt: new Date()
        }
      });

      let newWaitlistStatus: WaitlistStatus;
      let auditAction: WaitlistAction;
      let auditDescription: string;

      if (response === OfferResponse.ACCEPTED) {
        newWaitlistStatus = WaitlistStatus.ACCEPTED;
        auditAction = WaitlistAction.OFFER_ACCEPTED;
        auditDescription = `Offer accepted${campaign ? ` for campaign "${campaign.name}"` : ''} - converting to enrollment`;

        // Convert to enrollment using atomic capacity manager
        const enrollmentResult = await CapacityManager.convertToEnrollment(id, {
          startDate: offer.spotAvailableDate,
          dailyRate: waitlistEntry.daycare.dailyRate || 0
        });

        if (!enrollmentResult.success) {
          throw new Error(`Failed to convert to enrollment: ${enrollmentResult.error}`);
        }

        // Update campaign statistics if applicable
        if (campaign) {
          await tx.waitlistCampaign.update({
            where: { id: campaign.id },
            data: {
              totalAccepted: { increment: 1 },
              spotsRemaining: { decrement: 1 }
            }
          });

          // Check if campaign is now complete
          const updatedCampaign = await tx.waitlistCampaign.findUnique({
            where: { id: campaign.id },
            select: { spotsRemaining: true, totalAccepted: true, spotsAvailable: true }
          });

          if (updatedCampaign && updatedCampaign.spotsRemaining <= 0) {
            await tx.waitlistCampaign.update({
              where: { id: campaign.id },
              data: {
                status: CampaignStatus.COMPLETED,
                completedAt: new Date()
              }
            });
          }
        }

      } else if (response === OfferResponse.DECLINED) {
        newWaitlistStatus = WaitlistStatus.ACTIVE; // Back to active waitlist
        auditAction = WaitlistAction.OFFER_DECLINED;
        auditDescription = `Offer declined${campaign ? ` for campaign "${campaign.name}"` : ''} - returned to active waitlist`;

        // Release reserved capacity
        const releaseResult = await CapacityManager.releaseCapacity(id);
        if (!releaseResult.success) {
          console.error(`Failed to release capacity for offer ${id}:`, releaseResult.error);
        }

        // Update campaign statistics if applicable
        if (campaign) {
          await tx.waitlistCampaign.update({
            where: { id: campaign.id },
            data: {
              totalDeclined: { increment: 1 }
            }
          });
        }

        // Reset offer-related fields on waitlist entry
        await tx.waitlistEntry.update({
          where: { id: waitlistEntry.id },
          data: {
            lastOfferSentAt: null,
            offerExpiresAt: null,
            offerResponseAt: new Date()
          }
        });
      } else {
        // Handle any other response types (should not happen, but for safety)
        newWaitlistStatus = WaitlistStatus.ACTIVE;
        auditAction = WaitlistAction.BULK_UPDATED;
        auditDescription = `Offer response: ${response}`;
      }

      // Update waitlist entry status
      const updatedEntry = await tx.waitlistEntry.update({
        where: { id: waitlistEntry.id },
        data: {
          status: newWaitlistStatus,
          offerResponse: response as OfferResponse,
          offerResponseAt: new Date(),
          lastUpdatedAt: new Date()
        }
      });

      // Create audit log
      await tx.waitlistAuditLog.create({
        data: {
          waitlistEntryId: waitlistEntry.id,
          daycareId: waitlistEntry.daycareId,
          action: auditAction,
          description: auditDescription,
          performedBy: respondedBy || waitlistEntry.parentId,
          performedByType: 'PARENT',
          oldValues: JSON.stringify({
            status: waitlistEntry.status,
            offerResponse: offer.response
          }),
          newValues: JSON.stringify({
            status: newWaitlistStatus,
            offerResponse: response,
            responseNotes,
            respondedAt: new Date()
          }),
          metadata: JSON.stringify({
            offerId: offer.id,
            campaignId: campaign?.id,
            campaignName: campaign?.name,
            spotAvailableDate: offer.spotAvailableDate,
            offerSentAt: offer.offerSentAt,
            offerExpiresAt: offer.offerExpiresAt
          })
        }
      });

      return {
        offer: updatedOffer,
        waitlistEntry: updatedEntry,
        campaign: campaign
      };
    });

    // If accepted, trigger next offers in campaign (if applicable and automated)
    if (response === OfferResponse.ACCEPTED && campaign && campaign.spotsRemaining > 1) {
      // TODO: Trigger automated next offer in campaign
      // This would be handled by a background job or webhook
    }

    return NextResponse.json({
      success: true,
      message: response === OfferResponse.ACCEPTED
        ? "Offer accepted! You will be contacted shortly to complete enrollment."
        : "Offer declined. You have been returned to the active waitlist.",
      data: {
        response,
        offer: result.offer,
        waitlistEntry: result.waitlistEntry,
        newStatus: result.waitlistEntry.status,
        campaignComplete: campaign && campaign.spotsRemaining <= 1
      }
    });

  } catch (error: any) {
    console.error('Offer response error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to process offer response" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Offer ID is required" },
        { status: 400 }
      );
    }

    const offer = await prisma.waitlistOffer.findUnique({
      where: { id },
      include: {
        waitlistEntry: {
          include: {
            parent: {
              select: { id: true, name: true, email: true }
            },
            daycare: {
              select: { id: true, name: true, address: true, phone: true }
            },
            program: {
              select: { id: true, name: true, description: true }
            }
          }
        },
        campaign: {
          select: {
            id: true,
            name: true,
            description: true,
            spotsAvailable: true,
            spotsRemaining: true
          }
        }
      }
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, error: "Offer not found" },
        { status: 404 }
      );
    }

    // Check if offer has expired
    const isExpired = new Date() > offer.offerExpiresAt;
    const timeRemaining = offer.offerExpiresAt.getTime() - new Date().getTime();
    const hoursRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60)));

    return NextResponse.json({
      success: true,
      data: {
        ...offer,
        isExpired,
        hoursRemaining,
        canRespond: !isExpired && (!offer.response || offer.response === OfferResponse.PENDING)
      }
    });

  } catch (error: any) {
    console.error('Get offer error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to get offer details" },
      { status: 500 }
    );
  }
}