import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Hash password for test users
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create or update test users (upsert to avoid duplicate errors)
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@test.com' },
    update: {},
    create: {
      email: 'parent@test.com',
      name: 'Sarah Johnson',
      phone: '(416) 555-0123',
      password: hashedPassword,
      userType: 'PARENT',
    },
  })

  const providerUser1 = await prisma.user.upsert({
    where: { email: 'provider1@test.com' },
    update: {},
    create: {
      email: 'provider1@test.com',
      name: 'Michelle Smith',
      phone: '(416) 555-0456',
      password: hashedPassword,
      userType: 'PROVIDER',
    },
  })

  const providerUser2 = await prisma.user.upsert({
    where: { email: 'provider2@test.com' },
    update: {},
    create: {
      email: 'provider2@test.com',
      name: 'David Chen',
      phone: '(416) 555-0789',
      password: hashedPassword,
      userType: 'PROVIDER',
    },
  })

  // Create test daycares (find or create)
  let daycare1 = await prisma.daycare.findFirst({
    where: {
      name: 'Sunshine Daycare Centre',
      ownerId: providerUser1.id,
    },
  })

  if (!daycare1) {
    daycare1 = await prisma.daycare.create({
      data: {
        name: 'Sunshine Daycare Centre',
        type: 'LICENSED_DAYCARE_CENTER',
        description: 'A warm and nurturing environment for children with experienced staff and modern facilities.',
        address: '123 Main St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M1A 1A1',
        phone: '(416) 555-0789',
        email: 'info@sunshine-daycare.com',
        capacity: 30,
        currentOccupancy: 27,
        ageGroups: '["Infant", "Toddler", "Preschool"]',
        dailyRate: 55.0,
        openTime: '7:00 AM',
        closeTime: '6:00 PM',
        operatingDays: '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
        features: '["Meals Included", "Outdoor Playground", "Educational Programs"]',
        images: '["https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=300&fit=crop"]',
        verified: true,
        averageRating: 4.8,
        totalReviews: 42,
        waitlistCount: 5,
        ownerId: providerUser1.id,
      },
    })
  }

  let daycare2 = await prisma.daycare.findFirst({
    where: {
      name: 'Little Stars Home Daycare',
      ownerId: providerUser1.id,
    },
  })

  if (!daycare2) {
    daycare2 = await prisma.daycare.create({
      data: {
        name: 'Little Stars Home Daycare',
        type: 'LICENSED_HOME_DAYCARE',
        description: 'Intimate home-based care with personalized attention and bilingual environment.',
        address: '456 Oak Ave',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M2B 2B2',
        phone: '(416) 555-0234',
        email: 'info@littlestars.com',
        capacity: 6,
        currentOccupancy: 5,
        ageGroups: '["Toddler", "Preschool"]',
        dailyRate: 45.0,
        openTime: '6:30 AM',
        closeTime: '6:30 PM',
        operatingDays: '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
        features: '["Small Groups", "Bilingual", "Flexible Hours"]',
        images: '["https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop"]',
        verified: true,
        averageRating: 4.9,
        totalReviews: 28,
        waitlistCount: 2,
        ownerId: providerUser1.id,
      },
    })
  }

  let daycare3 = await prisma.daycare.findFirst({
    where: {
      name: 'Adventure Kids Learning Centre',
      ownerId: providerUser2.id,
    },
  })

  if (!daycare3) {
    daycare3 = await prisma.daycare.create({
      data: {
        name: 'Adventure Kids Learning Centre',
        type: 'LICENSED_DAYCARE_CENTER',
        description: 'Focus on learning through play with STEM programs and creative activities.',
        address: '789 Pine St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M3C 3C3',
        phone: '(416) 555-0345',
        email: 'info@adventurekids.com',
        capacity: 25,
        currentOccupancy: 25,
        ageGroups: '["Preschool", "School Age"]',
        dailyRate: 60.0,
        openTime: '7:00 AM',
        closeTime: '6:00 PM',
        operatingDays: '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
        features: '["STEM Programs", "Music Classes", "Hot Meals"]',
        images: '["https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop"]',
        verified: true,
        averageRating: 4.6,
        totalReviews: 67,
        waitlistCount: 12,
        ownerId: providerUser2.id,
      },
    })
  }

  // Create test reviews (skip if already exist)
  const existingReview1 = await prisma.review.findFirst({
    where: {
      parentId: parentUser.id,
      daycareId: daycare1.id,
      title: 'Amazing Experience!',
    },
  })

  if (!existingReview1) {
    await prisma.review.create({
      data: {
        rating: 5,
        title: 'Amazing Experience!',
        comment: 'My daughter loves going here and the staff is so caring and professional. Highly recommend!',
        parentId: parentUser.id,
        daycareId: daycare1.id,
      },
    })
  }

  const existingReview2 = await prisma.review.findFirst({
    where: {
      parentId: parentUser.id,
      daycareId: daycare2.id,
      title: 'Great communication',
    },
  })

  if (!existingReview2) {
    await prisma.review.create({
      data: {
        rating: 4,
        title: 'Great communication',
        comment: 'The staff keeps us updated daily and my son has learned so much here.',
        parentId: parentUser.id,
        daycareId: daycare2.id,
      },
    })
  }

  // Create test bookings for attendance testing (skip if already exist)
  let booking1 = await prisma.booking.findFirst({
    where: {
      parentId: parentUser.id,
      daycareId: daycare1.id,
      childName: 'Emma Johnson',
    },
  })

  if (!booking1) {
    booking1 = await prisma.booking.create({
      data: {
        parentId: parentUser.id,
        daycareId: daycare1.id,
        childName: 'Emma Johnson',
        childAge: '3 years',
        startDate: new Date('2024-01-01'),
        careType: 'FULL_TIME',
        status: 'CONFIRMED',
        dailyRate: 55.0,
        notes: 'Allergic to peanuts',
      },
    })
  }

  let booking2 = await prisma.booking.findFirst({
    where: {
      parentId: parentUser.id,
      daycareId: daycare1.id,
      childName: 'Oliver Johnson',
    },
  })

  if (!booking2) {
    booking2 = await prisma.booking.create({
      data: {
        parentId: parentUser.id,
        daycareId: daycare1.id,
        childName: 'Oliver Johnson',
        childAge: '5 years',
        startDate: new Date('2024-01-01'),
        careType: 'FULL_TIME',
        status: 'CONFIRMED',
        dailyRate: 55.0,
      },
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log(`Created:`)
  console.log(`- ${await prisma.user.count()} users`)
  console.log(`- ${await prisma.daycare.count()} daycares`)
  console.log(`- ${await prisma.booking.count()} bookings`)
  console.log(`- ${await prisma.review.count()} reviews`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })