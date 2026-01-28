import { motion } from 'framer-motion'
import { ImagePlus, Loader2 } from 'lucide-react'
import { useGooglePhotosStore } from '../../store/googlePhotosStore'

export function GooglePhotosButton() {
  const isLoading = useGooglePhotosStore(state => state.isLoading)
  const isPickerOpen = useGooglePhotosStore(state => state.isPickerOpen)
  const openPhotoPicker = useGooglePhotosStore(state => state.openPhotoPicker)
  const error = useGooglePhotosStore(state => state.error)

  const handleClick = () => {
    if (!isLoading && !isPickerOpen) {
      openPhotoPicker()
    }
  }

  return (
    <div className="fixed bottom-[60px] left-2 z-[900]">
      <motion.button
        className={`w-11 h-11 backdrop-blur-sm rounded-xl shadow-sm flex items-center justify-center border-0 outline-none transition-colors ${
          isLoading || isPickerOpen
            ? 'bg-orange-500 text-white'
            : 'bg-white/90 hover:bg-white text-gray-600'
        }`}
        onClick={handleClick}
        whileHover={{ scale: isLoading ? 1 : 1.05 }}
        whileTap={{ scale: isLoading ? 1 : 0.95 }}
        title={error || 'Foto uit Google Photos'}
        disabled={isLoading || isPickerOpen}
      >
        {isLoading || isPickerOpen ? (
          <Loader2 size={22} className="animate-spin" />
        ) : (
          <ImagePlus size={22} />
        )}
      </motion.button>

      {/* Error tooltip */}
      {error && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg"
        >
          {error}
        </motion.div>
      )}
    </div>
  )
}
