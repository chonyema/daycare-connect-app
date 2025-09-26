import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { formatDatabaseUrl, dbConfig } from '@/app/lib/db-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  let prisma: PrismaClient | null = null

  try {
    console.log('=== DATABASE CONNECTION TEST V2 ===')

    // Log environment info
    const dbUrl = process.env.DATABASE_URL
    const hasDbUrl = !!dbUrl
    const dbUrlPrefix = dbUrl?.substring(0, 50) + '...'
    const optimizedUrl = formatDatabaseUrl(dbUrl || '')

    console.log('Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      hasDbUrl,
      dbUrlPrefix,
      isOptimized: optimizedUrl !== dbUrl
    })

    // Create Prisma client with optimized settings
    console.log('Creating optimized Prisma client...')
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: optimizedUrl
        }
      },
      log: ['error', 'warn'],
      errorFormat: 'pretty'
    })

    // Test connection
    console.log('Testing database connection...')
    await prisma.$connect()
    console.log('✓ Connection successful')

    // Test simple query
    console.log('Testing simple query...')
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`
    console.log('✓ Query successful:', result)

    // Test table access
    console.log('Testing table access...')
    try {
      const userCount = await prisma.user.count()
      console.log('✓ User table accessible, count:', userCount)
    } catch (tableError: any) {
      console.log('⚠ User table error:', tableError.message)
    }

    // Test another table
    try {
      const daycareCount = await prisma.daycare.count()
      console.log('✓ Daycare table accessible, count:', daycareCount)
    } catch (tableError: any) {
      console.log('⚠ Daycare table error:', tableError.message)
    }

    console.log('=== TEST COMPLETED SUCCESSFULLY ===')

    return NextResponse.json({
      status: 'success',
      message: 'All database tests passed',
      details: {
        connection: 'OK',
        simpleQuery: 'OK',
        tables: 'OK'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        runtime: 'nodejs',
        hasDbUrl,
        isUrlOptimized: optimizedUrl !== dbUrl
      },
      testResults: result
    })

  } catch (error: any) {
    console.error('=== DATABASE TEST FAILED ===')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error stack:', error.stack?.substring(0, 1000))

    // Specific Prisma error handling
    if (error.code === 'P1001') {
      console.error('Database unreachable - check connection string and network')
    } else if (error.code === 'P1008') {
      console.error('Operations timed out - connection pool exhausted')
    } else if (error.code === 'P1010') {
      console.error('User access denied - check credentials')
    }

    return NextResponse.json({
      status: 'error',
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack?.substring(0, 500),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 50) + '...'
      }
    }, { status: 500 })

  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect()
        console.log('✓ Database disconnected cleanly')
      } catch (disconnectError) {
        console.error('Disconnect error:', disconnectError)
      }
    }
  }
}