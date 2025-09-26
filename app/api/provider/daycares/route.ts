import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireProvider } from '../../../utils/auth';

const prisma = new PrismaClient();

// GET /api/provider/daycares - Get provider's daycares
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const provider = requireProvider(user);
    const providerId = provider.id;
    
    const daycares = await prisma.daycare.findMany({
      where: {
        ownerId: providerId,
      },
      include: {
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          }
        },
        reviews: true,
        _count: {
          select: {
            bookings: true,
            reviews: true,
            savedBy: true
          }
        }
      },
    });

    return NextResponse.json(daycares);
  } catch (error: any) {
    console.error('Provider daycares fetch error:', error);
    
    if (error?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error?.message === 'Provider access required') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch daycares' },
      { status: 500 }
    );
  }
}

// POST /api/provider/daycares - Create new daycare
export async function POST(request: NextRequest) {
  try {
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

    const user = await getUserFromRequest(request);
    const provider = requireProvider(user);
    const providerId = provider.id;

    const daycare = await prisma.daycare.create({
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
        ownerId: providerId,
        verified: false, // Requires admin approval
        active: true,
      },
    });

    return NextResponse.json(daycare, { status: 201 });
  } catch (error: any) {
    console.error('Daycare creation error:', error);
    
    if (error?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error?.message === 'Provider access required') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to create daycare' },
      { status: 500 }
    );
  }
}