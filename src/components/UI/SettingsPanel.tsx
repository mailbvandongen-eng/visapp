import { motion } from 'framer-motion'
import { X, Fish, MapPin, Map, Cloud, Wind, Waves, Clock, Droplets } from 'lucide-react'
import { useUIStore, useSettingsStore } from '../../store'

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
  const showWeatherWidget = useSettingsStore(state => state.showWeatherWidget)
  const setShowWeatherWidget = useSettingsStore(state => state.setShowWeatherWidget)
  const showWindIndicator = useSettingsStore(state => state.showWindIndicator)
  const setShowWindIndicator = useSettingsStore(state => state.setShowWindIndicator)
  const showTideWidget = useSettingsStore(state => state.showTideWidget)
  const setShowTideWidget = useSettingsStore(state => state.setShowTideWidget)
  const showForecastSlider = useSettingsStore(state => state.showForecastSlider)
  const setShowForecastSlider = useSettingsStore(state => state.setShowForecastSlider)
  const showWaterDataWidget = useSettingsStore(state => state.showWaterDataWidget)
  const setShowWaterDataWidget = useSettingsStore(state => state.setShowWaterDataWidget)

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
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600">
          <h2 className="text-lg font-semibold text-white">Instellingen</h2>
          <button
            onClick={toggleSettingsPanel}
            className="p-1 rounded-full hover:bg-white/20 transition-colors border-0 outline-none"
          >
            <X size={20} className="text-white" />
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
                  onChange={(e) => setDefaultBackground(e.target.value as any)}
                  className="mt-1 w-full px-2 py-1 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="OpenStreetMap">OpenStreetMap</option>
                  <option value="Luchtfoto">Satelliet</option>
                </select>
              </div>
            </div>
          </div>

          {/* Weer sectie */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Weer & Water</h3>

            <ToggleItem
              icon={<Cloud size={18} className="text-blue-400" />}
              label="Weer widget"
              description="Temperatuur, wind, luchtdruk en solunar"
              checked={showWeatherWidget}
              onChange={setShowWeatherWidget}
            />

            <ToggleItem
              icon={<Wind size={18} className="text-cyan-500" />}
              label="Wind kompas"
              description="Windrichting en snelheid indicator"
              checked={showWindIndicator}
              onChange={setShowWindIndicator}
            />

            <ToggleItem
              icon={<Waves size={18} className="text-blue-500" />}
              label="Getijden"
              description="Hoog- en laagwater tijden"
              checked={showTideWidget}
              onChange={setShowTideWidget}
            />

            <ToggleItem
              icon={<Clock size={18} className="text-purple-500" />}
              label="Weersvoorspelling"
              description="Tijdslider met 72 uur forecast"
              checked={showForecastSlider}
              onChange={setShowForecastSlider}
            />

            <ToggleItem
              icon={<Droplets size={18} className="text-cyan-500" />}
              label="Waterdata (RWS)"
              description="Temperatuur, golven, stroming"
              checked={showWaterDataWidget}
              onChange={setShowWaterDataWidget}
            />
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
          checked ? 'bg-blue-500' : 'bg-gray-300'
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
