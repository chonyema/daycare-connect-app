// Check bookings in database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBookings() {
  try {
    console.log('🔍 Checking bookings in database...\n');

    const bookings = await prisma.booking.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        daycare: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${bookings.length} bookings:`);

    if (bookings.length === 0) {
      console.log('No bookings found in database - this is good for new users!');
    } else {
      bookings.forEach((booking, index) => {
        console.log(`\n${index + 1}. Booking ID: ${booking.id}`);
        console.log(`   Child: ${booking.childName}`);
        console.log(`   Parent: ${booking.parent.name} (${booking.parent.email})`);
        console.log(`   Parent ID: ${booking.parentId}`);
        console.log(`   Daycare: ${booking.daycare.name}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Created: ${booking.createdAt}`);
      });
    }

    console.log(`\n📊 Summary:`);
    console.log(`- Total bookings: ${bookings.length}`);

    // Group by parent
    const bookingsByParent = bookings.reduce((acc, booking) => {
      const parentId = booking.parentId;
      if (!acc[parentId]) {
        acc[parentId] = {
          parent: booking.parent,
          count: 0
        };
      }
      acc[parentId].count++;
      return acc;
    }, {});

    console.log('- Bookings by parent:');
    Object.entries(bookingsByParent).forEach(([parentId, data]) => {
      console.log(`  ${data.parent.name}: ${data.count} booking(s)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookings();