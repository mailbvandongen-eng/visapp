import { motion } from 'framer-motion'
import { LocateFixed } from 'lucide-react'
import { useGPS } from '../../hooks/useGPS'

export function GpsButton() {
  const { tracking, toggle } = useGPS()

  return (
    <motion.button
      className={`
        fixed bottom-2 right-2 z-[1000]
        w-11 h-11 cursor-pointer border-0 outline-none
        flex items-center justify-center
        rounded-xl backdrop-blur-sm
        transition-all duration-200
        ${tracking
          ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/30'
          : 'bg-white/80 text-gray-500 hover:bg-white/90 shadow-sm'
        }
      `}
      onClick={toggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={tracking ? {
        scale: [1, 1.02, 1],
      } : {}}
      transition={tracking ? {
        scale: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      } : {}}
      aria-label={tracking ? 'GPS tracking actief' : 'GPS tracking starten'}
      title={tracking ? 'GPS tracking actief' : 'GPS tracking starten'}
    >
      <LocateFixed size={22} strokeWidth={2} />
    </motion.button>
  )
}
