import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  let prisma: PrismaClient | null = null

  try {
    console.log('=== SIMPLE DATABASE TEST ===')

    // Get DATABASE_URL directly from environment
    const dbUrl = process.env.DATABASE_URL
    console.log('DATABASE_URL exists:', !!dbUrl)
    console.log('DATABASE_URL prefix:', dbUrl?.substring(0, 50) + '...')

    // Create basic Prisma client without any custom configuration
    prisma = new PrismaClient({
      log: ['error'],
    })

    console.log('Testing $connect...')
    await prisma.$connect()
    console.log('✓ $connect successful')

    console.log('Testing raw query...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✓ Raw query successful:', result)

    return NextResponse.json({
      status: 'success',
      message: 'Simple database test passed',
      result,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!dbUrl
      }
    })

  } catch (error: any) {
    console.error('=== SIMPLE DB TEST FAILED ===')
    console.error('Error:', error.message)
    console.error('Code:', error.code)

    return NextResponse.json({
      status: 'error',
      message: error.message,
      code: error.code,
      name: error.name
    }, { status: 500 })

  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}