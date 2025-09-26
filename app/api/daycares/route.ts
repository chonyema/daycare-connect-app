import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching daycares (static data temporarily)...')

    // TEMPORARY: Return static data while debugging Prisma connection issues
    const staticDaycares = [
      {
        id: "static-1",
        name: "Adventure Kids Learning Centre",
        type: "Licensed Daycare Center",
        address: "123 Main St, Toronto, ON",
        distance: "1.2 km",
        distanceValue: 1.2,
        rating: 4.8,
        reviews: 25,
        availableSpots: 15,
        currentOccupancy: 35,
        ageGroups: ["Infant", "Toddler", "Preschool"],
        pricing: "$65/day",
        priceValue: 65,
        hours: "7:00 AM - 6:00 PM",
        image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=300&fit=crop",
        verified: true,
        waitlist: 3,
        features: ["Meals Included", "Playground", "Educational Programs"],
        description: "A wonderful place for children to learn and grow with experienced educators.",
        phone: "(416) 555-0123",
        email: "info@adventurekids.ca"
      },
      {
        id: "static-2",
        name: "Sunshine Daycare",
        type: "Licensed Home Daycare",
        address: "456 Oak Avenue, Toronto, ON",
        distance: "0.8 km",
        distanceValue: 0.8,
        rating: 4.5,
        reviews: 18,
        availableSpots: 4,
        currentOccupancy: 8,
        ageGroups: ["Toddler", "Preschool"],
        pricing: "$55/day",
        priceValue: 55,
        hours: "6:30 AM - 6:30 PM",
        image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400&h=300&fit=crop",
        verified: true,
        waitlist: 1,
        features: ["Home Cooked Meals", "Small Groups", "Flexible Hours"],
        description: "Cozy home environment with personalized care and attention.",
        phone: "(416) 555-0456",
        email: "hello@sunshinedaycare.ca"
      },
      {
        id: "static-3",
        name: "Little Explorers Academy",
        type: "Licensed Daycare Center",
        address: "789 Elm Street, Toronto, ON",
        distance: "2.1 km",
        distanceValue: 2.1,
        rating: 4.7,
        reviews: 32,
        availableSpots: 8,
        currentOccupancy: 42,
        ageGroups: ["Infant", "Toddler", "Preschool", "School Age"],
        pricing: "$70/day",
        priceValue: 70,
        hours: "6:45 AM - 6:15 PM",
        image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop",
        verified: true,
        waitlist: 5,
        features: ["STEM Programs", "Music Classes", "Outdoor Adventures"],
        description: "Innovative learning programs that inspire curiosity and creativity.",
        phone: "(416) 555-0789",
        email: "contact@littleexplorers.ca"
      }
    ]

    return NextResponse.json(staticDaycares)

  } catch (error: any) {
    console.error('Error fetching daycares:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daycares' },
      { status: 500 }
    )
  }
}