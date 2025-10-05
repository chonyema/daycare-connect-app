import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST() {
  try {
    // Get all daycares
    const daycares = await prisma.daycare.findMany();

    console.log(`Found ${daycares.length} daycares`);

    const defaultPrograms = [
      {
        name: 'Infant',
        description: 'Program for infants',
        minAgeMonths: 0,
        maxAgeMonths: 18,
        totalCapacity: 10,
      },
      {
        name: 'Toddler',
        description: 'Program for toddlers',
        minAgeMonths: 18,
        maxAgeMonths: 36,
        totalCapacity: 15,
      },
      {
        name: 'Preschool',
        description: 'Program for preschoolers',
        minAgeMonths: 36,
        maxAgeMonths: 60,
        totalCapacity: 20,
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const daycare of daycares) {
      // Check if programs already exist
      const existingPrograms = await prisma.program.findMany({
        where: { daycareId: daycare.id },
      });

      if (existingPrograms.length > 0) {
        console.log(`${daycare.name} already has ${existingPrograms.length} programs`);
        skipped++;
        continue;
      }

      // Create default programs
      for (const programData of defaultPrograms) {
        await prisma.program.create({
          data: {
            ...programData,
            daycareId: daycare.id,
            operatingDays: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
            operatingHours: JSON.stringify({ start: '07:00', end: '18:00' }),
            isActive: true,
            acceptingWaitlist: true,
          },
        });
      }

      created++;
      console.log(`✓ Created 3 programs for ${daycare.name}`);
    }

    return NextResponse.json({
      success: true,
      message: `Programs seeded successfully. Created for ${created} daycares, skipped ${skipped} daycares.`,
      daycares: daycares.length,
      created,
      skipped
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: 'Failed to seed programs', details: error.message },
      { status: 500 }
    );
  }
}
