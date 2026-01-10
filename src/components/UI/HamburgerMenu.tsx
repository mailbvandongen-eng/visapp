import { useState } from 'react'
import { Menu, X, Info, Settings, LogOut, User, Fish } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore, useSettingsStore } from '../../store'
import { useAuthStore } from '../../store/authStore'

// Google logo SVG component
function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { toggleInfoPanel, toggleSettingsPanel } = useUIStore()
  const { user, loading, signInWithGoogle, logout } = useAuthStore()
  const showCatchButton = useSettingsStore(state => state.showCatchButton)
  const setShowCatchButton = useSettingsStore(state => state.setShowCatchButton)

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

  const handleLogin = () => {
    closeMenu()
    signInWithGoogle()
  }

  const handleLogout = () => {
    closeMenu()
    logout()
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
              className="fixed right-2 z-[801] w-64 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col"
              style={{
                top: 'calc(max(0.5rem, env(safe-area-inset-top, 0.5rem)) + 52px)'
              }}
            >
              {/* Header - blue bg, white text */}
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-blue-500">
                <span className="font-medium text-white text-sm">Menu</span>
              </div>

              {/* Google Login / Profile Section */}
              {loading ? (
                <div className="px-3 py-4 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : user ? (
                <div className="px-3 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-8 h-8 rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate text-sm">
                        {user.displayName || 'Gebruiker'}
                      </div>
                      <div className="text-green-600 text-xs">
                        Ingelogd
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border-0 outline-none bg-transparent"
                      title="Uitloggen"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="w-full px-3 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors border-0 outline-none bg-transparent border-b border-gray-100"
                >
                  <GoogleLogo size={18} />
                  <span className="text-gray-700 text-sm">Inloggen met Google</span>
                </button>
              )}

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

              {/* Toggle Options */}
              <div className="py-1 border-t border-gray-100">
                {/* Vangst knop toggle */}
                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Fish size={18} className="text-green-500" />
                    <span className="text-gray-700 text-sm">Vangst knop</span>
                  </div>
                  <button
                    onClick={() => setShowCatchButton(!showCatchButton)}
                    className={`w-10 h-5 rounded-full transition-all border-0 outline-none relative ${
                      showCatchButton ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                        showCatchButton ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
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
                VisApp NL v1.2.2
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
