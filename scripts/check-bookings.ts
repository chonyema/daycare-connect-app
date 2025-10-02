import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkBookings() {
  const bookings = await prisma.booking.findMany({
    include: {
      daycare: {
        select: {
          name: true,
          capacity: true,
          currentOccupancy: true
        }
      },
      parent: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log('\n📋 All Bookings:')
  console.log('='.repeat(80))

  if (bookings.length === 0) {
    console.log('No bookings found!')
  } else {
    bookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. ${booking.childName} at ${booking.daycare.name}`)
      console.log(`   Status: ${booking.status}`)
      console.log(`   Parent: ${booking.parent.name} (${booking.parent.email})`)
      console.log(`   Start: ${booking.startDate.toLocaleDateString()}`)
      console.log(`   Daycare Occupancy: ${booking.daycare.currentOccupancy}/${booking.daycare.capacity}`)
      console.log(`   Created: ${booking.createdAt.toLocaleString()}`)
    })
  }

  console.log('\n' + '='.repeat(80))
  console.log(`\nTotal bookings: ${bookings.length}`)

  // Group by status
  const statusCount = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('\nBy Status:')
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`)
  })
}

checkBookings()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
