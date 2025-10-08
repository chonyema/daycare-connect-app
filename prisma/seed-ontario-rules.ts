import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Ontario jurisdiction rules...');

  // Ontario Licensed Home Child Care
  const ontarioLicensed = await prisma.jurisdictionRule.upsert({
    where: { jurisdiction: 'ON-CA-LICENSED' },
    update: {},
    create: {
      jurisdiction: 'ON-CA-LICENSED',
      name: 'Ontario Licensed Home Child Care',
      description: 'Ontario Ministry of Education regulations for licensed home child care',
      country: 'CA',
      careType: 'LICENSED_HOME',

      // Capacity rules
      maxTotal: 6,        // Maximum 6 children under 13
      maxUnder2: 3,       // Maximum 3 children under 2

      // Age thresholds
      countUnder: 13,           // Count children under 13 toward total
      under2Threshold: 2,       // Children 2+ no longer count as "under 2"

      // Provider's own children rules
      countProviderChildUnder4: true, // Provider's children under 4 count toward total
      providerChildExemptAge: 4,      // Provider's children 4+ don't count

      // School-age children
      includeSchoolAge: true,   // Include before/after school kids in total
      schoolAgeMin: 4,          // School-age category starts at 4

      regulationReference: 'https://www.ontario.ca/laws/regulation/150137',
      notes: 'Licensed home child care providers can care for up to 6 children under 13 years old, with a maximum of 3 children under 2 years old. Provider\'s own children under 4 years old count toward the total capacity.',
      isActive: true,
    },
  });

  // Ontario Unlicensed Home Child Care
  const ontarioUnlicensed = await prisma.jurisdictionRule.upsert({
    where: { jurisdiction: 'ON-CA-UNLICENSED' },
    update: {},
    create: {
      jurisdiction: 'ON-CA-UNLICENSED',
      name: 'Ontario Unlicensed Home Child Care',
      description: 'Ontario regulations for unlicensed home child care (informal care)',
      country: 'CA',
      careType: 'UNLICENSED_HOME',

      // Capacity rules (more restrictive for unlicensed)
      maxTotal: 5,        // Maximum 5 children
      maxUnder2: 2,       // Maximum 2 children under 2

      // Age thresholds
      countUnder: 13,
      under2Threshold: 2,

      // Provider's own children rules
      countProviderChildUnder4: true,
      providerChildExemptAge: 4,

      // School-age children
      includeSchoolAge: true,
      schoolAgeMin: 4,

      notes: 'Unlicensed home child care in Ontario can care for up to 5 children (not including provider\'s own children 4 years and older), with a maximum of 2 children under 2 years old.',
      isActive: true,
    },
  });

  console.log('✅ Created Ontario Licensed Home Child Care rule:', ontarioLicensed.id);
  console.log('✅ Created Ontario Unlicensed Home Child Care rule:', ontarioUnlicensed.id);
  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
