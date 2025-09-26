'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface PushNotificationState {
  isSupported: boolean
  subscription: PushSubscription | null
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
}

export function usePushNotifications() {
  const { user } = useAuth()
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    subscription: null,
    isSubscribed: false,
    isLoading: false,
    error: null,
  })

  // Check if push notifications are supported
  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window
    setState(prev => ({ ...prev, isSupported }))

    if (isSupported) {
      checkExistingSubscription()
    }
  }, [])

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      setState(prev => ({
        ...prev,
        subscription,
        isSubscribed: !!subscription,
      }))
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    let permission = Notification.permission

    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    return permission
  }

  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }))
      return
    }

    if (!user) {
      setState(prev => ({ ...prev, error: 'User must be logged in to enable notifications' }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log('🔔 Starting push notification subscription...')

      // Request notification permission
      const permission = await requestPermission()
      console.log('🔔 Permission status:', permission)

      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      // Get service worker registration
      console.log('🔔 Waiting for service worker...')
      const registration = await navigator.serviceWorker.ready
      console.log('🔔 Service worker ready:', registration)

      // Try to create push subscription
      let subscription: PushSubscription | null = null
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      console.log('🔔 VAPID key available:', !!vapidKey && vapidKey !== 'your-vapid-public-key')
      console.log('🔔 VAPID key value:', vapidKey?.substring(0, 20) + '...')

      if (vapidKey && vapidKey !== 'your-vapid-public-key') {
        try {
          console.log('🔔 Subscribing with VAPID key...')
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
          })
          console.log('🔔 Push subscription created successfully:', !!subscription)
        } catch (subError) {
          console.error('🔔 Push subscription failed with VAPID key:', subError)
          throw new Error(`Push subscription failed: ${subError instanceof Error ? subError.message : 'Unknown error'}`)
        }
      } else {
        console.warn('🔔 No valid VAPID key found, push notifications require proper configuration')
        throw new Error('Push notifications require valid VAPID key configuration')
      }

      // Send subscription to your server
      console.log('🔔 Sending subscription to server...')
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId: user.id,
        }),
      })

      console.log('🔔 Server response:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🔔 Server error response:', errorText)
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('🔔 Server success:', result)

      setState(prev => ({
        ...prev,
        subscription,
        isSubscribed: !!subscription, // Only set to true if we have a real subscription
        isLoading: false,
      }))
    } catch (error) {
      console.error('🔔 Error subscribing to push notifications:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Subscription failed',
        isLoading: false,
      }))
    }
  }, [state.isSupported, user])

  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Unsubscribe from push notifications
      await state.subscription.unsubscribe()

      // Remove subscription from your server
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: state.subscription.endpoint,
          userId: user?.id || 'unknown',
        }),
      })

      if (!response.ok) {
        console.warn(`Failed to remove subscription from server: ${response.status}`)
      }

      setState(prev => ({
        ...prev,
        subscription: null,
        isSubscribed: false,
        isLoading: false,
      }))
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unsubscription failed',
        isLoading: false,
      }))
    }
  }, [state.subscription, user])

  const sendTestNotification = useCallback(async () => {
    try {
      if (!user) {
        console.warn('User not logged in for test notification')
        return
      }

      const response = await fetch('/api/push/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error(`Test notification failed: ${response.status}`)
      }

      // Also show a local notification for immediate feedback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Test Notification', {
          body: 'Push notifications are working!',
          icon: '/icons/icon-192x192.png',
        })
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
    }
  }, [user])

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification,
    requestPermission,
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Show local notification
export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      ...options,
    })
  }
}

// Notification types for the daycare app
export const NotificationTypes = {
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_REMINDER: 'booking_reminder',
  MESSAGE_RECEIVED: 'message_received',
  DAYCARE_UPDATE: 'daycare_update',
  PAYMENT_DUE: 'payment_due',
} as const

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes]