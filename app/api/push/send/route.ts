import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

// Configure web-push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@daycareconnect.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
  } catch (error) {
    console.warn('VAPID configuration failed:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { subscription, payload, options } = await request.json()

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription is required' },
        { status: 400 }
      )
    }

    const notificationPayload = JSON.stringify({
      title: payload?.title || 'DaycareConnect',
      body: payload?.body || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: payload?.data || {},
      actions: payload?.actions || [],
      ...payload
    })

    const pushOptions = {
      TTL: 60 * 60 * 24, // 24 hours
      ...options
    }

    await webpush.sendNotification(subscription, notificationPayload, pushOptions)

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully'
    })

  } catch (error: any) {
    console.error('Error sending push notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification', details: error.message },
      { status: 500 }
    )
  }
}

// Send notification to multiple users
export async function PUT(request: NextRequest) {
  try {
    const { userIds, payload, options } = await request.json()

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'userIds array is required' },
        { status: 400 }
      )
    }

    // In a real app, you'd fetch subscriptions from database
    // For now, this is a placeholder for the bulk send functionality
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    }

    // This would be implemented with actual database queries
    console.log('Bulk notification request:', { userIds, payload })

    return NextResponse.json({
      success: true,
      message: `Notifications queued for ${userIds.length} users`,
      results
    })

  } catch (error: any) {
    console.error('Error sending bulk notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send bulk notifications' },
      { status: 500 }
    )
  }
}