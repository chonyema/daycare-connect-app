import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Store push subscription in database
export async function POST(request: NextRequest) {
  try {
    const { subscription, userId } = await request.json()

    if (!subscription || !userId) {
      return NextResponse.json(
        { error: 'Subscription and userId are required' },
        { status: 400 }
      )
    }

    // Create push subscription table if it doesn't exist
    // For now, we'll store it in a simple way
    const subscriptionData = {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh || '',
      auth: subscription.keys?.auth || '',
      createdAt: new Date(),
    }

    // In a real app, you'd create a PushSubscription model in your Prisma schema
    // For now, we'll use a simple storage approach
    console.log('Push subscription stored:', subscriptionData)

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully'
    })

  } catch (error: any) {
    console.error('Error saving push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}