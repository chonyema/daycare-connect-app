import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countWaitlistEntries() {
  const waitlistEntries = await prisma.waitlistEntry.findMany({
    where: { status: 'ACTIVE' },
    include: {
      daycare: { select: { name: true } }
    }
  });

  console.log(`\nTotal ACTIVE WaitlistEntry records: ${waitlistEntries.length}\n`);

  waitlistEntries.forEach((entry, i) => {
    console.log(`${i + 1}. ${entry.childName} at ${entry.daycare.name}`);
    console.log(`   Status: ${entry.status}`);
    console.log(`   Position: ${entry.position}`);
    console.log(`   Joined: ${entry.joinedAt.toLocaleDateString()}`);
  });

  await prisma.$disconnect();
}

countWaitlistEntries();
