import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Remove push subscription from database
export async function POST(request: NextRequest) {
  try {
    const { endpoint, userId } = await request.json()

    if (!endpoint || !userId) {
      return NextResponse.json(
        { error: 'Endpoint and userId are required' },
        { status: 400 }
      )
    }

    // In a real app, you'd remove the subscription from your PushSubscription table
    // For now, we'll just log it
    console.log('Push subscription removed for:', { userId, endpoint })

    return NextResponse.json({
      success: true,
      message: 'Subscription removed successfully'
    })

  } catch (error: any) {
    console.error('Error removing push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    )
  }
}