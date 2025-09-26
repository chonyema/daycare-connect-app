import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...')

    // Simple database test
    const userCount = await prisma.user.count()
    const daycareCount = await prisma.daycare.count()

    console.log(`Users: ${userCount}, Daycares: ${daycareCount}`)

    return NextResponse.json({
      status: 'success',
      database: 'connected',
      users: userCount,
      daycares: daycareCount,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...'
      }
    })
  } catch (error: any) {
    console.error('Database test error:', error)
    return NextResponse.json({
      status: 'error',
      message: error.message,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...'
      }
    }, { status: 500 })
  }
}