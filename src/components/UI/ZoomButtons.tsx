import { motion } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { useMapStore } from '../../store'

export function ZoomButtons() {
  const map = useMapStore(state => state.map)

  const handleZoomIn = () => {
    if (!map) return
    const view = map.getView()
    const zoom = view.getZoom()
    if (zoom !== undefined) {
      view.animate({ zoom: zoom + 1, duration: 200 })
    }
  }

  const handleZoomOut = () => {
    if (!map) return
    const view = map.getView()
    const zoom = view.getZoom()
    if (zoom !== undefined) {
      view.animate({ zoom: zoom - 1, duration: 200 })
    }
  }

  return (
    <div className="fixed top-2 left-2 z-[800] flex flex-col gap-1">
      <motion.button
        className="w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white/90 rounded-xl shadow-sm border-0 outline-none transition-colors backdrop-blur-sm"
        onClick={handleZoomIn}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Inzoomen"
      >
        <Plus size={18} className="text-gray-600" />
      </motion.button>
      <motion.button
        className="w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white/90 rounded-xl shadow-sm border-0 outline-none transition-colors backdrop-blur-sm"
        onClick={handleZoomOut}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Uitzoomen"
      >
        <Minus size={18} className="text-gray-600" />
      </motion.button>
    </div>
  )
}
