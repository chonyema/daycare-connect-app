'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      // Set initial online status
      setIsOnline(navigator.onLine)

      const handleOnline = () => {
        setIsOnline(true)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      }

      const handleOffline = () => {
        setIsOnline(false)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 5000)
      }

      // Listen for online/offline events
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      // Cleanup function needs to be returned
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  if (!showToast) return null

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 flex justify-center`}>
      <div className={`
        px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 max-w-sm w-full
        ${isOnline
          ? 'bg-green-100 border border-green-200 text-green-800'
          : 'bg-red-100 border border-red-200 text-red-800'
        }
      `}>
        {isOnline ? (
          <>
            <Wifi className="h-5 w-5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Back online</p>
              <p className="text-xs opacity-75">Connection restored</p>
            </div>
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5" />
            <div className="flex-1">
              <p className="text-sm font-medium">You're offline</p>
              <p className="text-xs opacity-75">Some features may be limited</p>
            </div>
            <button
              onClick={handleRetry}
              className="p-1 hover:bg-red-200 rounded transition-colors"
              title="Retry connection"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// Hook for offline detection
export function useOffline() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    // Set initial state
    setIsOffline(!navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOffline
}