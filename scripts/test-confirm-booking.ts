import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  console.log('\n🧪 Testing Booking Confirmation Flow...\n');

  // Find Sunshine Daycare
  const daycare = await prisma.daycare.findFirst({
    where: { name: { contains: 'Sunshine' } }
  });

  // Find parent
  const parent = await prisma.user.findFirst({
    where: { email: 'parent@test.com' }
  });

  if (!daycare || !parent) {
    console.log('❌ Missing data');
    return;
  }

  console.log('📊 BEFORE Confirmation:');
  console.log(`   ${daycare.name}`);
  console.log(`   Occupancy: ${daycare.currentOccupancy}/${daycare.capacity}`);
  console.log(`   Available: ${daycare.capacity - daycare.currentOccupancy}`);

  // Create a CONFIRMED booking
  const booking = await prisma.booking.create({
    data: {
      parentId: parent.id,
      daycareId: daycare.id,
      childName: 'Test Child for Confirmation',
      childAge: '4 years',
      startDate: new Date(),
      careType: 'FULL_TIME',
      status: 'CONFIRMED',
      dailyRate: 55.0
    }
  });

  console.log(`\n✅ Created CONFIRMED booking: ${booking.childName}`);

  // Update occupancy
  const updated = await prisma.daycare.update({
    where: { id: daycare.id },
    data: { currentOccupancy: { increment: 1 } }
  });

  console.log('\n📊 AFTER Confirmation:');
  console.log(`   ${updated.name}`);
  console.log(`   Occupancy: ${updated.currentOccupancy}/${updated.capacity}`);
  console.log(`   Available: ${updated.capacity - updated.currentOccupancy}`);

  console.log('\n✅ Test complete!\n');
}

test()
  .catch((e) => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
