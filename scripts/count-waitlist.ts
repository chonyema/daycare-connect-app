import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countWaitlist() {
  const waitlistBookings = await prisma.booking.findMany({
    where: { status: 'WAITLIST' },
    include: {
      daycare: { select: { name: true } },
      parent: { select: { name: true } }
    }
  });

  console.log(`\nTotal WAITLIST bookings: ${waitlistBookings.length}\n`);

  waitlistBookings.forEach((booking, i) => {
    console.log(`${i + 1}. ${booking.childName} at ${booking.daycare.name}`);
    console.log(`   Parent: ${booking.parent.name}`);
    console.log(`   Created: ${booking.createdAt.toLocaleDateString()}`);
  });

  await prisma.$disconnect();
}

countWaitlist();
