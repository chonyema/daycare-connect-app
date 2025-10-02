import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateStatus() {
  console.log('🔄 Migrating COMPLETED bookings to OFFBOARDED...\n')

  // First, update the enum value directly in the database
  try {
    await prisma.$executeRaw`
      UPDATE "bookings"
      SET status = 'OFFBOARDED'
      WHERE status = 'COMPLETED'
    `

    const updated = await prisma.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count
      FROM "bookings"
      WHERE status = 'OFFBOARDED'
    `

    console.log(`✅ Migrated ${updated[0].count} bookings from COMPLETED to OFFBOARDED\n`)
  } catch (error) {
    console.error('Error during migration:', error)
  }
}

migrateStatus()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
