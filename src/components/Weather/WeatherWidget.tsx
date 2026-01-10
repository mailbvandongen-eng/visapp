import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, Wind, Thermometer, Fish, TrendingUp, TrendingDown, Minus, X, BarChart3 } from 'lucide-react'
import { useWeatherStore, useGPSStore, useSettingsStore } from '../../store'

// Default location: center of Netherlands
const DEFAULT_LOCATION = { lat: 52.1326, lng: 5.2913 }

// Fish bone icon for poor conditions
function FishBone({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Fish skeleton/bone */}
      <path d="M3 12h18" />
      <path d="M21 12c-1.5 0-3-1-3-3s1.5-3 3-3" />
      <path d="M21 12c-1.5 0-3 1-3 3s1.5 3 3 3" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
      {/* Ribs */}
      <path d="M8 12l2-3" />
      <path d="M8 12l2 3" />
      <path d="M12 12l2-3" />
      <path d="M12 12l2 3" />
      <path d="M16 12l1.5-2" />
      <path d="M16 12l1.5 2" />
    </svg>
  )
}

// Multiple fish icons component
function MultipleFish({ count, size = 16, className = '' }: { count: number; size?: number; className?: string }) {
  return (
    <div className="flex items-center -space-x-1">
      {Array.from({ length: count }).map((_, i) => (
        <Fish key={i} size={size} className={className} style={{ opacity: 1 - (i * 0.15) }} />
      ))}
    </div>
  )
}

// Pressure graph component
interface PressureDataPoint {
  time: string
  pressure: number
}

function PressureGraph({ data, onClose }: { data: PressureDataPoint[]; onClose: () => void }) {
  if (data.length === 0) return null

  // Find min/max for scaling
  const pressures = data.map(d => d.pressure)
  const min = Math.min(...pressures) - 2
  const max = Math.max(...pressures) + 2
  const range = max - min

  // Calculate SVG path
  const width = 300
  const height = 120
  const padding = { top: 10, right: 10, bottom: 25, left: 35 }
  const graphWidth = width - padding.left - padding.right
  const graphHeight = height - padding.top - padding.bottom

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * graphWidth
    const y = padding.top + graphHeight - ((d.pressure - min) / range) * graphHeight
    return { x, y, time: d.time, pressure: d.pressure }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  // Find current time index (approximately)
  const now = new Date()
  const currentIndex = data.findIndex(d => new Date(d.time) >= now) || Math.floor(data.length / 3)

  // Format time labels
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.getHours().toString().padStart(2, '0') + ':00'
  }

  const formatDate = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' })
  }

  return (
    <motion.div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl p-4 max-w-sm w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-500" />
            Luchtdruk (72 uur)
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors border-0 outline-none bg-transparent"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <svg width={width} height={height} className="w-full">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + pct * graphHeight
            const value = Math.round(max - pct * range)
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text x={padding.left - 4} y={y + 4} fontSize="9" fill="#9ca3af" textAnchor="end">
                  {value}
                </text>
              </g>
            )
          })}

          {/* Time labels */}
          {[0, Math.floor(data.length / 3), Math.floor(2 * data.length / 3), data.length - 1].map((idx) => {
            if (idx >= data.length) return null
            const x = padding.left + (idx / (data.length - 1)) * graphWidth
            return (
              <text key={idx} x={x} y={height - 5} fontSize="8" fill="#9ca3af" textAnchor="middle">
                {formatTime(data[idx].time)}
              </text>
            )
          })}

          {/* Past area (darker) */}
          <path
            d={`${points.slice(0, currentIndex + 1).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} L ${points[currentIndex]?.x || padding.left} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`}
            fill="rgba(59, 130, 246, 0.15)"
          />

          {/* Future area (lighter) */}
          {currentIndex < points.length - 1 && (
            <path
              d={`${points.slice(currentIndex).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[currentIndex].x} ${height - padding.bottom} Z`}
              fill="rgba(59, 130, 246, 0.08)"
            />
          )}

          {/* Line */}
          <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" />

          {/* Current time marker */}
          {points[currentIndex] && (
            <>
              <line
                x1={points[currentIndex].x}
                y1={padding.top}
                x2={points[currentIndex].x}
                y2={height - padding.bottom}
                stroke="#f59e0b"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <circle cx={points[currentIndex].x} cy={points[currentIndex].y} r="4" fill="#f59e0b" />
              <text
                x={points[currentIndex].x}
                y={padding.top - 2}
                fontSize="8"
                fill="#f59e0b"
                textAnchor="middle"
              >
                Nu
              </text>
            </>
          )}
        </svg>

        <div className="mt-2 text-xs text-gray-500 text-center">
          Lage druk + dalend = vaak beter bijten
        </div>
      </motion.div>
    </motion.div>
  )
}

