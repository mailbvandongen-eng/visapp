import { useEffect, useCallback } from 'react'
import { useGPSStore } from '../store'

export function useGPS() {
  const {
    tracking,
    startTracking,
    stopTracking,
    updatePosition,
    setWatchId
  } = useGPSStore()

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    updatePosition(position)
  }, [updatePosition])

  const handleError = useCallback((error: GeolocationPositionError) => {
    console.error('GPS error:', error)
    alert(`GPS fout: ${error.message}`)
    stopTracking()
  }, [stopTracking])

  useEffect(() => {
    if (!tracking) return

    if (!navigator.geolocation) {
      alert('Geolocation wordt niet ondersteund door deze browser')
      stopTracking()
      return
    }

    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000
      }
    )

    setWatchId(id)

    return () => {
      navigator.geolocation.clearWatch(id)
    }
  }, [tracking, handleSuccess, handleError, setWatchId, stopTracking])

  return {
    tracking,
    start: startTracking,
    stop: stopTracking,
    toggle: () => tracking ? stopTracking() : startTracking()
  }
}
