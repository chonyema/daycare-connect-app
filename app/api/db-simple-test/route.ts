import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('=== SIMPLE DB TEST ===')

    await prisma.$connect()
    console.log('✓ Database connection successful')

    const count = await prisma.daycare.count()
    console.log(`✓ Found ${count} daycares in database`)

    return NextResponse.json({
      status: 'success',
      message: 'Database connection and query successful',
      daycareCount: count,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('=== SIMPLE DB TEST FAILED ===')
    console.error('Error:', error.message)

    return NextResponse.json({
      status: 'error',
      message: 'Database test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })

  } finally {
    await prisma.$disconnect()
  }
}