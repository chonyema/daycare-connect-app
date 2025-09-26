import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const dbUrl = process.env.DATABASE_URL
    const directUrl = process.env.DIRECT_URL

    if (!dbUrl) {
      return NextResponse.json({
        status: 'error',
        message: 'DATABASE_URL not found'
      }, { status: 500 })
    }

    // Parse URL to show details without exposing password
    const url = new URL(dbUrl)
    const maskedPassword = url.password ? '*'.repeat(url.password.length) : 'NO_PASSWORD'

    return NextResponse.json({
      status: 'success',
      message: 'Environment variables found',
      details: {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        database: url.pathname,
        username: url.username,
        hasPassword: !!url.password,
        passwordLength: url.password?.length || 0,
        searchParams: Array.from(url.searchParams.entries()),
        fullUrlLength: dbUrl.length
      },
      urls: {
        hasDatabaseUrl: !!dbUrl,
        hasDirectUrl: !!directUrl,
        databaseUrlPrefix: dbUrl.substring(0, 70) + '...',
        directUrlPrefix: directUrl?.substring(0, 70) + '...' || 'NOT_SET'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to parse environment variables',
      error: error.message
    }, { status: 500 })
  }
}