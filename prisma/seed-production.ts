import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding production database...')

  // Create sample users (parents)
  const parent1 = await prisma.user.upsert({
    where: { email: 'parent@test.com' },
    update: {
      id: 'cmfc5uege0000xt2sxukou174',
      name: 'Sarah Johnson',
      phone: '+1-416-555-0123',
    },
    create: {
      id: 'cmfc5uege0000xt2sxukou174',
      email: 'parent@test.com',
      name: 'Sarah Johnson',
      phone: '+1-416-555-0123',
      userType: 'PARENT',
    },
  })

  const parent2 = await prisma.user.upsert({
    where: { email: 'demo@test.com' },
    update: {},
    create: {
      id: 'cmfc5uegf0002xt2s8u9ox175',
      email: 'demo@test.com',
      name: 'Demo Parent',
      phone: '+1-416-555-0456',
      userType: 'PARENT',
    },
  })

  // Create daycare provider
  const provider1 = await prisma.user.upsert({
    where: { email: 'provider@sunshine-daycare.com' },
    update: {},
    create: {
      email: 'provider@sunshine-daycare.com',
      name: 'Sunshine Daycare Owner',
      phone: '+1-416-555-0789',
      userType: 'PROVIDER',
    },
  })

  // Create sample daycares
  const daycare1 = await prisma.daycare.create({
    data: {
      name: 'Sunshine Daycare Centre',
      type: 'LICENSED_DAYCARE_CENTER',
      description: 'A warm and nurturing environment for children with experienced staff and modern facilities.',
      address: '123 Main St',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 1A1',
      phone: '+1-416-555-0100',
      email: 'info@sunshine-daycare.com',
      capacity: 50,
      currentOccupancy: 47,
      ageGroups: '["Infant", "Toddler", "Preschool"]',
      dailyRate: 55.00,
      hourlyRate: 8.00,
      openTime: '07:00',
      closeTime: '18:00',
      operatingDays: '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
      features: '["Meals Included", "Outdoor Playground", "Educational Programs"]',
      images: '["https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=300&fit=crop"]',
      verified: true,
      active: true,
      averageRating: 4.8,
      totalReviews: 42,
      waitlistCount: 5,
      ownerId: provider1.id,
    },
  })

  const daycare2 = await prisma.daycare.create({
    data: {
      name: 'Little Stars Home Daycare',
      type: 'LICENSED_HOME_DAYCARE',
      description: 'Intimate home-based care with personalized attention and bilingual environment.',
      address: '456 Oak Ave',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M4K 2B2',
      phone: '+1-416-555-0200',
      email: 'info@littlestars.com',
      capacity: 6,
      currentOccupancy: 5,
      ageGroups: '["Toddler", "Preschool"]',
      dailyRate: 45.00,
      hourlyRate: 7.00,
      openTime: '06:30',
      closeTime: '18:30',
      operatingDays: '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
      features: '["Small Groups", "Bilingual", "Flexible Hours"]',
      images: '["https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop"]',
      verified: true,
      active: true,
      averageRating: 4.9,
      totalReviews: 28,
      waitlistCount: 2,
      ownerId: provider1.id,
    },
  })

  console.log('Seeding completed successfully!')
  console.log('Created users:', { parent1: parent1.id, parent2: parent2.id, provider1: provider1.id })
  console.log('Created daycares:', { daycare1: daycare1.id, daycare2: daycare2.id })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })