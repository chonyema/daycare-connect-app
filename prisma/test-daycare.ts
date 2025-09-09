import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Testing daycare creation...')
  
  // Get the first user to use as owner
  const user = await prisma.user.findFirst()
  console.log('Found user:', user?.name)
  
  try {
    const daycare = await prisma.daycare.create({
      data: {
        name: 'Test Daycare',
        type: 'LICENSED_DAYCARE_CENTER',
        description: 'Test description',
        address: '123 Test St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M1A 1A1',
        capacity: 30,
        dailyRate: 55.0,
        openTime: '7:00 AM',
        closeTime: '6:00 PM',
        ageGroups: '["Infant", "Toddler"]',
        operatingDays: '["Monday", "Tuesday"]',
        ownerId: user!.id,
      },
    })
    console.log('Created daycare:', daycare.name)
  } catch (error) {
    console.error('Error creating daycare:', error)
  }
}

main().finally(() => prisma.$disconnect())