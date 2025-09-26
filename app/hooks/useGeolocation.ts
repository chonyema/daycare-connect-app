'use client'

import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watchPosition?: boolean
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  })

  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 300000, // 5 minutes
    watchPosition = false,
  } = options

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
        loading: false,
      }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false,
      })
    }

    const onError = (error: GeolocationPositionError) => {
      let errorMessage = 'Unknown geolocation error'

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable'
          break
        case error.TIMEOUT:
          errorMessage = 'Location request timed out'
          break
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }))
    }

    if (watchPosition) {
      const watchId = navigator.geolocation.watchPosition(onSuccess, onError, options)
      return () => navigator.geolocation.clearWatch(watchId)
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
    }
  }, [enableHighAccuracy, timeout, maximumAge, watchPosition])

  useEffect(() => {
    const cleanup = getCurrentPosition()
    return cleanup
  }, [getCurrentPosition])

  return {
    ...state,
    getCurrentPosition,
    clearError,
  }
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: 'km' | 'miles' = 'km'
): number {
  const R = unit === 'km' ? 6371 : 3959 // Earth's radius in km or miles
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Format address using reverse geocoding
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    // Using a free geocoding service (you might want to replace with Google Maps API)
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    )

    if (!response.ok) {
      throw new Error('Geocoding failed')
    }

    const data = await response.json()

    // Format the address
    const parts = []
    if (data.locality) parts.push(data.locality)
    if (data.principalSubdivision) parts.push(data.principalSubdivision)
    if (data.countryName) parts.push(data.countryName)

    return parts.join(', ') || 'Unknown location'
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
  }
}

// Search for addresses using forward geocoding
export async function forwardGeocode(address: string): Promise<{
  latitude: number
  longitude: number
  formattedAddress: string
}[]> {
  try {
    // This is a basic example - in production, use Google Maps Geocoding API
    const response = await fetch(
      `https://api.bigdatacloud.net/data/forward-geocode?query=${encodeURIComponent(address)}&key=your-api-key`
    )

    if (!response.ok) {
      throw new Error('Geocoding failed')
    }

    const data = await response.json()

    // Transform the response to match our interface
    return data.results?.map((result: any) => ({
      latitude: result.latitude,
      longitude: result.longitude,
      formattedAddress: result.formattedAddress,
    })) || []
  } catch (error) {
    console.error('Forward geocoding error:', error)
    return []
  }
}