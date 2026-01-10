import { motion } from 'framer-motion'
import { useWeatherStore, useSettingsStore } from '../../store'

export function WindIndicator() {
  const current = useWeatherStore(state => state.current)
  const showWindIndicator = useSettingsStore(state => state.showWindIndicator)

  if (!showWindIndicator || !current) return null

  const windSpeed = Math.round(current.windSpeed)
  const windDirection = current.windDirection

  // Get color based on wind speed (Beaufort scale-ish)
  const getWindColor = () => {
    if (windSpeed < 12) return '#22c55e' // green - calm
    if (windSpeed < 20) return '#84cc16' // lime - light
    if (windSpeed < 30) return '#eab308' // yellow - moderate
    if (windSpeed < 40) return '#f97316' // orange - fresh
    return '#ef4444' // red - strong
  }

  const getWindLabel = () => {
    if (windSpeed < 5) return 'Stil'
    if (windSpeed < 12) return 'Zwak'
    if (windSpeed < 20) return 'Matig'
    if (windSpeed < 30) return 'Vrij krachtig'
    if (windSpeed < 40) return 'Krachtig'
    return 'Hard'
  }

  return (
    <motion.div
      className="fixed bottom-4 left-2 z-[700] bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Compass with wind arrow */}
      <div className="relative w-16 h-16">
        {/* Compass ring */}
        <div className="absolute inset-0 rounded-full border-2 border-gray-200" />

        {/* Cardinal directions */}
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 text-[8px] font-bold text-gray-400">N</span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-0.5 text-[8px] font-bold text-gray-400">Z</span>
        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-0.5 text-[8px] font-bold text-gray-400">W</span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-0.5 text-[8px] font-bold text-gray-400">O</span>

        {/* Wind arrow - points in the direction wind is going TO */}
        <motion.div
          className="absolute inset-2 flex items-center justify-center"
          style={{ transform: `rotate(${windDirection}deg)` }}
          animate={{ rotate: windDirection }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-full h-full"
            style={{ color: getWindColor() }}
          >
            {/* Arrow pointing up (will be rotated) */}
            <path
              d="M12 2l-6 10h4v10h4V12h4L12 2z"
              fill="currentColor"
            />
          </svg>
        </motion.div>

        {/* Center speed */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold" style={{ color: getWindColor() }}>
              {windSpeed}
            </span>
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="text-center mt-1">
        <span className="text-[10px] text-gray-500">{getWindLabel()}</span>
      </div>
    </motion.div>
  )
}
