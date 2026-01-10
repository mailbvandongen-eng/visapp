import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WeatherSnapshot {
  temp: number
  windSpeed: number
  windDirection: number
  pressure: number
}

export interface Catch {
  id: string
  location: {
    lat: number
    lng: number
  }
  timestamp: string
  species: string
  weight?: number // gram
  length?: number // cm
  photoUrl?: string
  method: string
  bait?: string
  notes?: string
  weather?: WeatherSnapshot
  spotId?: string
}

interface CatchState {
  catches: Catch[]
  addCatch: (catch_: Omit<Catch, 'id' | 'timestamp'>) => void
  removeCatch: (id: string) => void
  updateCatch: (id: string, updates: Partial<Catch>) => void
  clearAll: () => void
  exportAsGeoJSON: () => void
}

export const useCatchStore = create<CatchState>()(
  persist(
    (set, get) => ({
      catches: [],

      addCatch: (catch_) => set((state) => ({
        catches: [
          ...state.catches,
          {
            ...catch_,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString()
          }
        ]
      })),

      removeCatch: (id) => set((state) => ({
        catches: state.catches.filter(c => c.id !== id)
      })),

      updateCatch: (id, updates) => set((state) => ({
        catches: state.catches.map(c =>
          c.id === id ? { ...c, ...updates } : c
        )
      })),

      clearAll: () => set({ catches: [] }),

      exportAsGeoJSON: () => {
        const catches = get().catches
        if (catches.length === 0) {
          alert('Geen vangsten om te exporteren')
          return
        }

        const geojson = {
          type: 'FeatureCollection',
          features: catches.map(c => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [c.location.lng, c.location.lat]
            },
            properties: {
              id: c.id,
              species: c.species,
              weight: c.weight,
              length: c.length,
              method: c.method,
              bait: c.bait,
              notes: c.notes,
              timestamp: c.timestamp,
              weather: c.weather
            }
          }))
        }

        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mijn-vangsten-${new Date().toISOString().split('T')[0]}.geojson`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    }),
    {
      name: 'visapp-catches'
    }
  )
)
