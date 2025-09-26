import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DATABASE PING TEST ===')

    // Get DATABASE_URL
    const dbUrl = process.env.DATABASE_URL
    console.log('DATABASE_URL exists:', !!dbUrl)
    console.log('DATABASE_URL length:', dbUrl?.length || 0)
    console.log('DATABASE_URL prefix:', dbUrl?.substring(0, 60) + '...')

    if (!dbUrl) {
      return NextResponse.json({
        status: 'error',
        message: 'DATABASE_URL not found in environment variables'
      }, { status: 500 })
    }

    // Parse URL to extract connection details
    let parsedUrl;
    try {
      parsedUrl = new URL(dbUrl);
    } catch (urlError) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid DATABASE_URL format',
        details: dbUrl.substring(0, 100) + '...'
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'success',
      message: 'Environment variables accessible',
      details: {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        database: parsedUrl.pathname,
        hasUsername: !!parsedUrl.username,
        hasPassword: !!parsedUrl.password,
        searchParams: Array.from(parsedUrl.searchParams.entries())
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        runtime: 'nodejs'
      }
    })

  } catch (error: any) {
    console.error('=== DB PING FAILED ===')
    console.error('Error:', error.message)

    return NextResponse.json({
      status: 'error',
      message: error.message,
      name: error.name
    }, { status: 500 })
  }
}