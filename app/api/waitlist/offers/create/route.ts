import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { createOffer, rankWaitlistCandidates } from '@/app/utils/waitlist/offerManager';
import { getUserFromRequest, requireProvider } from '@/app/utils/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getUserFromRequest(request);
    const provider = requireProvider(user);

    const body = await request.json();
    const {
      daycareId,
      programId,
      spotStartDate,
      offerWindowHours,
      depositRequired,
      depositAmount,
      requiredDocuments,
      waitlistEntryId, // Optional: specific entry to offer to
    } = body;

    // Verify provider owns this daycare
    const daycare = await prisma.daycare.findFirst({
      where: {
        id: daycareId,
        ownerId: provider.id,
      },
    });

    if (!daycare) {
      return NextResponse.json(
        { error: 'Daycare not found or unauthorized' },
        { status: 404 }
      );
    }

    let targetEntryId = waitlistEntryId;

    // If no specific entry provided, find top-ranked candidate
    if (!targetEntryId) {
      const candidates = await rankWaitlistCandidates(
        daycareId,
        programId,
        new Date(spotStartDate)
      );

      if (candidates.length === 0) {
        return NextResponse.json(
          { error: 'No eligible candidates found on waitlist' },
          { status: 404 }
        );
      }

      targetEntryId = candidates[0].entry.id;
    }

    // Create the offer
    const offer = await createOffer(
      targetEntryId,
      new Date(spotStartDate),
      {
        offerWindowHours,
        depositRequired,
        depositAmount,
        requiredDocuments,
      },
      provider.id
    );

    // Get the full offer with relations
    const fullOffer = await prisma.waitlistOffer.findUnique({
      where: { id: offer.id },
      include: {
        waitlistEntry: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      offer: fullOffer,
      message: 'Offer created successfully',
    });
  } catch (error: any) {
    console.error('Create offer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create offer' },
      { status: 500 }
    );
  }
}
