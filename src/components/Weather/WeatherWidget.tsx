import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cloud, Wind, Thermometer, Fish } from 'lucide-react'
import { useWeatherStore, useGPSStore } from '../../store'

export function WeatherWidget() {
  const { current, loading, fetchWeather, getFishingCondition } = useWeatherStore()
  const position = useGPSStore(state => state.position)

  useEffect(() => {
    if (position) {
      fetchWeather(position.lat, position.lng)
    }
  }, [position, fetchWeather])

  // Refresh weather every 10 minutes
  useEffect(() => {
    if (!position) return
    const interval = setInterval(() => {
      fetchWeather(position.lat, position.lng)
    }, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [position, fetchWeather])

  if (!current && !loading) return null

  const condition = getFishingCondition()
  const conditionColors = {
    excellent: 'text-green-500',
    good: 'text-lime-500',
    moderate: 'text-amber-500',
    poor: 'text-red-500'
  }

  const conditionLabels = {
    excellent: 'Uitstekend',
    good: 'Goed',
    moderate: 'Matig',
    poor: 'Slecht'
  }

  const getWindDirection = (deg: number) => {
    const directions = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW']
    return directions[Math.round(deg / 45) % 8]
  }

  return (
    <motion.div
      className="fixed top-24 left-2 z-[700] bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-3 min-w-[130px]"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {loading ? (
        <div className="text-sm text-gray-500">Laden...</div>
      ) : current ? (
        <div className="space-y-2">
          {/* Fishing condition */}
          <div className="flex items-center gap-2 pb-2 mb-1">
            <Fish size={18} className={conditionColors[condition]} />
            <span className={`text-sm font-medium ${conditionColors[condition]}`}>
              {conditionLabels[condition]}
            </span>
          </div>

          {/* Temperature */}
          <div className="flex items-center gap-2 text-sm">
            <Thermometer size={16} className="text-gray-400" />
            <span>{Math.round(current.temperature)}°C</span>
          </div>

          {/* Wind */}
          <div className="flex items-center gap-2 text-sm">
            <Wind size={16} className="text-gray-400" />
            <span>
              {Math.round(current.windSpeed)} km/u {getWindDirection(current.windDirection)}
            </span>
          </div>

          {/* Pressure */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Cloud size={16} className="text-gray-400" />
            <span>{Math.round(current.pressure)} hPa</span>
          </div>
        </div>
      ) : null}
    </motion.div>
  )
}
