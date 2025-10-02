import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixWaitlistCount() {
  console.log('🔧 Fixing daycare waitlist counts...\n')

  // Get all daycares
  const daycares = await prisma.daycare.findMany({
    select: {
      id: true,
      name: true,
      waitlistCount: true,
    },
  })

  for (const daycare of daycares) {
    // Count actual WAITLIST bookings
    const actualWaitlistCount = await prisma.booking.count({
      where: {
        daycareId: daycare.id,
        status: 'WAITLIST',
      },
    })

    console.log(`${daycare.name}:`)
    console.log(`  Stored waitlistCount: ${daycare.waitlistCount}`)
    console.log(`  Actual WAITLIST bookings: ${actualWaitlistCount}`)

    if (daycare.waitlistCount !== actualWaitlistCount) {
      console.log(`  ⚠️  Mismatch detected! Updating...`)

      await prisma.daycare.update({
        where: { id: daycare.id },
        data: { waitlistCount: actualWaitlistCount },
      })

      console.log(`  ✅ Updated to ${actualWaitlistCount}`)
    } else {
      console.log(`  ✅ Already correct`)
    }
    console.log()
  }

  console.log('✅ Waitlist count fix complete!')
}

fixWaitlistCount()
  .catch((e) => {
    console.error('❌ Error fixing waitlist counts:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
