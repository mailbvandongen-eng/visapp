import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, Fish, Anchor, Layers, ChevronUp, Save, Plus, Check, Star, LucideIcon } from 'lucide-react'
import { usePresetStore } from '../../store'

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
  Map,
  Fish,
  Anchor,
  Layers,
  Star
}

const ICON_COLORS: Record<string, string> = {
  Map: 'text-gray-600',
  Fish: 'text-green-600',
  Anchor: 'text-blue-600',
  Layers: 'text-purple-600',
  Star: 'text-yellow-500'
}

const HOVER_COLORS: Record<string, string> = {
  Map: 'hover:bg-gray-50',
  Fish: 'hover:bg-green-50',
  Anchor: 'hover:bg-blue-50',
  Layers: 'hover:bg-purple-50',
  Star: 'hover:bg-yellow-50'
}

export function PresetButtons() {
  const { presets, applyPreset, updatePreset, createPreset } = usePresetStore()
  const [isOpen, setIsOpen] = useState(false)
  const [savedPresetId, setSavedPresetId] = useState<string | null>(null)
  const [showAddPreset, setShowAddPreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')

  const handleApplyPreset = (id: string) => {
    applyPreset(id)
    setIsOpen(false)
  }

  const handleSaveToPreset = (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation()
    // Get current visible layers from layerStore
    const { useLayerStore } = require('../../store')
    const visible = useLayerStore.getState().visible
    const currentLayers = ['Aanlegsteigers', 'Boothellingen', 'Dieptekaart', 'Viswater']
      .filter(layer => visible[layer])

    updatePreset(presetId, { layers: currentLayers })
    setSavedPresetId(presetId)
    setTimeout(() => setSavedPresetId(null), 2000)
  }

  const handleAddPreset = () => {
    if (!newPresetName.trim()) return
    createPreset(newPresetName.trim())
    setNewPresetName('')
    setShowAddPreset(false)
  }

  return (
    <>
      {/* Presets button - bottom left, above reset */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[60px] left-2 z-[800] w-11 h-11 flex items-center justify-center bg-white/80 hover:bg-white/90 rounded-xl shadow-sm border-0 outline-none transition-colors backdrop-blur-sm"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Presets"
      >
        {isOpen ? (
          <ChevronUp size={20} className="text-blue-600" />
        ) : (
          <Layers size={20} className="text-gray-600" />
        )}
      </motion.button>

      {/* Preset panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[799]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="fixed bottom-[116px] left-2 z-[801] bg-white rounded-xl shadow-lg overflow-hidden min-w-[180px]"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {/* Header */}
              <div className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600">
                <span className="font-medium text-white text-sm">Presets</span>
              </div>

              {/* Preset list */}
              <div className="p-2 max-h-[250px] overflow-y-auto">
                {presets.map(preset => {
                  const IconComponent = ICON_MAP[preset.icon] || Layers
                  const iconColor = ICON_COLORS[preset.icon] || 'text-blue-600'
                  const hoverColor = HOVER_COLORS[preset.icon] || 'hover:bg-blue-50'
                  const isSaved = savedPresetId === preset.id

                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset.id)}
                      className={`w-full h-9 flex items-center gap-2 px-2 ${hoverColor} rounded text-left transition-colors border-0 outline-none bg-transparent ${isSaved ? 'bg-green-50' : ''}`}
                    >
                      <IconComponent size={16} className={`${iconColor} flex-shrink-0`} />
                      <span className="text-gray-700 text-sm truncate flex-1">{preset.name}</span>
                      {isSaved ? (
                        <span className="ml-auto p-1 flex-shrink-0">
                          <Check size={14} className="text-green-500" />
                        </span>
                      ) : (
                        <span
                          onClick={(e) => handleSaveToPreset(e, preset.id)}
                          className="ml-auto p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                          title="Huidige lagen opslaan"
                        >
                          <Save size={12} className="text-gray-400 hover:text-blue-500" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Footer: Add preset */}
              <div className="border-t border-gray-200 p-2">
                {showAddPreset ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddPreset()
                        if (e.key === 'Escape') setShowAddPreset(false)
                      }}
                      placeholder="Naam..."
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm rounded bg-gray-50 border-0 outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <button
                      onClick={handleAddPreset}
                      disabled={!newPresetName.trim()}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs disabled:opacity-50 border-0 outline-none"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddPreset(true)}
                    className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors border-0 outline-none"
                  >
                    <Plus size={14} />
                    <span>Nieuwe preset</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
