import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Fish, MapPin, Map, Type, ChevronDown, Thermometer, Wind, Waves, CloudRain, Droplets, BarChart3 } from 'lucide-react'
import { useUIStore, useSettingsStore, useLayerStore } from '../../store'

export function SettingsPanel() {
  const settingsPanelOpen = useUIStore(state => state.settingsPanelOpen)
  const toggleSettingsPanel = useUIStore(state => state.toggleSettingsPanel)

  const showCatchButton = useSettingsStore(state => state.showCatchButton)
  const setShowCatchButton = useSettingsStore(state => state.setShowCatchButton)
  const showCatches = useSettingsStore(state => state.showCatches)
  const setShowCatches = useSettingsStore(state => state.setShowCatches)
  const showFavoriteSpots = useSettingsStore(state => state.showFavoriteSpots)
  const setShowFavoriteSpots = useSettingsStore(state => state.setShowFavoriteSpots)
  const defaultBackground = useSettingsStore(state => state.defaultBackground)
  const setDefaultBackground = useSettingsStore(state => state.setDefaultBackground)
  const fontScale = useSettingsStore(state => state.fontScale)
  const setFontScale = useSettingsStore(state => state.setFontScale)
  const showFontSliders = useSettingsStore(state => state.showFontSliders)
  const setShowFontSliders = useSettingsStore(state => state.setShowFontSliders)
  const setLayerVisibility = useLayerStore(state => state.setLayerVisibility)

  // Widget settings
  const showWeatherWidget = useSettingsStore(state => state.showWeatherWidget)
  const setShowWeatherWidget = useSettingsStore(state => state.setShowWeatherWidget)
  const showWindIndicator = useSettingsStore(state => state.showWindIndicator)
  const setShowWindIndicator = useSettingsStore(state => state.setShowWindIndicator)
  const showTideWidget = useSettingsStore(state => state.showTideWidget)
  const setShowTideWidget = useSettingsStore(state => state.setShowTideWidget)
  const showBuienradarWidget = useSettingsStore(state => state.showBuienradarWidget)
  const setShowBuienradarWidget = useSettingsStore(state => state.setShowBuienradarWidget)
  const showWaterflowWidget = useSettingsStore(state => state.showWaterflowWidget)
  const setShowWaterflowWidget = useSettingsStore(state => state.setShowWaterflowWidget)
  const showForecastSlider = useSettingsStore(state => state.showForecastSlider)
  const setShowForecastSlider = useSettingsStore(state => state.setShowForecastSlider)
  const showWaterDataWidget = useSettingsStore(state => state.showWaterDataWidget)
  const setShowWaterDataWidget = useSettingsStore(state => state.setShowWaterDataWidget)

  // State for collapsible widgets section
  const [widgetsExpanded, setWidgetsExpanded] = useState(false)

  // Handle background change - also apply to layer visibility
  const handleBackgroundChange = (value: 'OpenStreetMap' | 'Luchtfoto' | 'Terrein' | 'CartoDB Light') => {
    setDefaultBackground(value)
    setLayerVisibility('CartoDB Light', value === 'CartoDB Light')
    setLayerVisibility('Terrein', value === 'Terrein')
    setLayerVisibility('OpenStreetMap', value === 'OpenStreetMap')
    setLayerVisibility('Luchtfoto', value === 'Luchtfoto')
    setLayerVisibility('Labels Overlay', value === 'Luchtfoto')
  }

  if (!settingsPanelOpen) return null

  return (
    <motion.div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={toggleSettingsPanel}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[80vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600">
          <h2 className="text-lg font-semibold text-white">Instellingen</h2>
          <button
            onClick={toggleSettingsPanel}
            className="p-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 transition-colors border-0 outline-none"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Vangst sectie */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Vangsten</h3>

            <ToggleItem
              icon={<Fish size={18} className="text-green-500" />}
              label="Vangst registreren knop"
              description="Toon de groene vis-knop"
              checked={showCatchButton}
              onChange={setShowCatchButton}
            />

            <ToggleItem
              icon={<Fish size={18} className="text-blue-500" />}
              label="Vangsten op kaart"
              description="Toon geregistreerde vangsten"
              checked={showCatches}
              onChange={setShowCatches}
            />
          </div>

          {/* Plekken sectie */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Favoriete plekken</h3>

            <ToggleItem
              icon={<MapPin size={18} className="text-yellow-500" />}
              label="Favoriete plekken op kaart"
              description="Toon opgeslagen visplekken"
              checked={showFavoriteSpots}
              onChange={setShowFavoriteSpots}
            />
          </div>

          {/* Kaart sectie */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Kaart</h3>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Map size={18} className="text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Standaard achtergrond</p>
                <select
                  value={defaultBackground}
                  onChange={(e) => handleBackgroundChange(e.target.value as 'OpenStreetMap' | 'Luchtfoto' | 'Terrein' | 'CartoDB Light')}
                  className="mt-1 w-full px-2 py-1 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="CartoDB Light">Light (standaard)</option>
                  <option value="Terrein">Terrein (reliëf)</option>
                  <option value="OpenStreetMap">OpenStreetMap</option>
                  <option value="Luchtfoto">Satelliet</option>
                </select>
              </div>
            </div>
          </div>

          {/* Weergave sectie */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Weergave</h3>

            <ToggleItem
              icon={<Type size={18} className="text-purple-500" />}
              label="Tekstgrootte aanpassen"
              description="Toon schuifbalk voor tekstgrootte"
              checked={showFontSliders}
              onChange={setShowFontSliders}
            />

            {showFontSliders && (
              <div className="flex items-center gap-3 pl-2">
                <span className="text-xs text-gray-500">T</span>
                <input
                  type="range"
                  min="80"
                  max="150"
                  step="10"
                  value={fontScale}
                  onChange={(e) => setFontScale(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-lg text-gray-500">T</span>
                <span className="text-xs text-gray-500 w-10">{fontScale}%</span>
              </div>
            )}
          </div>

          {/* Widgets sectie - uitklapbaar */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => setWidgetsExpanded(!widgetsExpanded)}
              className="w-full flex items-center justify-between bg-transparent border-0 p-0 cursor-pointer"
            >
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Widgets</h3>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform ${widgetsExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {widgetsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-2"
                >
                  <WidgetToggleItem
                    icon={<Thermometer size={16} className="text-orange-500" />}
                    label="Weer & visvriendelijkheid"
                    checked={showWeatherWidget}
                    onChange={setShowWeatherWidget}
                  />
                  <WidgetToggleItem
                    icon={<Wind size={16} className="text-cyan-500" />}
                    label="Wind indicator"
                    checked={showWindIndicator}
                    onChange={setShowWindIndicator}
                  />
                  <WidgetToggleItem
                    icon={<Waves size={16} className="text-blue-500" />}
                    label="Getijden"
                    checked={showTideWidget}
                    onChange={setShowTideWidget}
                  />
                  <WidgetToggleItem
                    icon={<CloudRain size={16} className="text-indigo-500" />}
                    label="Buienradar"
                    checked={showBuienradarWidget}
                    onChange={setShowBuienradarWidget}
                  />
                  <WidgetToggleItem
                    icon={<Droplets size={16} className="text-cyan-600" />}
                    label="Waterdata (temp, golven)"
                    checked={showWaterDataWidget}
                    onChange={setShowWaterDataWidget}
                  />
                  <WidgetToggleItem
                    icon={<BarChart3 size={16} className="text-green-500" />}
                    label="Waterafvoer rivieren"
                    checked={showWaterflowWidget}
                    onChange={setShowWaterflowWidget}
                  />
                  <WidgetToggleItem
                    icon={<BarChart3 size={16} className="text-purple-500" />}
                    label="Voorspelling schuif"
                    checked={showForecastSlider}
                    onChange={setShowForecastSlider}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 text-center text-xs text-gray-400">
          Instellingen worden automatisch opgeslagen
        </div>
      </motion.div>
    </motion.div>
  )
}

interface ToggleItemProps {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}

function ToggleItem({ icon, label, description, checked, onChange }: ToggleItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-gray-100 rounded-lg">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors border-0 outline-none ${
          checked ? 'bg-orange-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}

// Compact widget toggle for the expandable section
function WidgetToggleItem({ icon, label, checked, onChange }: {
  icon: React.ReactNode
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-1">
      <div className="p-1.5 bg-gray-100 rounded-lg">
        {icon}
      </div>
      <span className="flex-1 text-sm text-gray-700">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors border-0 outline-none ${
          checked ? 'bg-orange-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}
