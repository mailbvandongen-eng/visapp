import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { PhotoData } from './catchStore'

export type LocationSource = 'gps' | 'map' | 'photo'

interface UIState {
  // Panel states
  layerControlOpen: boolean
  layerPanelOpen: boolean
  settingsPanelOpen: boolean
  infoPanelOpen: boolean

  // Catch form state
  catchFormOpen: boolean
  catchFormLocation: { lat: number; lng: number } | null
  catchFormLocationSource: LocationSource | null
  catchFormInitialPhotos: PhotoData[]
  catchDashboardOpen: boolean

  // Spots
  spotFormOpen: boolean
  spotFormLocation: { lat: number; lng: number } | null
  spotsDashboardOpen: boolean

  // Weather
  weatherPanelOpen: boolean

  // Collapsed categories
  collapsedCategories: Set<string>

  // Actions
  closeAllPanels: () => void
  toggleLayerControl: () => void
  toggleLayerPanel: () => void
  toggleSettingsPanel: () => void
  toggleInfoPanel: () => void
  toggleCategory: (category: string) => void

  // Catch actions
  openCatchForm: (options?: {
    location?: { lat: number; lng: number }
    locationSource?: LocationSource
    photos?: PhotoData[]
  }) => void
  closeCatchForm: () => void
  toggleCatchDashboard: () => void

  // Spot actions
  openSpotForm: (location?: { lat: number; lng: number }) => void
  closeSpotForm: () => void
  toggleSpotsDashboard: () => void

  // Weather actions
  toggleWeatherPanel: () => void
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    layerControlOpen: false,
    layerPanelOpen: false,
    settingsPanelOpen: false,
    infoPanelOpen: false,
    catchFormOpen: false,
    catchFormLocation: null,
    catchFormLocationSource: null,
    catchFormInitialPhotos: [],
    catchDashboardOpen: false,
    spotFormOpen: false,
    spotFormLocation: null,
    spotsDashboardOpen: false,
    weatherPanelOpen: false,
    collapsedCategories: new Set<string>(),

    closeAllPanels: () => {
      set(state => {
        state.layerPanelOpen = false
        state.settingsPanelOpen = false
        state.infoPanelOpen = false
        state.weatherPanelOpen = false
      })
    },

    toggleLayerControl: () => {
      set(state => {
        state.layerControlOpen = !state.layerControlOpen
      })
    },

    toggleLayerPanel: () => {
      set(state => {
        const wasOpen = state.layerPanelOpen
        // Close all panels first
        state.layerPanelOpen = false
        state.settingsPanelOpen = false
        state.infoPanelOpen = false
        state.weatherPanelOpen = false
        if (!wasOpen) state.layerPanelOpen = true
      })
    },

    toggleSettingsPanel: () => {
      set(state => {
        const wasOpen = state.settingsPanelOpen
        state.layerPanelOpen = false
        state.settingsPanelOpen = false
        state.infoPanelOpen = false
        state.weatherPanelOpen = false
        if (!wasOpen) state.settingsPanelOpen = true
      })
    },

    toggleInfoPanel: () => {
      set(state => {
        const wasOpen = state.infoPanelOpen
        state.layerPanelOpen = false
        state.settingsPanelOpen = false
        state.infoPanelOpen = false
        state.weatherPanelOpen = false
        if (!wasOpen) state.infoPanelOpen = true
      })
    },

    toggleCategory: (category) => {
      set(state => {
        if (state.collapsedCategories.has(category)) {
          state.collapsedCategories.delete(category)
        } else {
          state.collapsedCategories.add(category)
        }
      })
    },

    openCatchForm: (options) => {
      set(state => {
        state.catchFormOpen = true
        state.catchFormLocation = options?.location || null
        state.catchFormLocationSource = options?.locationSource || null
        state.catchFormInitialPhotos = options?.photos || []
      })
    },

    closeCatchForm: () => {
      set(state => {
        state.catchFormOpen = false
        state.catchFormLocation = null
        state.catchFormLocationSource = null
        state.catchFormInitialPhotos = []
      })
    },

    toggleCatchDashboard: () => {
      set(state => {
        state.catchDashboardOpen = !state.catchDashboardOpen
      })
    },

    openSpotForm: (location) => {
      set(state => {
        state.spotFormOpen = true
        state.spotFormLocation = location || null
      })
    },

    closeSpotForm: () => {
      set(state => {
        state.spotFormOpen = false
        state.spotFormLocation = null
      })
    },

    toggleSpotsDashboard: () => {
      set(state => {
        state.spotsDashboardOpen = !state.spotsDashboardOpen
      })
    },

    toggleWeatherPanel: () => {
      set(state => {
        const wasOpen = state.weatherPanelOpen
        state.layerPanelOpen = false
        state.settingsPanelOpen = false
        state.infoPanelOpen = false
        state.weatherPanelOpen = false
        if (!wasOpen) state.weatherPanelOpen = true
      })
    }
  }))
)
