import { create } from 'zustand'
import {
  RWSStation,
  WaterData,
  RWS_STATIONS,
  findNearestRWSStation,
  fetchAllWaterData,
  getSimulatedWaterData
} from '../services/rwsService'

interface WaterDataState {
  // Data
  station: RWSStation | null
  waterData: WaterData | null
  lastUpdated: Date | null
  isLoading: boolean
  error: string | null
  useSimulatedData: boolean

  // Actions
  setStation: (station: RWSStation) => void
  setStationByPosition: (lat: number, lng: number) => void
  fetchData: () => Promise<void>
  setUseSimulatedData: (use: boolean) => void
}

export const useWaterDataStore = create<WaterDataState>((set, get) => ({
  station: RWS_STATIONS[1], // Scheveningen default
  waterData: null,
  lastUpdated: null,
  isLoading: false,
  error: null,
  useSimulatedData: true, // Use simulated data by default since RWS API can be unreliable

  setStation: (station) => set({ station }),

  setStationByPosition: (lat, lng) => {
    const station = findNearestRWSStation(lat, lng)
    set({ station })
  },

  fetchData: async () => {
    const { station, useSimulatedData } = get()
    if (!station) return

    set({ isLoading: true, error: null })

    try {
      let waterData: WaterData

      if (useSimulatedData) {
        // Use simulated data for reliable display
        waterData = getSimulatedWaterData(station)
      } else {
        // Try to fetch real data from RWS API
        waterData = await fetchAllWaterData(station)
      }

      set({
        waterData,
        lastUpdated: new Date(),
        isLoading: false
      })
    } catch (error) {
      console.error('Error fetching water data:', error)
      // Fallback to simulated data on error
      const waterData = getSimulatedWaterData(station)
      set({
        waterData,
        lastUpdated: new Date(),
        isLoading: false,
        error: 'Kon geen live data ophalen, gesimuleerde data wordt getoond'
      })
    }
  },

  setUseSimulatedData: (use) => set({ useSimulatedData: use })
}))
