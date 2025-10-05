import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST() {
  try {
    // Execute raw SQL to add missing columns to waitlist_offers table
    const columns = [
      { name: 'depositRequired', sql: 'ALTER TABLE "waitlist_offers" ADD COLUMN "depositRequired" BOOLEAN NOT NULL DEFAULT false' },
      { name: 'depositAmount', sql: 'ALTER TABLE "waitlist_offers" ADD COLUMN "depositAmount" DOUBLE PRECISION' },
      { name: 'depositPaid', sql: 'ALTER TABLE "waitlist_offers" ADD COLUMN "depositPaid" BOOLEAN NOT NULL DEFAULT false' },
      { name: 'depositPaidAt', sql: 'ALTER TABLE "waitlist_offers" ADD COLUMN "depositPaidAt" TIMESTAMP(3)' },
      { name: 'requiredDocuments', sql: 'ALTER TABLE "waitlist_offers" ADD COLUMN "requiredDocuments" TEXT' },
      { name: 'seatId', sql: 'ALTER TABLE "waitlist_offers" ADD COLUMN "seatId" TEXT' },
      { name: 'createdBy', sql: 'ALTER TABLE "waitlist_offers" ADD COLUMN "createdBy" TEXT' },
    ];

    const results = [];
    for (const column of columns) {
      try {
        await prisma.$executeRawUnsafe(column.sql);
        results.push({ column: column.name, status: 'added' });
      } catch (error: any) {
        if (error.code === '42701') {
          // Column already exists
          results.push({ column: column.name, status: 'exists' });
        } else {
          results.push({ column: column.name, status: 'error', error: error.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Schema synchronized successfully',
      results
    });
  } catch (error: any) {
    console.error('Schema sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync schema', details: error.message },
      { status: 500 }
    );
  }
}
