import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding daycares...')
  
  // Get a user to be the owner
  const user = await prisma.user.findFirst()
  if (!user) {
    console.log('No users found')
    return
  }
  
  const daycares = [
    {
      name: 'Sunshine Daycare Centre',
      type: 'LICENSED_DAYCARE_CENTER',
      description: 'A warm and nurturing environment for children with experienced staff and modern facilities.',
      address: '123 Main St',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M1A 1A1',
      capacity: 30,
      dailyRate: 55.0,
      openTime: '7:00 AM',
      closeTime: '6:00 PM',
      ageGroups: '["Infant", "Toddler", "Preschool"]',
      operatingDays: '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
      features: '["Meals Included", "Outdoor Playground", "Educational Programs"]',
      images: '["https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=300&fit=crop"]',
      verified: true,
      averageRating: 4.8,
      totalReviews: 42,
      waitlistCount: 5,
      ownerId: user.id,
    },
    {
      name: 'Little Stars Home Daycare',
      type: 'LICENSED_HOME_DAYCARE',
      description: 'Intimate home-based care with personalized attention and bilingual environment.',
      address: '456 Oak Ave',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M2B 2B2',
      capacity: 6,
      dailyRate: 45.0,
      openTime: '6:30 AM',
      closeTime: '6:30 PM',
      ageGroups: '["Toddler", "Preschool"]',
      operatingDays: '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
      features: '["Small Groups", "Bilingual", "Flexible Hours"]',
      images: '["https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop"]',
      verified: true,
      averageRating: 4.9,
      totalReviews: 28,
      waitlistCount: 2,
      ownerId: user.id,
    }
  ]
  
  for (const daycare of daycares) {
    try {
      const created = await prisma.daycare.create({ data: daycare })
      console.log(`Created: ${created.name}`)
    } catch (error) {
      console.log(`Error creating ${daycare.name}:`, error)
    }
  }
  
  const count = await prisma.daycare.count()
  console.log(`Total daycares: ${count}`)
}

main().finally(() => prisma.$disconnect())