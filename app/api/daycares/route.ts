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

    // Get all active daycares from database
    const daycares = await prisma.daycare.findMany({
      where: {
        active: true
      },
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`Found ${daycares.length} daycares in database`)

    // Transform database data to match frontend expectations
    const transformedDaycares = daycares.map(daycare => {
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
        waitlist: 0, // TODO: Calculate from bookings with WAITLIST status
        features,
        owner: daycare.owner,
        createdAt: daycare.createdAt,
        updatedAt: daycare.updatedAt
      }
    })

    return NextResponse.json(transformedDaycares)

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