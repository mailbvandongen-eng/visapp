import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Anchor, Ship, Waves, MapPin, Check, Tag } from 'lucide-react'
import { useLayerStore } from '../../store'

const LAYER_CONFIG = [
  { name: 'Aanlegsteigers', icon: Anchor, color: '#2196F3' },
  { name: 'Boothellingen', icon: Ship, color: '#4CAF50' },
  { name: 'Dieptekaart', icon: Waves, color: '#00BCD4' },
  { name: 'Viswater', icon: MapPin, color: '#9C27B0' }
]

const BASE_LAYERS = [
  { name: 'Terrein', label: 'Terrein' },
  { name: 'OpenStreetMap', label: 'Kaart' },
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
    // Auto-enable labels overlay when switching to satellite
    if (layerName === 'Luchtfoto') {
      setLayerVisibility('Labels Overlay', true)
    } else {
      setLayerVisibility('Labels Overlay', false)
    }
  }

  const handleLabelsToggle = () => {
    setLayerVisibility('Labels Overlay', !visible['Labels Overlay'])
  }

  return (
    <div className="fixed bottom-[60px] right-2 z-[900]">
      {/* Toggle button */}
      <motion.button
        className="w-11 h-11 bg-white/90 hover:bg-white backdrop-blur-sm rounded-xl shadow-sm flex items-center justify-center text-gray-600 border-0 outline-none transition-colors"
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
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[-1]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="absolute bottom-12 right-0 bg-white rounded-xl shadow-lg overflow-hidden min-w-[200px]"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
            >
              {/* Header */}
              <div className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600">
                <span className="font-medium text-white text-sm">Kaartlagen</span>
              </div>

              <div className="p-2">
                {/* Base layers */}
                <div className="mb-2 pb-2 border-b border-gray-100">
                  <div className="text-xs font-medium text-gray-400 mb-1.5 px-1">Achtergrond</div>
                  <div className="flex gap-1">
                    {BASE_LAYERS.map((layer) => (
                      <button
                        key={layer.name}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-colors border-0 outline-none ${
                          visible[layer.name]
                            ? 'bg-blue-500 text-white'
                            : 'bg-transparent text-gray-600 hover:bg-blue-50'
                        }`}
                        onClick={() => handleBaseLayerChange(layer.name)}
                      >
                        {layer.label}
                      </button>
                    ))}
                  </div>
                  {/* Labels toggle - only show when satellite is active */}
                  {visible['Luchtfoto'] && (
                    <button
                      onClick={handleLabelsToggle}
                      className={`mt-1.5 w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg transition-colors border-0 outline-none ${
                        visible['Labels Overlay']
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-transparent text-gray-500 hover:bg-blue-50'
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

                {/* Overlay layers */}
                <div className="text-xs font-medium text-gray-400 mb-1.5 px-1">Kaartlagen</div>
                <div className="space-y-0.5">
                  {LAYER_CONFIG.map((layer) => {
                    const Icon = layer.icon
                    const isVisible = visible[layer.name]

                    return (
                      <button
                        key={layer.name}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors border-0 outline-none ${
                          isVisible
                            ? 'bg-blue-50'
                            : 'bg-transparent hover:bg-blue-50'
                        }`}
                        onClick={() => toggleLayer(layer.name)}
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                          style={{ backgroundColor: isVisible ? layer.color : '#e5e7eb' }}
                        >
                          <Icon size={14} className="text-white" />
                        </div>
                        <span className={`text-sm ${isVisible ? 'text-blue-700' : 'text-gray-600'}`}>
                          {layer.name}
                        </span>
                        <div className="ml-auto">
                          <div
                            className="w-4 h-4 rounded flex items-center justify-center transition-all"
                            style={{
                              backgroundColor: isVisible ? '#3b82f6' : 'transparent',
                              border: isVisible ? '2px solid #3b82f6' : '2px solid #93c5fd'
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
