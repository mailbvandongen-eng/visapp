import { useState } from 'react'
import { Menu, X, Info, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../store'

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { toggleInfoPanel, toggleSettingsPanel } = useUIStore()

  // Safe top position for mobile browsers (accounts for notch/status bar)
  const safeTopStyle = { top: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))' }

  const closeMenu = () => setIsOpen(false)

  const handleInfoClick = () => {
    closeMenu()
    toggleInfoPanel()
  }

  const handleSettingsClick = () => {
    closeMenu()
    toggleSettingsPanel()
  }

  return (
    <>
      {/* Hamburger Button - Blue when open */}
      <motion.button
        className={`fixed right-2 z-[800] w-11 h-11 flex items-center justify-center rounded-xl shadow-sm border-0 outline-none transition-colors backdrop-blur-sm ${
          isOpen
            ? 'bg-blue-500 hover:bg-blue-600'
            : 'bg-white/90 hover:bg-white'
        }`}
        style={safeTopStyle}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Menu"
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <Menu size={22} className="text-gray-600" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[799]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed right-2 z-[801] w-56 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col"
              style={{
                top: 'calc(max(0.5rem, env(safe-area-inset-top, 0.5rem)) + 52px)'
              }}
            >
              {/* Header - blue bg, white text */}
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600">
                <span className="font-medium text-white text-sm">Menu</span>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={handleInfoClick}
                  className="w-full px-3 py-2.5 text-left flex items-center gap-3 border-0 outline-none bg-transparent transition-colors text-gray-700 hover:bg-blue-50 text-sm"
                >
                  <Info size={18} className="text-blue-500" />
                  <span>Info & handleiding</span>
                </button>
              </div>

              {/* Settings always at bottom */}
              <div className="mt-auto border-t border-gray-100">
                <button
                  onClick={handleSettingsClick}
                  className="w-full px-3 py-2.5 text-left flex items-center gap-3 border-0 outline-none bg-transparent transition-colors text-gray-700 hover:bg-gray-50 text-sm"
                >
                  <Settings size={18} className="text-gray-500" />
                  <span>Instellingen</span>
                </button>
              </div>

              {/* Version Footer */}
              <div className="px-3 py-1.5 bg-gray-50 text-center text-gray-400 text-xs">
                VisApp NL v1.0.0
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
