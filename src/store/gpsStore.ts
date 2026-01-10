import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface GPSPosition {
  lat: number
  lng: number
}

interface GPSState {
  tracking: boolean
  position: GPSPosition | null
  heading: number | null
  smoothHeading: number | null
  accuracy: number | null
  speed: number | null
  headingSource: 'gps' | 'compass' | null
  watchId: number | null
  firstFix: boolean

  startTracking: () => void
  stopTracking: () => void
  updatePosition: (pos: GeolocationPosition) => void
  updateHeading: (raw: number, source?: 'gps' | 'compass') => void
  setWatchId: (id: number) => void
  resetFirstFix: () => void
}

export const useGPSStore = create<GPSState>()(
  immer((set, get) => ({
    tracking: false,
    position: null,
    heading: null,
    smoothHeading: null,
    accuracy: null,
    speed: null,
    headingSource: null,
    watchId: null,
    firstFix: true,

    startTracking: () => {
      set(state => {
        state.tracking = true
      })
    },

    stopTracking: () => {
      set(state => {
        const { watchId } = get()
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId)
        }
        state.tracking = false
        state.speed = null
        state.headingSource = null
        state.watchId = null
      })
    },

    updatePosition: (pos) => {
      set(state => {
        state.position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        }
        state.accuracy = pos.coords.accuracy
        state.speed = pos.coords.speed

        const GPS_ACCURACY_THRESHOLD = 15
        const SPEED_THRESHOLD = 0.5

        const isGPSReliable = pos.coords.accuracy !== null && pos.coords.accuracy < GPS_ACCURACY_THRESHOLD

        if (!isGPSReliable) {
          state.headingSource = null
          return
        }

        if (pos.coords.heading !== null && pos.coords.speed !== null && pos.coords.speed > SPEED_THRESHOLD) {
          state.headingSource = 'gps'
          get().updateHeading(pos.coords.heading, 'gps')
        } else {
          state.headingSource = 'compass'
        }
      })
    },

    updateHeading: (raw, source = 'compass') => {
      set(state => {
        const current = get().smoothHeading

        if (current === null) {
          state.smoothHeading = raw
          state.heading = raw
          return
        }

        let diff = raw - current
        if (diff > 180) diff -= 360
        if (diff < -180) diff += 360

        const threshold = source === 'compass' ? 5 : 3
        if (Math.abs(diff) < threshold) return

        const smoothingFactor = source === 'gps' ? 0.5 : 0.35
        const newSmooth = current + diff * smoothingFactor
        state.smoothHeading = (newSmooth + 360) % 360
        state.heading = raw
      })
    },

    setWatchId: (id) => {
      set(state => {
        state.watchId = id
      })
    },

    resetFirstFix: () => {
      set(state => {
        state.firstFix = false
      })
    }
  }))
)
