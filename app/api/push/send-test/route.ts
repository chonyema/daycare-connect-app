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
    const { userId, subscription } = await request.json()

    if (!subscription) {
      return NextResponse.json(
        { error: 'No push subscription found' },
        { status: 400 }
      )
    }

    const testPayload = JSON.stringify({
      title: '🎉 DaycareConnect Test',
      body: 'Push notifications are working perfectly!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: {
        type: 'test',
        timestamp: Date.now(),
        url: '/'
      },
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/icons/icon-96x96.png'
        }
      ]
    })

    await webpush.sendNotification(subscription, testPayload)

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully'
    })

  } catch (error: any) {
    console.error('Error sending test notification:', error)
    return NextResponse.json(
      { error: 'Failed to send test notification', details: error.message },
      { status: 500 }
    )
  }
}