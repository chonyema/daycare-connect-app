import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DAYCARES API CALLED (v2) ===')
    console.log('Environment:', process.env.NODE_ENV)
    console.log('Has DATABASE_URL:', !!process.env.DATABASE_URL)
    console.log('Fetching daycares from database (updated)...')

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const location = searchParams.get('location');
    const ageGroup = searchParams.get('ageGroup');
    const sortBy = searchParams.get('sortBy');

    console.log('Full URL:', request.url);
    console.log('Search params:', { search, location, ageGroup, sortBy });

    // Build where clause
    const whereClause: any = {
      active: true
    };

    // Add search filter (using case-insensitive pattern matching)
    if (search) {
      console.log('Adding search filter for:', search);
      const searchLower = search.toLowerCase();
      // We'll filter after fetching since Prisma text search has limitations
    }

    // Add location filter
    if (location && location !== 'Toronto, ON') {
      whereClause.city = { contains: location.split(',')[0].trim(), mode: 'insensitive' };
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'rating') {
      // We'll sort by rating after fetching
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'price-low') {
      orderBy = { dailyRate: 'asc' };
    } else if (sortBy === 'price-high') {
      orderBy = { dailyRate: 'desc' };
    }

    // Get all active daycares from database
    const daycares = await prisma.daycare.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
            savedBy: true
          }
        }
      },
      orderBy
    })

    console.log(`Found ${daycares.length} daycares in database`)
    if (search) {
      console.log(`Applied search filter for: "${search}"`);
    }

    // Transform database data to match frontend expectations
    const transformedDaycares = await Promise.all(daycares.map(async (daycare) => {
      // Calculate average rating
      const averageRating = daycare.reviews.length > 0
        ? daycare.reviews.reduce((sum, review) => sum + review.rating, 0) / daycare.reviews.length
        : 0

      // Parse JSON fields
      const ageGroups = daycare.ageGroups ? JSON.parse(daycare.ageGroups) : []
      const features = daycare.features ? JSON.parse(daycare.features) : []
      const operatingDays = daycare.operatingDays ? JSON.parse(daycare.operatingDays) : []

      // Calculate available spots
      const availableSpots = Math.max(0, daycare.capacity - daycare.currentOccupancy)

      // Calculate real-time waitlist count
      const waitlistCount = await prisma.waitlistEntry.count({
        where: {
          daycareId: daycare.id,
          status: 'ACTIVE'
        }
      })

      console.log(`Parent API - ${daycare.name}: waitlistCount = ${waitlistCount}`);

      return {
        id: daycare.id,
        name: daycare.name,
        type: daycare.type,
        address: `${daycare.address}, ${daycare.city}, ${daycare.province}`,
        city: daycare.city,
        province: daycare.province,
        postalCode: daycare.postalCode,
        phone: daycare.phone,
        email: daycare.email,
        website: daycare.website,
        description: daycare.description,
        distance: "Unknown", // TODO: Calculate based on user location
        distanceValue: 0,
        rating: Number(averageRating.toFixed(1)),
        reviews: daycare._count.reviews,
        availableSpots,
        currentOccupancy: daycare.currentOccupancy,
        capacity: daycare.capacity,
        ageGroups,
        pricing: `$${daycare.dailyRate}/day`,
        priceValue: daycare.dailyRate,
        dailyRate: daycare.dailyRate,
        hourlyRate: daycare.hourlyRate,
        hours: `${daycare.openTime} - ${daycare.closeTime}`,
        openTime: daycare.openTime,
        closeTime: daycare.closeTime,
        operatingDays,
        image: daycare.images ? JSON.parse(daycare.images)[0] : "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=300&fit=crop",
        verified: daycare.verified,
        waitlist: waitlistCount,
        waitlistCount: waitlistCount,
        features,
        owner: daycare.owner,
        ownerId: daycare.ownerId,
        createdAt: daycare.createdAt,
        updatedAt: daycare.updatedAt
      }
    }))

    // Filter by search term if specified
    let filteredDaycares = transformedDaycares;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDaycares = transformedDaycares.filter((daycare: any) =>
        daycare.name.toLowerCase().includes(searchLower) ||
        daycare.type.toLowerCase().includes(searchLower) ||
        (daycare.description && daycare.description.toLowerCase().includes(searchLower)) ||
        daycare.city.toLowerCase().includes(searchLower)
      );
      console.log(`Filtered to ${filteredDaycares.length} daycares matching "${search}"`);
    }

    // Filter by age group if specified
    if (ageGroup && ageGroup !== 'All Ages') {
      filteredDaycares = filteredDaycares.filter((daycare: any) =>
        daycare.ageGroups.includes(ageGroup)
      );
    }

    // Sort by rating if specified
    if (sortBy === 'rating') {
      filteredDaycares.sort((a: any, b: any) => b.rating - a.rating);
    }

    return NextResponse.json(filteredDaycares)

  } catch (error: any) {
    console.error('=== DAYCARES API ERROR ===')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall
    })

    return NextResponse.json(
      {
        error: 'Failed to fetch daycares',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}