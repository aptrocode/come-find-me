import { useEffect, useRef, useState, useCallback } from 'react'
import type { Position } from '../types'
import { GEO_HIGH_ACCURACY, GEO_MAX_AGE, GEO_TIMEOUT } from '../config/constants'

interface GeolocationState {
  position: Position | null
  error: string | null
  loading: boolean
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
  })
  const watchId = useRef<number | null>(null)

  const onSuccess = useCallback((geo: GeolocationPosition) => {
    setState({
      position: {
        lat: geo.coords.latitude,
        lng: geo.coords.longitude,
        accuracy: geo.coords.accuracy,
        timestamp: geo.timestamp,
      },
      error: null,
      loading: false,
    })
  }, [])

  const onError = useCallback((err: GeolocationPositionError) => {
    let msg = 'Unable to get location'
    switch (err.code) {
      case err.PERMISSION_DENIED:
        msg = 'Location permission denied. Please enable GPS.'
        break
      case err.POSITION_UNAVAILABLE:
        msg = 'Location unavailable. Check your GPS.'
        break
      case err.TIMEOUT:
        msg = 'Location request timed out.'
        break
    }
    setState(prev => ({ ...prev, error: msg, loading: false }))
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ position: null, error: 'Geolocation not supported', loading: false })
      return
    }

    const opts: PositionOptions = {
      enableHighAccuracy: GEO_HIGH_ACCURACY,
      maximumAge: GEO_MAX_AGE,
      timeout: GEO_TIMEOUT,
    }

    watchId.current = navigator.geolocation.watchPosition(onSuccess, onError, opts)

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [onSuccess, onError])

  return state
}
