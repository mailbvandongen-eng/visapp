import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DefaultBackground = 'OpenStreetMap' | 'Luchtfoto'

interface SettingsState {
  defaultBackground: DefaultBackground
  showScaleBar: boolean
  gpsAutoStart: boolean
  showAccuracyCircle: boolean
  hapticFeedback: boolean
  showCatchButton: boolean
  showCatches: boolean
  showFavoriteSpots: boolean
  showWeatherWidget: boolean
  showWindIndicator: boolean
  showTideWidget: boolean
  showForecastSlider: boolean

  setDefaultBackground: (bg: DefaultBackground) => void
  setShowScaleBar: (value: boolean) => void
  setGpsAutoStart: (value: boolean) => void
  setShowAccuracyCircle: (value: boolean) => void
  setHapticFeedback: (value: boolean) => void
  setShowCatchButton: (value: boolean) => void
  setShowCatches: (value: boolean) => void
  setShowFavoriteSpots: (value: boolean) => void
  setShowWeatherWidget: (value: boolean) => void
  setShowWindIndicator: (value: boolean) => void
  setShowTideWidget: (value: boolean) => void
  setShowForecastSlider: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultBackground: 'OpenStreetMap',
      showScaleBar: true,
      gpsAutoStart: false,
      showAccuracyCircle: true,
      hapticFeedback: true,
      showCatchButton: true,
      showCatches: true,
      showFavoriteSpots: true,
      showWeatherWidget: true,
      showWindIndicator: true,
      showTideWidget: true,
      showForecastSlider: true,

      setDefaultBackground: (defaultBackground) => set({ defaultBackground }),
      setShowScaleBar: (showScaleBar) => set({ showScaleBar }),
      setGpsAutoStart: (gpsAutoStart) => set({ gpsAutoStart }),
      setShowAccuracyCircle: (showAccuracyCircle) => set({ showAccuracyCircle }),
      setHapticFeedback: (hapticFeedback) => set({ hapticFeedback }),
      setShowCatchButton: (showCatchButton) => set({ showCatchButton }),
      setShowCatches: (showCatches) => set({ showCatches }),
      setShowFavoriteSpots: (showFavoriteSpots) => set({ showFavoriteSpots }),
      setShowWeatherWidget: (showWeatherWidget) => set({ showWeatherWidget }),
      setShowWindIndicator: (showWindIndicator) => set({ showWindIndicator }),
      setShowTideWidget: (showTideWidget) => set({ showTideWidget }),
      setShowForecastSlider: (showForecastSlider) => set({ showForecastSlider })
    }),
    {
      name: 'visapp-settings'
    }
  )
)
