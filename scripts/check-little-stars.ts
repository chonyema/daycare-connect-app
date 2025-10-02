import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkLittleStars() {
  const daycare = await prisma.daycare.findFirst({
    where: {
      name: { contains: 'Little Stars' }
    },
    select: {
      id: true,
      name: true,
      capacity: true,
      currentOccupancy: true,
      _count: {
        select: {
          bookings: {
            where: { status: 'CONFIRMED' }
          }
        }
      }
    }
  })

  if (!daycare) {
    console.log('Little Stars daycare not found!')
    return
  }

  console.log('\n📊 Little Stars Home Daycare Status:')
  console.log('=====================================')
  console.log(`Name: ${daycare.name}`)
  console.log(`Capacity: ${daycare.capacity}`)
  console.log(`Current Occupancy (stored): ${daycare.currentOccupancy}`)
  console.log(`Actual CONFIRMED bookings: ${daycare._count.bookings}`)
  console.log(`Available Spots: ${daycare.capacity - daycare.currentOccupancy}`)
  console.log('=====================================\n')

  if (daycare.currentOccupancy !== daycare._count.bookings) {
    console.log('⚠️  WARNING: Occupancy mismatch detected!')
    console.log(`Difference: ${daycare.currentOccupancy - daycare._count.bookings}`)
  } else {
    console.log('✅ Occupancy is correct!')
  }
}

checkLittleStars()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
