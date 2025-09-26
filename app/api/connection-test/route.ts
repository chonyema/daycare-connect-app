import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Get PostgreSQL module
    const { Client } = require('pg')

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return NextResponse.json({
        status: 'error',
        message: 'DATABASE_URL not found'
      }, { status: 500 })
    }

    console.log('Testing raw PostgreSQL connection...')
    console.log('URL prefix:', dbUrl.substring(0, 50) + '...')

    // Create PostgreSQL client
    const client = new Client({
      connectionString: dbUrl,
      ssl: dbUrl.includes('supabase.co') ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
    })

    try {
      console.log('Connecting to PostgreSQL...')
      await client.connect()
      console.log('✓ Connected successfully')

      console.log('Running test query...')
      const result = await client.query('SELECT 1 as test, NOW() as timestamp')
      console.log('✓ Query successful:', result.rows)

      await client.end()
      console.log('✓ Disconnected successfully')

      return NextResponse.json({
        status: 'success',
        message: 'Raw PostgreSQL connection successful',
        result: result.rows,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDbUrl: !!dbUrl
        }
      })

    } catch (dbError: any) {
      console.error('Database connection failed:', dbError)
      await client.end().catch(() => {})

      return NextResponse.json({
        status: 'error',
        message: 'PostgreSQL connection failed',
        error: dbError.message,
        code: dbError.code,
        details: {
          errno: dbError.errno,
          syscall: dbError.syscall,
          address: dbError.address,
          port: dbError.port
        }
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Test setup failed:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Test setup failed: ' + error.message,
      name: error.name
    }, { status: 500 })
  }
}