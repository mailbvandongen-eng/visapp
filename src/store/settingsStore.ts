import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DefaultBackground = 'OpenStreetMap' | 'Luchtfoto' | 'Terrein' | 'CartoDB Light'
export type WidgetId = 'weather' | 'wind' | 'tide' | 'buienradar' | 'waterflow' | 'forecast' | 'waterData'

interface SettingsState {
  defaultBackground: DefaultBackground
  showScaleBar: boolean
  gpsAutoStart: boolean
  showAccuracyCircle: boolean
  hapticFeedback: boolean
  showCatchButton: boolean
  showCatches: boolean
  showFavoriteSpots: boolean
  // Widget visibility settings
  showWeatherWidget: boolean
  showWindIndicator: boolean
  showTideWidget: boolean
  showBuienradarWidget: boolean
  showWaterflowWidget: boolean
  showForecastSlider: boolean
  showWaterDataWidget: boolean
  widgetOrder: WidgetId[]
  fontScale: number
  showFontSliders: boolean

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
  setShowBuienradarWidget: (value: boolean) => void
  setShowWaterflowWidget: (value: boolean) => void
  setShowForecastSlider: (value: boolean) => void
  setShowWaterDataWidget: (value: boolean) => void
  setWidgetOrder: (order: WidgetId[]) => void
  setFontScale: (scale: number) => void
  setShowFontSliders: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultBackground: 'CartoDB Light',
      showScaleBar: true,
      gpsAutoStart: false,
      showAccuracyCircle: true,
      hapticFeedback: true,
      showCatchButton: true,
      showCatches: true,
      showFavoriteSpots: true,
      showWeatherWidget: true,
      showWindIndicator: false,
      showTideWidget: false,
      showBuienradarWidget: false,
      showWaterflowWidget: false,
      showForecastSlider: false,
      showWaterDataWidget: false,
      widgetOrder: ['weather', 'wind', 'tide', 'buienradar', 'waterflow', 'forecast', 'waterData'],
      fontScale: 100,
      showFontSliders: false,

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
      setShowBuienradarWidget: (showBuienradarWidget) => set({ showBuienradarWidget }),
      setShowWaterflowWidget: (showWaterflowWidget) => set({ showWaterflowWidget }),
      setShowForecastSlider: (showForecastSlider) => set({ showForecastSlider }),
      setShowWaterDataWidget: (showWaterDataWidget) => set({ showWaterDataWidget }),
      setWidgetOrder: (widgetOrder) => set({ widgetOrder }),
      setFontScale: (fontScale) => set({ fontScale }),
      setShowFontSliders: (showFontSliders) => set({ showFontSliders })
    }),
    {
      name: 'visapp-settings',
      version: 3,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<SettingsState>
        // Migrate to version 3: change default to CartoDB Light with water overlay
        if (version < 3) {
          return {
            ...state,
            defaultBackground: 'CartoDB Light'
          }
        }
        return state
      }
    }
  )
)
