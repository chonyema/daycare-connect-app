import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'working',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL
  })
}