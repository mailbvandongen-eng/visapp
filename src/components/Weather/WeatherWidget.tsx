import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wind, Thermometer, TrendingUp, TrendingDown, Minus, X, BarChart3, Moon, ChevronRight } from 'lucide-react'
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
      <path d="M3 12h18" />
      <path d="M21 12c-1.5 0-3-1-3-3s1.5-3 3-3" />
      <path d="M21 12c-1.5 0-3 1-3 3s1.5 3 3 3" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
      <path d="M8 12l2-3" />
      <path d="M8 12l2 3" />
      <path d="M12 12l2-3" />
      <path d="M12 12l2 3" />
      <path d="M16 12l1.5-2" />
      <path d="M16 12l1.5 2" />
    </svg>
  )
}

// Single fish SVG that can be clipped for half fish
function FishIcon({ size = 16, className = '', clipPercent = 100 }: { size?: number; className?: string; clipPercent?: number }) {
  const clipId = `fish-clip-${Math.random().toString(36).substr(2, 9)}`
  return (
    <svg
      width={size * (clipPercent / 100)}
      height={size}
      viewBox={`0 0 ${24 * (clipPercent / 100)} 24`}
      fill="currentColor"
      className={className}
      style={{ overflow: 'hidden' }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={24 * (clipPercent / 100)} height="24" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path d="M6.5 12c0-3.5 3-6 7-6 2.5 0 4.5 1 6 2.5.8.8 1.5 1.8 2 3-.5 1.2-1.2 2.2-2 3-1.5 1.5-3.5 2.5-6 2.5-4 0-7-2.5-7-5z" />
        <path d="M2.5 12l3-3v6l-3-3z" />
        <circle cx="17" cy="11" r="1" fill="white" />
      </g>
    </svg>
  )
}

// Fish scale indicator with support for decimal values (0-3 fish)
function FishScale({ value, maxFish = 3, color }: { value: number; maxFish?: number; color: string }) {
  const fullFish = Math.floor(value)
  const hasHalf = value % 1 >= 0.5
  const fishArray = []

  for (let i = 0; i < fullFish && i < maxFish; i++) {
    fishArray.push(<FishIcon key={i} size={16} className={color} />)
  }

  if (hasHalf && fullFish < maxFish) {
    fishArray.push(<FishIcon key="half" size={16} className={color} clipPercent={50} />)
  }

  return (
    <div className="flex items-center gap-0.5">
      {fishArray.length > 0 ? fishArray : <FishBone size={18} className={color} />}
    </div>
  )
}

// Moon phase component
function MoonPhase({ phase, size = 20 }: { phase: number; size?: number }) {
  // phase: 0 = new moon, 0.5 = full moon, 1 = new moon again
  const isWaxing = phase < 0.5
  const illumination = phase < 0.5 ? phase * 2 : (1 - phase) * 2

  return (
    <div
      className="relative rounded-full bg-gray-700 overflow-hidden"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 bg-yellow-100"
        style={{
          clipPath: isWaxing
            ? `inset(0 ${(1 - illumination) * 100}% 0 0)`
            : `inset(0 0 0 ${(1 - illumination) * 100}%)`
        }}
      />
    </div>
  )
}

// Solunar activity bar
function SolunarBar({ activity, label }: { activity: number; label: string }) {
  const getColor = () => {
    if (activity >= 0.8) return 'bg-green-500'
    if (activity >= 0.6) return 'bg-lime-500'
    if (activity >= 0.4) return 'bg-amber-500'
    return 'bg-red-400'
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 w-12">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all`}
          style={{ width: `${activity * 100}%` }}
        />
      </div>
    </div>
  )
}

// Calculate moon phase (0-1)
function getMoonPhase(date: Date): number {
  const synodic = 29.53058867
  const known = new Date('2000-01-06T18:14:00Z') // Known new moon
  const diff = (date.getTime() - known.getTime()) / (1000 * 60 * 60 * 24)
  return (diff % synodic) / synodic
}

// Calculate solunar activity based on moon
function getSolunarActivity(date: Date): { major: number[]; minor: number[]; overall: number } {
  const moonPhase = getMoonPhase(date)
  const hour = date.getHours()

  // Moon transit times (simplified)
  const moonTransit = Math.floor((moonPhase * 24 + 12) % 24)
  const moonRise = (moonTransit + 6) % 24
  const moonSet = (moonTransit + 18) % 24

  // Major periods: moonrise and moon overhead (2 hours each)
  const major = [moonTransit, (moonTransit + 12) % 24]
  // Minor periods: moonrise and moonset (1 hour each)
  const minor = [moonRise, moonSet]

  // Calculate overall activity for current hour
  let overall = 0.3 // Base activity

  // New moon and full moon boost
  if (moonPhase < 0.1 || moonPhase > 0.9 || (moonPhase > 0.4 && moonPhase < 0.6)) {
    overall += 0.3
  }

  // Major period boost
  major.forEach(m => {
    const diff = Math.abs(hour - m)
    if (diff <= 1 || diff >= 23) overall += 0.3
    else if (diff <= 2 || diff >= 22) overall += 0.15
  })

  // Minor period boost
  minor.forEach(m => {
    const diff = Math.abs(hour - m)
    if (diff <= 0.5) overall += 0.15
    else if (diff <= 1) overall += 0.08
  })

  return {
    major,
    minor,
    overall: Math.min(1, overall)
  }
}

// Pressure graph component
interface PressureDataPoint {
  time: string
  pressure: number
}

function PressureGraph({ data, onClose }: { data: PressureDataPoint[]; onClose: () => void }) {
  if (data.length === 0) return null

  const pressures = data.map(d => d.pressure)
  const min = Math.min(...pressures) - 2
  const max = Math.max(...pressures) + 2
  const range = max - min

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
  const now = new Date()
  const currentIndex = data.findIndex(d => new Date(d.time) >= now) || Math.floor(data.length / 3)

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.getHours().toString().padStart(2, '0') + ':00'
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
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors border-0 outline-none bg-transparent">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <svg width={width} height={height} className="w-full">
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + pct * graphHeight
            const value = Math.round(max - pct * range)
            return (
              <g key={pct}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                <text x={padding.left - 4} y={y + 4} fontSize="9" fill="#9ca3af" textAnchor="end">{value}</text>
              </g>
            )
          })}

          {[0, Math.floor(data.length / 3), Math.floor(2 * data.length / 3), data.length - 1].map((idx) => {
            if (idx >= data.length) return null
            const x = padding.left + (idx / (data.length - 1)) * graphWidth
            return <text key={idx} x={x} y={height - 5} fontSize="8" fill="#9ca3af" textAnchor="middle">{formatTime(data[idx].time)}</text>
          })}

          <path
            d={`${points.slice(0, currentIndex + 1).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} L ${points[currentIndex]?.x || padding.left} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`}
            fill="rgba(59, 130, 246, 0.15)"
          />

          {currentIndex < points.length - 1 && (
            <path
              d={`${points.slice(currentIndex).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[currentIndex].x} ${height - padding.bottom} Z`}
              fill="rgba(59, 130, 246, 0.08)"
            />
          )}

          <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" />

          {points[currentIndex] && (
            <>
              <line x1={points[currentIndex].x} y1={padding.top} x2={points[currentIndex].x} y2={height - padding.bottom} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx={points[currentIndex].x} cy={points[currentIndex].y} r="4" fill="#f59e0b" />
              <text x={points[currentIndex].x} y={padding.top - 2} fontSize="8" fill="#f59e0b" textAnchor="middle">Nu</text>
            </>
          )}
        </svg>

        <div className="mt-2 text-xs text-gray-500 text-center">
          Dalende druk = vaak beter bijten
        </div>
      </motion.div>
    </motion.div>
  )
}

