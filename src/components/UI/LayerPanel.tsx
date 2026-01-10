import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Anchor, Ship, Waves, MapPin } from 'lucide-react'
import { useLayerStore } from '../../store'

const LAYER_CONFIG = [
  { name: 'Aanlegsteigers', icon: Anchor, color: '#2196F3' },
  { name: 'Boothellingen', icon: Ship, color: '#4CAF50' },
  { name: 'Dieptekaart', icon: Waves, color: '#00BCD4' },
  { name: 'Viswater', icon: MapPin, color: '#9C27B0' }
]

const BASE_LAYERS = [
  { name: 'CartoDB (licht)', label: 'Kaart' },
  { name: 'OpenStreetMap', label: 'OSM' },
  { name: 'Luchtfoto', label: 'Satelliet' }
]

export function LayerPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const visible = useLayerStore(state => state.visible)
  const toggleLayer = useLayerStore(state => state.toggleLayer)
  const setLayerVisibility = useLayerStore(state => state.setLayerVisibility)

  const handleBaseLayerChange = (layerName: string) => {
    BASE_LAYERS.forEach(layer => {
      setLayerVisibility(layer.name, layer.name === layerName)
    })
  }

  return (
    <div className="fixed bottom-[60px] right-2 z-[900]">
      {/* Toggle button */}
      <motion.button
        className="w-11 h-11 bg-white/80 hover:bg-white/90 backdrop-blur-sm rounded-xl shadow-sm flex items-center justify-center text-gray-600 border-0 outline-none transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Kaartlagen"
      >
        <Layers size={22} />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-12 right-0 bg-white rounded-xl shadow-lg p-3 min-w-[200px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {/* Base layers */}
            <div className="mb-3 pb-3 border-b border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2">Achtergrond</div>
              <div className="flex gap-1">
                {BASE_LAYERS.map((layer) => (
                  <button
                    key={layer.name}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      visible[layer.name]
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => handleBaseLayerChange(layer.name)}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Overlay layers */}
            <div className="text-xs font-medium text-gray-500 mb-2">Kaartlagen</div>
            <div className="space-y-1">
              {LAYER_CONFIG.map((layer) => {
                const Icon = layer.icon
                const isVisible = visible[layer.name]

                return (
                  <button
                    key={layer.name}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                      isVisible
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    onClick={() => toggleLayer(layer.name)}
                  >
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: isVisible ? layer.color : '#e5e7eb' }}
                    >
                      <Icon size={14} className="text-white" />
                    </div>
                    <span className="text-sm">{layer.name}</span>
                    {isVisible && (
                      <div className="ml-auto w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
