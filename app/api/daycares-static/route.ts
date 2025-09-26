import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Return static daycare data to test if frontend can load
  const staticDaycares = [
    {
      id: "test-1",
      name: "Adventure Kids Learning Centre",
      type: "LICENSED_DAYCARE_CENTER",
      description: "A wonderful place for children to learn and grow",
      address: "123 Main St",
      city: "Toronto",
      province: "ON",
      postalCode: "M5H 2N2",
      phone: "(416) 555-0123",
      email: "info@adventurekids.ca",
      capacity: 50,
      currentOccupancy: 35,
      dailyRate: 65.0,
      hourlyRate: 12.0,
      openTime: "7:00 AM",
      closeTime: "6:00 PM",
      operatingDays: '["Monday","Tuesday","Wednesday","Thursday","Friday"]',
      ageGroups: '["Infant","Toddler","Preschool"]',
      features: '["Meals Included","Playground","Educational Programs"]',
      verified: true,
      active: true,
      averageRating: 4.8,
      totalReviews: 25,
      waitlistCount: 3
    },
    {
      id: "test-2",
      name: "Sunshine Daycare",
      type: "LICENSED_HOME_DAYCARE",
      description: "Cozy home environment with personalized care",
      address: "456 Oak Avenue",
      city: "Toronto",
      province: "ON",
      postalCode: "M4K 1A1",
      phone: "(416) 555-0456",
      email: "hello@sunshinedaycare.ca",
      capacity: 12,
      currentOccupancy: 8,
      dailyRate: 55.0,
      hourlyRate: 10.0,
      openTime: "6:30 AM",
      closeTime: "6:30 PM",
      operatingDays: '["Monday","Tuesday","Wednesday","Thursday","Friday"]',
      ageGroups: '["Toddler","Preschool"]',
      features: '["Home Cooked Meals","Small Groups","Flexible Hours"]',
      verified: true,
      active: true,
      averageRating: 4.5,
      totalReviews: 18,
      waitlistCount: 1
    }
  ]

  return NextResponse.json(staticDaycares)
}