import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface UIState {
  // Panel states
  layerControlOpen: boolean
  settingsPanelOpen: boolean
  infoPanelOpen: boolean

  // Catch form state
  catchFormOpen: boolean
  catchFormLocation: { lat: number; lng: number } | null
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
  toggleSettingsPanel: () => void
  toggleInfoPanel: () => void
  toggleCategory: (category: string) => void

  // Catch actions
  openCatchForm: (location?: { lat: number; lng: number }) => void
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
    settingsPanelOpen: false,
    infoPanelOpen: false,
    catchFormOpen: false,
    catchFormLocation: null,
    catchDashboardOpen: false,
    spotFormOpen: false,
    spotFormLocation: null,
    spotsDashboardOpen: false,
    weatherPanelOpen: false,
    collapsedCategories: new Set<string>(),

    closeAllPanels: () => {
      set(state => {
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

    toggleSettingsPanel: () => {
      set(state => {
        const wasOpen = state.settingsPanelOpen
        state.settingsPanelOpen = false
        state.infoPanelOpen = false
        state.weatherPanelOpen = false
        if (!wasOpen) state.settingsPanelOpen = true
      })
    },

    toggleInfoPanel: () => {
      set(state => {
        const wasOpen = state.infoPanelOpen
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

    openCatchForm: (location) => {
      set(state => {
        state.catchFormOpen = true
        state.catchFormLocation = location || null
      })
    },

    closeCatchForm: () => {
      set(state => {
        state.catchFormOpen = false
        state.catchFormLocation = null
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
        state.settingsPanelOpen = false
        state.infoPanelOpen = false
        state.weatherPanelOpen = false
        if (!wasOpen) state.weatherPanelOpen = true
      })
    }
  }))
)
