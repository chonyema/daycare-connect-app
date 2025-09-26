'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      // Check if device is iOS
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      setIsIOS(iOS)

      // Check if app is already installed (standalone mode)
      const standalone = window.matchMedia('(display-mode: standalone)').matches
      setIsStandalone(standalone)
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Don't show again for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa-install-dismissed', 'true')
    }
  }

  // Don't show if already installed, dismissed this session, or on iOS (different install process)
  const dismissed = typeof window !== 'undefined' ? sessionStorage.getItem('pwa-install-dismissed') : null
  if (isStandalone || dismissed || !showInstallPrompt) {
    return null
  }

  // iOS install instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Smartphone className="h-6 w-6 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Install DaycareConnect</h3>
              <p className="text-xs mt-1 opacity-90">
                Tap the share button <span className="inline-block">📤</span> and select "Add to Home Screen"
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-2 text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // Android/Desktop install prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 p-4 rounded-lg shadow-lg z-50 max-w-sm mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Download className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Install App</h3>
            <p className="text-sm text-gray-600 mt-1">
              Install DaycareConnect for quick access and offline features
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleInstallClick}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}