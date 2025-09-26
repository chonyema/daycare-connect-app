import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  let prisma: PrismaClient | null = null

  try {
    console.log('=== SSL DATABASE TEST ===')

    const dbUrl = process.env.DATABASE_URL
    console.log('DATABASE_URL exists:', !!dbUrl)
    console.log('DATABASE_URL includes ssl:', dbUrl?.includes('ssl') || false)

    // Create Prisma client with explicit SSL configuration
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl
        }
      },
      log: ['error', 'warn', 'info'],
      errorFormat: 'pretty'
    })

    console.log('Testing $connect with SSL...')
    await prisma.$connect()
    console.log('✓ Connection successful')

    console.log('Testing raw query...')
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp, version() as pg_version`
    console.log('✓ Query successful:', result)

    return NextResponse.json({
      status: 'success',
      message: 'SSL database connection successful',
      result,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!dbUrl,
        sslConfigured: dbUrl?.includes('ssl') || false
      }
    })

  } catch (error: any) {
    console.error('=== SSL DB TEST FAILED ===')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error details:', {
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    })

    return NextResponse.json({
      status: 'error',
      message: error.message,
      code: error.code,
      name: error.name,
      details: {
        errno: error.errno,
        syscall: error.syscall,
        address: error.address,
        port: error.port
      }
    }, { status: 500 })

  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}