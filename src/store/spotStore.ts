import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FavoriteSpot {
  id: string
  name: string
  location: {
    lat: number
    lng: number
  }
  waterBody?: string
  fishTypes: string[]
  notes?: string
  rating: number // 1-5
  createdAt: string
}

interface SpotState {
  spots: FavoriteSpot[]
  addSpot: (spot: Omit<FavoriteSpot, 'id' | 'createdAt'>) => void
  removeSpot: (id: string) => void
  updateSpot: (id: string, updates: Partial<FavoriteSpot>) => void
  clearAll: () => void
}

export const useSpotStore = create<SpotState>()(
  persist(
    (set) => ({
      spots: [],

      addSpot: (spot) => set((state) => ({
        spots: [
          ...state.spots,
          {
            ...spot,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
          }
        ]
      })),

      removeSpot: (id) => set((state) => ({
        spots: state.spots.filter(s => s.id !== id)
      })),

      updateSpot: (id, updates) => set((state) => ({
        spots: state.spots.map(s =>
          s.id === id ? { ...s, ...updates } : s
        )
      })),

      clearAll: () => set({ spots: [] })
    }),
    {
      name: 'visapp-spots'
    }
  )
)
