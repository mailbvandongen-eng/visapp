import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { fromLonLat } from 'ol/proj'
import { useMapStore, useLayerStore, useGPSStore } from '../../store'

// Nederland centrum
const NL_CENTER = fromLonLat([5.1214, 52.0907])
const NL_ZOOM = 8

export function ResetButton() {
  const map = useMapStore(state => state.map)
  const setLayerVisibility = useLayerStore(state => state.setLayerVisibility)
  const stopTracking = useGPSStore(state => state.stopTracking)

  const handleReset = () => {
    // Stop GPS tracking
    stopTracking()

    // Reset to CartoDB base layer
    setLayerVisibility('CartoDB (licht)', true)
    setLayerVisibility('OpenStreetMap', false)
    setLayerVisibility('Luchtfoto', false)

    // Turn off all overlay layers
    setLayerVisibility('Aanlegsteigers', false)
    setLayerVisibility('Boothellingen', false)
    setLayerVisibility('Dieptekaart', false)
    setLayerVisibility('Viswater', false)

    // Reset map view to Netherlands
    if (map) {
      map.getView().animate({
        center: NL_CENTER,
        zoom: NL_ZOOM,
        rotation: 0,
        duration: 500
      })
    }
  }

  return (
    <motion.button
      onClick={handleReset}
      className="fixed bottom-2 left-2 z-[800] w-11 h-11 flex items-center justify-center bg-white/80 hover:bg-white/90 rounded-xl shadow-sm border-0 outline-none transition-colors backdrop-blur-sm"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Reset - Standaard kaart, alle lagen uit, GPS uit"
    >
      <RotateCcw size={18} className="text-gray-600" />
    </motion.button>
  )
}
