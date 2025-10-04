import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { processOfferResponse } from '@/app/utils/waitlist/offerManager';
import { getUserFromRequest, requireProvider } from '@/app/utils/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await getUserFromRequest(request);
    if (!user || user.userType !== 'PARENT') {
      return NextResponse.json(
        { error: 'Unauthorized - Parent access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { response, notes, depositPaid } = body;

    if (!['ACCEPTED', 'DECLINED'].includes(response)) {
      return NextResponse.json(
        { error: 'Invalid response. Must be ACCEPTED or DECLINED' },
        { status: 400 }
      );
    }

    // Verify offer belongs to this parent
    const offer = await prisma.waitlistOffer.findUnique({
      where: { id: params.id },
      include: {
        waitlistEntry: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    if (offer.waitlistEntry.parentId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Not your offer' },
        { status: 403 }
      );
    }

    // Check if offer is still valid
    if (offer.offerExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Offer has expired' },
        { status: 400 }
      );
    }

    // Check if already responded
    if (offer.response) {
      return NextResponse.json(
        { error: 'Offer already responded to' },
        { status: 400 }
      );
    }

    // Process the response
    await processOfferResponse(params.id, response, notes, depositPaid);

    // Get updated offer
    const updatedOffer = await prisma.waitlistOffer.findUnique({
      where: { id: params.id },
      include: {
        waitlistEntry: {
          include: {
            daycare: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      offer: updatedOffer,
      message: `Offer ${response.toLowerCase()} successfully`,
    });
  } catch (error: any) {
    console.error('Respond to offer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to respond to offer' },
      { status: 500 }
    );
  }
}
