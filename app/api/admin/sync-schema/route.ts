import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST() {
  try {
    // Execute raw SQL to add missing columns to waitlist_offers table
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- Add depositRequired column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'waitlist_offers' AND column_name = 'depositrequired'
        ) THEN
          ALTER TABLE "waitlist_offers" ADD COLUMN "depositRequired" BOOLEAN NOT NULL DEFAULT false;
        END IF;

        -- Add depositAmount column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'waitlist_offers' AND column_name = 'depositamount'
        ) THEN
          ALTER TABLE "waitlist_offers" ADD COLUMN "depositAmount" DOUBLE PRECISION;
        END IF;

        -- Add depositPaid column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'waitlist_offers' AND column_name = 'depositpaid'
        ) THEN
          ALTER TABLE "waitlist_offers" ADD COLUMN "depositPaid" BOOLEAN NOT NULL DEFAULT false;
        END IF;

        -- Add depositPaidAt column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'waitlist_offers' AND column_name = 'depositpaidat'
        ) THEN
          ALTER TABLE "waitlist_offers" ADD COLUMN "depositPaidAt" TIMESTAMP(3);
        END IF;

        -- Add requiredDocuments column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'waitlist_offers' AND column_name = 'requireddocuments'
        ) THEN
          ALTER TABLE "waitlist_offers" ADD COLUMN "requiredDocuments" TEXT;
        END IF;
      END $$;
    `);

    return NextResponse.json({
      success: true,
      message: 'Schema synchronized successfully'
    });
  } catch (error: any) {
    console.error('Schema sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync schema', details: error.message },
      { status: 500 }
    );
  }
}
