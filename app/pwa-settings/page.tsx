'use client'

import { useState } from 'react'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { useGeolocation } from '../hooks/useGeolocation'
import {
  Bell,
  BellOff,
  Download,
  Smartphone,
  MapPin,
  Camera,
  Wifi,
  Settings,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default function PWASettingsPage() {
  const {
    isSupported: pushSupported,
    isSubscribed,
    isLoading: pushLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications()

  const {
    latitude,
    longitude,
    loading: locationLoading,
    error: locationError,
    getCurrentPosition,
  } = useGeolocation()

  const [cameraPermission, setCameraPermission] = useState<PermissionState | null>(null)

  // Check camera permission
  const checkCameraPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      setCameraPermission(permission.state)

      permission.onchange = () => {
        setCameraPermission(permission.state)
      }
    } catch (error) {
      console.log('Camera permission check not supported')
    }
  }

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      setCameraPermission('granted')
    } catch (error) {
      setCameraPermission('denied')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">PWA Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">

          {/* App Installation */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Download className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">App Installation</h2>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Install DaycareConnect as a mobile app for the best experience with offline access and push notifications.
              </p>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Mobile App</p>
                    <p className="text-sm text-gray-600">Install on your home screen</p>
                  </div>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Install App
                </button>
              </div>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Push Notifications</h2>
            </div>

            {!pushSupported ? (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800">Push notifications are not supported in this browser.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Get notified about booking confirmations, messages, and important updates.
                </p>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {isSubscribed ? (
                      <Bell className="h-8 w-8 text-green-600" />
                    ) : (
                      <BellOff className="h-8 w-8 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {isSubscribed ? 'Notifications Enabled' : 'Notifications Disabled'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {isSubscribed ? 'You will receive push notifications' : 'Enable to receive important updates'}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {isSubscribed ? (
                      <>
                        <button
                          onClick={sendTestNotification}
                          className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          Test
                        </button>
                        <button
                          onClick={unsubscribe}
                          disabled={pushLoading}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {pushLoading ? 'Loading...' : 'Disable'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={subscribe}
                        disabled={pushLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {pushLoading ? 'Loading...' : 'Enable'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Location Services */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Location Services</h2>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Allow location access to find daycares near you and get directions.
              </p>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className={`h-8 w-8 ${latitude && longitude ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {latitude && longitude ? 'Location Access Granted' : 'Location Access Disabled'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {latitude && longitude
                        ? `Current location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                        : locationError || 'Enable to find nearby daycares'
                      }
                    </p>
                  </div>
                </div>

                <button
                  onClick={getCurrentPosition}
                  disabled={locationLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {locationLoading ? 'Loading...' : 'Enable'}
                </button>
              </div>
            </div>
          </div>

          {/* Camera Access */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Camera className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Camera Access</h2>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Allow camera access to take photos during daycare visits.
              </p>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Camera className={`h-8 w-8 ${cameraPermission === 'granted' ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {cameraPermission === 'granted' ? 'Camera Access Granted' : 'Camera Access Disabled'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {cameraPermission === 'granted' ? 'You can take photos in the app' : 'Enable to take photos'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={cameraPermission === 'granted' ? checkCameraPermission : requestCameraPermission}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {cameraPermission === 'granted' ? 'Refresh' : 'Enable'}
                </button>
              </div>
            </div>
          </div>

          {/* Offline Support */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Wifi className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Offline Support</h2>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                The app works offline with cached data and will sync when you're back online.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Available Offline</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Saved daycare listings</li>
                    <li>• Your bookings</li>
                    <li>• Downloaded photos</li>
                    <li>• App navigation</li>
                  </ul>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium text-yellow-900 mb-2">Requires Internet</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• New bookings</li>
                    <li>• Real-time messaging</li>
                    <li>• Live availability</li>
                    <li>• Payment processing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// Initialize camera permission check on component mount
PWASettingsPage.displayName = 'PWASettingsPage'