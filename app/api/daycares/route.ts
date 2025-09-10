import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching daycares from database...')

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const ageGroup = searchParams.get('ageGroup') || ''
    const sortBy = searchParams.get('sortBy') || 'name'

    const daycares = await prisma.daycare.findMany({
      where: {
        active: true,
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    // Transform data with proper TypeScript types
    let transformedDaycares = daycares.map((daycare: any) => {
      const availableSpots = Math.max(0, daycare.capacity - daycare.currentOccupancy)
      const ageGroups = JSON.parse(daycare.ageGroups || '["All Ages"]')
      const features = JSON.parse(daycare.features || '[]')
      const images = JSON.parse(daycare.images || '[]')
      
      const typeDisplay = daycare.type
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (l: string) => l.toUpperCase())

      return {
        id: daycare.id,
        name: daycare.name,
        type: typeDisplay,
        address: `${daycare.address}, ${daycare.city}, ${daycare.province}`,
        distance: "1.2 km",
        distanceValue: 1.2,
        rating: Number(daycare.averageRating || 0),
        reviews: daycare.totalReviews || 0,
        availableSpots,
        ageGroups,
        pricing: `$${Number(daycare.dailyRate)}/day`,
        priceValue: Number(daycare.dailyRate),
        hours: `${daycare.openTime} - ${daycare.closeTime}`,
        image: images[0] || 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=300&fit=crop',
        verified: daycare.verified,
        waitlist: daycare.waitlistCount || 0,
        features,
        description: daycare.description || 'Quality childcare services.',
        phone: daycare.phone || daycare.owner.phone,
        email: daycare.email || daycare.owner.email,
      }
    })

    // Apply JavaScript-based filtering with proper types
    if (search) {
      const searchLower = search.toLowerCase()
      transformedDaycares = transformedDaycares.filter((daycare: any) =>
        daycare.name.toLowerCase().includes(searchLower) ||
        daycare.type.toLowerCase().includes(searchLower) ||
        daycare.description.toLowerCase().includes(searchLower) ||
        daycare.features.some((feature: string) => feature.toLowerCase().includes(searchLower))
      )
    }

    if (location && location !== 'Toronto, ON') {
      const locationLower = location.toLowerCase()
      transformedDaycares = transformedDaycares.filter((daycare: any) =>
        daycare.address.toLowerCase().includes(locationLower)
      )
    }

    if (ageGroup && ageGroup !== 'All Ages') {
      transformedDaycares = transformedDaycares.filter((daycare: any) =>
        daycare.ageGroups.some((age: string) => age.toLowerCase().includes(ageGroup.toLowerCase()))
      )
    }

    // Apply sorting with proper types
    transformedDaycares.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'price':
          return a.priceValue - b.priceValue
        case 'availability':
          return b.availableSpots - a.availableSpots
        case 'distance':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return NextResponse.json(transformedDaycares)
  } catch (error) {
    console.error('Error fetching daycares:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch daycares',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}