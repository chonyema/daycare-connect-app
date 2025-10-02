import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixOccupancy() {
  console.log('🔧 Fixing daycare occupancy counts...')

  // Get all daycares
  const daycares = await prisma.daycare.findMany({
    select: {
      id: true,
      name: true,
      capacity: true,
      currentOccupancy: true,
    },
  })

  for (const daycare of daycares) {
    // Count actual CONFIRMED bookings
    const confirmedCount = await prisma.booking.count({
      where: {
        daycareId: daycare.id,
        status: 'CONFIRMED',
      },
    })

    console.log(`\n${daycare.name}:`)
    console.log(`  Capacity: ${daycare.capacity}`)
    console.log(`  Current occupancy (stored): ${daycare.currentOccupancy}`)
    console.log(`  Actual confirmed bookings: ${confirmedCount}`)

    if (daycare.currentOccupancy !== confirmedCount) {
      console.log(`  ⚠️  Mismatch detected! Updating...`)

      await prisma.daycare.update({
        where: { id: daycare.id },
        data: { currentOccupancy: confirmedCount },
      })

      console.log(`  ✅ Updated to ${confirmedCount}`)
    } else {
      console.log(`  ✅ Already correct`)
    }
  }

  console.log('\n✅ Occupancy fix complete!')
}

fixOccupancy()
  .catch((e) => {
    console.error('❌ Error fixing occupancy:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
