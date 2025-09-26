import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireProvider } from '../../../../utils/auth';

const prisma = new PrismaClient();

// PUT /api/provider/daycares/[id] - Update daycare
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request);
    const provider = requireProvider(user);
    const providerId = provider.id;
    
    const body = await request.json();
    const {
      name,
      type,
      description,
      address,
      city,
      province,
      postalCode,
      phone,
      email,
      website,
      capacity,
      ageGroups,
      dailyRate,
      hourlyRate,
      openTime,
      closeTime,
      operatingDays,
      features,
      images
    } = body;

    // Verify the daycare belongs to the provider
    const existingDaycare = await prisma.daycare.findFirst({
      where: {
        id: params.id,
        ownerId: providerId,
      },
    });

    if (!existingDaycare) {
      return NextResponse.json(
        { error: 'Daycare not found or access denied' },
        { status: 404 }
      );
    }

    const daycare = await prisma.daycare.update({
      where: { id: params.id },
      data: {
        name,
        type,
        description,
        address,
        city,
        province,
        postalCode,
        phone,
        email,
        website,
        capacity: parseInt(capacity),
        ageGroups: JSON.stringify(ageGroups),
        dailyRate: parseFloat(dailyRate),
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        openTime,
        closeTime,
        operatingDays: JSON.stringify(operatingDays),
        features: features ? JSON.stringify(features) : null,
        images: images ? JSON.stringify(images) : null,
      },
    });

    return NextResponse.json(daycare);
  } catch (error: any) {
    console.error('Daycare update error:', error);

    if (error?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (error?.message === 'Provider access required') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update daycare' },
      { status: 500 }
    );
  }
}

// DELETE /api/provider/daycares/[id] - Delete daycare
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request);
    const provider = requireProvider(user);
    const providerId = provider.id;
    
    // Verify the daycare belongs to the provider
    const existingDaycare = await prisma.daycare.findFirst({
      where: {
        id: params.id,
        ownerId: providerId,
      },
    });

    if (!existingDaycare) {
      return NextResponse.json(
        { error: 'Daycare not found or access denied' },
        { status: 404 }
      );
    }

    await prisma.daycare.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Daycare deleted successfully' });
  } catch (error: any) {
    console.error('Daycare deletion error:', error);
    
    if (error?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error?.message === 'Provider access required') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to delete daycare' },
      { status: 500 }
    );
  }
}