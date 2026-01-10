import { motion, AnimatePresence } from 'framer-motion'
import { Fish } from 'lucide-react'
import { useUIStore, useGPSStore, useSettingsStore } from '../../store'
import { AddCatchForm } from './AddCatchForm'

export function AddCatchButton() {
  const catchFormOpen = useUIStore(state => state.catchFormOpen)
  const catchFormLocation = useUIStore(state => state.catchFormLocation)
  const catchFormLocationSource = useUIStore(state => state.catchFormLocationSource)
  const catchFormInitialPhotos = useUIStore(state => state.catchFormInitialPhotos)
  const openCatchForm = useUIStore(state => state.openCatchForm)
  const closeCatchForm = useUIStore(state => state.closeCatchForm)
  const position = useGPSStore(state => state.position)
  const showCatchButton = useSettingsStore(state => state.showCatchButton)

  const handleClick = () => {
    if (position) {
      openCatchForm({ location: { lat: position.lat, lng: position.lng }, locationSource: 'gps' })
    } else {
      openCatchForm()
    }
  }

  return (
    <>
      {/* Square button, same size as GPS button, positioned to its left */}
      {showCatchButton && (
        <motion.button
          className="fixed bottom-2 right-[60px] z-[1000] w-11 h-11 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-sm flex items-center justify-center cursor-pointer border-0 outline-none backdrop-blur-sm"
          onClick={handleClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Vangst toevoegen"
          title="Vangst toevoegen"
        >
          <Fish size={22} strokeWidth={2} />
        </motion.button>
      )}

      <AnimatePresence>
        {catchFormOpen && (
          <AddCatchForm
            onClose={closeCatchForm}
            initialLocation={catchFormLocation || undefined}
            initialLocationSource={catchFormLocationSource || undefined}
            initialPhotos={catchFormInitialPhotos}
          />
        )}
      </AnimatePresence>
    </>
  )
}