export function WeatherWidget() {
  const { current, loading, fetchWeather, getFishingCondition, pressureHistory, getPressureTrend } = useWeatherStore()
  const position = useGPSStore(state => state.position)
  const showWeatherWidget = useSettingsStore(state => state.showWeatherWidget)
  const [showGraph, setShowGraph] = useState(false)

  // Safe top position for mobile browsers
  const safeTopStyle = { top: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))' }

  // Fetch weather on mount (use GPS position if available, otherwise default)
  useEffect(() => {
    const loc = position || DEFAULT_LOCATION
    fetchWeather(loc.lat, loc.lng)
  }, []) // Only on mount

  // Update weather when GPS position changes
  useEffect(() => {
    if (position) {
      fetchWeather(position.lat, position.lng)
    }
  }, [position, fetchWeather])

  // Refresh weather every 10 minutes
  useEffect(() => {
    const loc = position || DEFAULT_LOCATION
    const interval = setInterval(() => {
      fetchWeather(loc.lat, loc.lng)
    }, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [position, fetchWeather])

  // Don't show if disabled in settings
  if (!showWeatherWidget) return null

  // Show loading or no data state
  if (!current && !loading) return null

  const condition = getFishingCondition()

  // Gradient colors from red (poor) to green (excellent)
  const conditionColors = {
    excellent: 'text-green-500',
    good: 'text-lime-500',
    moderate: 'text-amber-500',
    poor: 'text-red-500'
  }

  const conditionBgColors = {
    excellent: 'bg-green-50 border-green-200',
    good: 'bg-lime-50 border-lime-200',
    moderate: 'bg-amber-50 border-amber-200',
    poor: 'bg-red-50 border-red-200'
  }

  const conditionLabels = {
    excellent: 'Top!',
    good: 'Goed',
    moderate: 'Matig',
    poor: 'Slecht'
  }

  const getWindDirection = (deg: number) => {
    const directions = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW']
    return directions[Math.round(deg / 45) % 8]
  }

  // Render fish icon based on condition
  const renderFishIcon = () => {
    switch (condition) {
      case 'poor':
        return <FishBone size={20} className={conditionColors[condition]} />
      case 'moderate':
        return <Fish size={18} className={conditionColors[condition]} />
      case 'good':
        return <MultipleFish count={2} size={16} className={conditionColors[condition]} />
      case 'excellent':
        return <MultipleFish count={3} size={16} className={conditionColors[condition]} />
    }
  }

  return (
    <motion.div
      className={`fixed left-2 z-[700] bg-white/95 backdrop-blur-sm rounded-xl shadow-sm p-3 min-w-[130px] border ${conditionBgColors[condition]}`}
      style={safeTopStyle}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {loading ? (
        <div className="text-sm text-gray-500">Laden...</div>
      ) : current ? (
        <div className="space-y-2">
          {/* Fishing condition with dynamic fish icon */}
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            {renderFishIcon()}
            <span className={`text-sm font-semibold ${conditionColors[condition]}`}>
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

          {/* Pressure - clickable for graph */}
          <button
            onClick={() => setShowGraph(true)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors w-full border-0 outline-none bg-transparent p-0"
          >
            <Cloud size={16} className="text-gray-400" />
            <span>{Math.round(current.pressure)} hPa</span>
            {(() => {
              const trend = getPressureTrend()
              if (trend === 'rising') return <TrendingUp size={14} className="text-green-500 ml-auto" />
              if (trend === 'falling') return <TrendingDown size={14} className="text-red-500 ml-auto" />
              return <Minus size={14} className="text-gray-400 ml-auto" />
            })()}
          </button>
        </div>
      ) : null}

      {/* Pressure Graph Modal */}
      <AnimatePresence>
        {showGraph && pressureHistory.length > 0 && (
          <PressureGraph data={pressureHistory} onClose={() => setShowGraph(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