// Solunar modal with detailed info
function SolunarModal({ onClose }: { onClose: () => void }) {
  const now = new Date()
  const moonPhase = getMoonPhase(now)
  const solunar = getSolunarActivity(now)

  // Generate 24-hour activity forecast
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(now)
    hour.setHours(i, 0, 0, 0)
    return { hour: i, activity: getSolunarActivity(hour).overall }
  })

  const getMoonPhaseName = (phase: number) => {
    if (phase < 0.03 || phase > 0.97) return 'Nieuwe maan'
    if (phase < 0.22) return 'Wassende sikkel'
    if (phase < 0.28) return 'Eerste kwartier'
    if (phase < 0.47) return 'Wassende maan'
    if (phase < 0.53) return 'Volle maan'
    if (phase < 0.72) return 'Afnemende maan'
    if (phase < 0.78) return 'Laatste kwartier'
    return 'Afnemende sikkel'
  }

  const formatHour = (h: number) => `${h.toString().padStart(2, '0')}:00`

  return (
    <motion.div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl p-4 max-w-sm w-full max-h-[80vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Moon size={18} className="text-blue-500" />
            Solunar Activiteit
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors border-0 outline-none bg-transparent">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Moon phase */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <MoonPhase phase={moonPhase} size={40} />
          <div>
            <div className="font-medium text-gray-800">{getMoonPhaseName(moonPhase)}</div>
            <div className="text-xs text-gray-500">{Math.round(moonPhase * 100)}% cyclus</div>
          </div>
        </div>

        {/* Best fishing periods */}
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-600 mb-2">Beste tijden vandaag</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-50 p-2 rounded-lg">
              <div className="text-xs text-green-600 font-medium">Major periodes</div>
              <div className="text-sm text-green-800">
                {solunar.major.map(h => formatHour(h)).join(', ')}
              </div>
            </div>
            <div className="bg-amber-50 p-2 rounded-lg">
              <div className="text-xs text-amber-600 font-medium">Minor periodes</div>
              <div className="text-sm text-amber-800">
                {solunar.minor.map(h => formatHour(h)).join(', ')}
              </div>
            </div>
          </div>
        </div>

        {/* 24-hour activity chart */}
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-600 mb-2">Activiteit per uur</div>
          <div className="flex items-end gap-0.5 h-16">
            {hourlyActivity.map(({ hour, activity }) => (
              <div
                key={hour}
                className={`flex-1 rounded-t transition-all ${
                  activity >= 0.7 ? 'bg-green-500' :
                  activity >= 0.5 ? 'bg-lime-500' :
                  activity >= 0.3 ? 'bg-amber-500' : 'bg-red-400'
                } ${hour === now.getHours() ? 'ring-2 ring-blue-500' : ''}`}
                style={{ height: `${activity * 100}%` }}
                title={`${formatHour(hour)}: ${Math.round(activity * 100)}%`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-gray-400 mt-1">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Gebaseerd op maanfase en -positie
        </div>
      </motion.div>
    </motion.div>
  )
}

export function WeatherWidget() {
  const { current, loading, fetchWeather, getFishingCondition, getFishingScore, pressureHistory, getPressureTrend } = useWeatherStore()
  const position = useGPSStore(state => state.position)
  const showWeatherWidget = useSettingsStore(state => state.showWeatherWidget)
  const [showPressureGraph, setShowPressureGraph] = useState(false)
  const [showSolunar, setShowSolunar] = useState(false)

  const safeTopStyle = { top: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))' }

  useEffect(() => {
    const loc = position || DEFAULT_LOCATION
    fetchWeather(loc.lat, loc.lng)
  }, [])

  useEffect(() => {
    if (position) {
      fetchWeather(position.lat, position.lng)
    }
  }, [position, fetchWeather])

  useEffect(() => {
    const loc = position || DEFAULT_LOCATION
    const interval = setInterval(() => {
      fetchWeather(loc.lat, loc.lng)
    }, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [position, fetchWeather])

  if (!showWeatherWidget) return null
  if (!current && !loading) return null

  const condition = getFishingCondition()
  const score = getFishingScore ? getFishingScore() : (condition === 'excellent' ? 3 : condition === 'good' ? 2 : condition === 'moderate' ? 1 : 0)

  // Solunar data
  const solunar = getSolunarActivity(new Date())
  const moonPhase = getMoonPhase(new Date())

  // Combined score (weather + solunar)
  const combinedScore = Math.min(3, (score / 2) + (solunar.overall * 1.5))

  const conditionColors = {
    excellent: 'text-green-500',
    good: 'text-lime-500',
    moderate: 'text-amber-500',
    poor: 'text-red-500'
  }

  const getColorForScore = (s: number) => {
    if (s >= 2.5) return 'text-green-500'
    if (s >= 1.5) return 'text-lime-500'
    if (s >= 0.8) return 'text-amber-500'
    return 'text-red-500'
  }

  const getBgForScore = (s: number) => {
    if (s >= 2.5) return 'bg-green-50 border-green-200'
    if (s >= 1.5) return 'bg-lime-50 border-lime-200'
    if (s >= 0.8) return 'bg-amber-50 border-amber-200'
    return 'bg-red-50 border-red-200'
  }

  const getWindDirection = (deg: number) => {
    const directions = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW']
    return directions[Math.round(deg / 45) % 8]
  }

  return (
    <>
      <motion.div
        className={`fixed left-2 z-[700] bg-white/95 backdrop-blur-sm rounded-xl shadow-sm p-3 min-w-[140px] border ${getBgForScore(combinedScore)}`}
        style={safeTopStyle}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {loading ? (
          <div className="text-sm text-gray-500">Laden...</div>
        ) : current ? (
          <div className="space-y-2">
            {/* Fish scale indicator - no text, just fish */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <FishScale value={combinedScore} color={getColorForScore(combinedScore)} />
              <button
                onClick={() => setShowSolunar(true)}
                className="flex items-center gap-1 p-1 hover:bg-white/50 rounded transition-colors border-0 outline-none bg-transparent"
                title="Solunar info"
              >
                <MoonPhase phase={moonPhase} size={16} />
                <ChevronRight size={12} className="text-gray-400" />
              </button>
            </div>

            {/* Solunar activity mini bar */}
            <SolunarBar activity={solunar.overall} label="Activiteit" />

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

            {/* Pressure - clickable */}
            <button
              onClick={() => setShowPressureGraph(true)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors w-full border-0 outline-none bg-transparent p-0"
            >
              <BarChart3 size={16} className="text-gray-400" />
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
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showPressureGraph && pressureHistory.length > 0 && (
          <PressureGraph data={pressureHistory} onClose={() => setShowPressureGraph(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSolunar && (
          <SolunarModal onClose={() => setShowSolunar(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
