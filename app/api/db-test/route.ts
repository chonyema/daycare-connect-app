import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  let prisma: PrismaClient | null = null

  try {
    console.log('Creating Prisma client...')
    prisma = new PrismaClient()

    console.log('Testing database connection...')
    await prisma.$connect()

    console.log('Connection successful, testing query...')
    const result = await prisma.$queryRaw`SELECT 1 as test`

    console.log('Query successful:', result)

    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      result: result
    })
  } catch (error: any) {
    console.error('Database test error:', error)
    return NextResponse.json({
      status: 'error',
      message: error.message,
      stack: error.stack?.substring(0, 500),
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...'
      }
    }, { status: 500 })
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}