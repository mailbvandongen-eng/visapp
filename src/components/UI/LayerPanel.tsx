import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Anchor, Ship, Waves, MapPin, Check, Tag, Mountain, X, Droplets } from 'lucide-react'
import { useLayerStore, useUIStore } from '../../store'

const VIS_LAYERS = [
  { name: 'Aanlegsteigers', icon: Anchor, color: '#2196F3' },
  { name: 'Trailerhellingen', icon: Ship, color: '#4CAF50' },
  { name: 'Dieptekaart', icon: Waves, color: '#00BCD4' },
  { name: 'Viswater', icon: MapPin, color: '#9C27B0' }
]

const BASE_LAYERS = [
  { name: 'CartoDB Light', label: 'Light' },
  { name: 'Terrein', label: 'Terrein' },
  { name: 'OpenStreetMap', label: 'Kaart' },
  { name: 'Luchtfoto', label: 'Satelliet' }
]

export function LayerPanel() {
  const layerPanelOpen = useUIStore(state => state.layerPanelOpen)
  const toggleLayerPanel = useUIStore(state => state.toggleLayerPanel)
  const visible = useLayerStore(state => state.visible)
  const opacity = useLayerStore(state => state.opacity)
  const toggleLayer = useLayerStore(state => state.toggleLayer)
  const setLayerVisibility = useLayerStore(state => state.setLayerVisibility)
  const setLayerOpacity = useLayerStore(state => state.setLayerOpacity)

  const handleBaseLayerChange = (layerName: string) => {
    BASE_LAYERS.forEach(layer => {
      setLayerVisibility(layer.name, layer.name === layerName)
    })
    if (layerName === 'Luchtfoto') {
      setLayerVisibility('Labels Overlay', true)
    } else {
      setLayerVisibility('Labels Overlay', false)
    }
  }

  const handleLabelsToggle = () => {
    setLayerVisibility('Labels Overlay', !visible['Labels Overlay'])
  }

  const hillshadeOpacity = opacity['AHN4 Hillshade'] ?? 0.5
  const hillshadeVisible = visible['AHN4 Hillshade']
  const pdokWaterOpacity = opacity['PDOK Water NL'] ?? 0.7
  const pdokWaterVisible = visible['PDOK Water NL']

  return (
    <>
      {/* Toggle button - stays at bottom */}
      <div className="fixed bottom-[60px] right-2 z-[900]">
        <motion.button
          className="w-11 h-11 bg-white/90 hover:bg-white backdrop-blur-sm rounded-xl shadow-sm flex items-center justify-center text-gray-600 border-0 outline-none transition-colors"
          onClick={toggleLayerPanel}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Kaartlagen"
        >
          <Layers size={22} />
        </motion.button>
      </div>

      {/* Panel - appears at top right */}
      <AnimatePresence>
        {layerPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[1600]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleLayerPanel}
            />
            <motion.div
              className="fixed top-2 right-2 z-[1601] bg-white rounded-lg shadow-lg overflow-hidden w-[280px] max-h-[calc(100vh-100px)] flex flex-col"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-orange-500">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-white" />
                  <span className="font-medium text-white text-sm">Kaartlagen</span>
                </div>
                <button
                  onClick={toggleLayerPanel}
                  className="p-0.5 rounded border-0 outline-none bg-orange-400/50 hover:bg-orange-400 transition-colors"
                >
                  <X size={16} className="text-white" strokeWidth={2.5} />
                </button>
              </div>

              <div className="p-2 overflow-y-auto flex-1">
                {/* Base layers */}
                <div className="mb-3 pb-2 border-b border-gray-100">
                  <div className="text-xs font-medium text-gray-500 mb-1.5 px-1 uppercase tracking-wide">Achtergrond</div>
                  <div className="flex gap-1">
                    {BASE_LAYERS.map((layer) => (
                      <button
                        key={layer.name}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-colors border-0 outline-none ${
                          visible[layer.name]
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-orange-50'
                        }`}
                        onClick={() => handleBaseLayerChange(layer.name)}
                      >
                        {layer.label}
                      </button>
                    ))}
                  </div>
                  {visible['Luchtfoto'] && (
                    <button
                      onClick={handleLabelsToggle}
                      className={`mt-1.5 w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg transition-colors border-0 outline-none ${
                        visible['Labels Overlay']
                          ? 'bg-orange-50 text-orange-600'
                          : 'bg-transparent text-gray-500 hover:bg-orange-50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Tag size={12} />
                        Labels overlay
                      </span>
                      {visible['Labels Overlay'] && <Check size={12} />}
                    </button>
                  )}
                </div>

                {/* Terrain layers - Hillshade */}
                <div className="mb-3 pb-2 border-b border-gray-100">
                  <div className="text-xs font-medium text-amber-600 mb-1.5 px-1 uppercase tracking-wide">Hoogtekaart</div>
                  <LayerToggle
                    name="AHN4 Hillshade"
                    icon={Mountain}
                    color="#f59e0b"
                    visible={hillshadeVisible}
                    opacity={hillshadeOpacity}
                    onToggle={() => toggleLayer('AHN4 Hillshade')}
                    onOpacityChange={(val) => setLayerOpacity('AHN4 Hillshade', val)}
                  />
                </div>

                {/* Water layers */}
                <div className="mb-3 pb-2 border-b border-gray-100">
                  <div className="text-xs font-medium text-cyan-600 mb-1.5 px-1 uppercase tracking-wide">Water</div>
                  <LayerToggle
                    name="PDOK Water NL"
                    label="Waterlopen NL"
                    icon={Droplets}
                    color="#0284c7"
                    visible={pdokWaterVisible}
                    opacity={pdokWaterOpacity}
                    onToggle={() => toggleLayer('PDOK Water NL')}
                    onOpacityChange={(val) => setLayerOpacity('PDOK Water NL', val)}
                  />
                </div>

                {/* Fishing layers */}
                <div>
                  <div className="text-xs font-medium text-orange-600 mb-1.5 px-1 uppercase tracking-wide">Vislagen</div>
                  <div className="space-y-0.5">
                    {VIS_LAYERS.map((layer) => {
                      const Icon = layer.icon
                      const isVisible = visible[layer.name]

                      return (
                        <button
                          key={layer.name}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors border-0 outline-none ${
                            isVisible
                              ? 'bg-orange-50'
                              : 'bg-transparent hover:bg-orange-50'
                          }`}
                          onClick={() => toggleLayer(layer.name)}
                        >
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                            style={{ backgroundColor: isVisible ? layer.color : '#e5e7eb' }}
                          >
                            <Icon size={12} className="text-white" />
                          </div>
                          <span className={`text-sm ${isVisible ? 'text-orange-700' : 'text-gray-600'}`}>
                            {layer.name}
                          </span>
                          <div className="ml-auto">
                            <div
                              className="w-4 h-4 rounded-sm flex items-center justify-center transition-all"
                              style={{
                                backgroundColor: isVisible ? layer.color : 'white',
                                border: `2px solid ${isVisible ? layer.color : '#d1d5db'}`
                              }}
                            >
                              {isVisible && <Check size={10} className="text-white" strokeWidth={3} />}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

interface LayerToggleProps {
  name: string
  label?: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  visible: boolean
  opacity: number
  onToggle: () => void
  onOpacityChange: (value: number) => void
}

function LayerToggle({ name, label, icon: Icon, color, visible, opacity, onToggle, onOpacityChange }: LayerToggleProps) {
  const displayName = label || name
  return (
    <div>
      <button
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors border-0 outline-none ${
          visible ? 'bg-gray-50' : 'bg-transparent hover:bg-gray-50'
        }`}
        onClick={onToggle}
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center transition-colors"
          style={{ backgroundColor: visible ? color : '#e5e7eb' }}
        >
          <Icon size={12} className="text-white" />
        </div>
        <span className={`text-sm ${visible ? 'text-gray-800' : 'text-gray-600'}`}>
          {displayName}
        </span>
        <div className="ml-auto">
          <div
            className="w-4 h-4 rounded-sm flex items-center justify-center transition-all"
            style={{
              backgroundColor: visible ? color : 'white',
              border: `2px solid ${visible ? color : '#d1d5db'}`
            }}
          >
            {visible && <Check size={10} className="text-white" strokeWidth={3} />}
          </div>
        </div>
      </button>
      {visible && (
        <div className="mt-1 px-2 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 w-16">Transparantie</span>
            <input
              type="range"
              min="10"
              max="100"
              value={opacity * 100}
              onChange={(e) => onOpacityChange(parseInt(e.target.value) / 100)}
              className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: color }}
            />
            <span className="text-[10px] text-gray-400 w-6 text-right">{Math.round(opacity * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
