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

// Realistic moon phase component with subtle 3D shading
function MoonPhase({ phase, size = 20 }: { phase: number; size?: number }) {
  // phase: 0 = new moon, 0.5 = full moon, 1 = new moon again
  // Create realistic moon with subtle shadow

  // Calculate shadow position based on phase
  // 0 = new moon (fully dark), 0.25 = first quarter, 0.5 = full moon, 0.75 = last quarter
  const shadowOffset = phase < 0.5
    ? (0.5 - phase) * 2 // Waxing: shadow moves from right to left
    : (phase - 0.5) * 2 // Waning: shadow moves from left to right

  const isWaxing = phase < 0.5

  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(145deg, #f5f5dc 0%, #e8e4c9 50%, #d4d0b8 100%)',
        boxShadow: `inset 0 0 ${size * 0.1}px rgba(0,0,0,0.1), 0 ${size * 0.05}px ${size * 0.1}px rgba(0,0,0,0.2)`
      }}
    >
      {/* Moon surface texture */}
      <div
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle at 30% 30%, transparent 0%, rgba(139,119,101,0.3) 100%),
                       radial-gradient(circle at 70% 60%, rgba(139,119,101,0.2) 0%, transparent 50%),
                       radial-gradient(circle at 40% 70%, rgba(139,119,101,0.15) 0%, transparent 40%)`
        }}
      />

      {/* Shadow overlay for phase - subtle gradient, not pitch black */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: isWaxing
            ? `linear-gradient(to left,
                transparent ${(1 - shadowOffset) * 100}%,
                rgba(60,60,80,0.3) ${(1 - shadowOffset) * 100 + 8}%,
                rgba(50,50,70,0.6) ${(1 - shadowOffset) * 100 + 15}%,
                rgba(40,40,60,0.75) 100%)`
            : `linear-gradient(to right,
                transparent ${(1 - shadowOffset) * 100}%,
                rgba(60,60,80,0.3) ${(1 - shadowOffset) * 100 + 8}%,
                rgba(50,50,70,0.6) ${(1 - shadowOffset) * 100 + 15}%,
                rgba(40,40,60,0.75) 100%)`,
        }}
      />

      {/* Terminator line (day/night boundary) - subtle glow */}
      {phase > 0.02 && phase < 0.98 && (
        <div
          className="absolute top-0 bottom-0 w-[2px] opacity-30"
          style={{
            left: isWaxing ? `${(1 - shadowOffset) * 100}%` : `${shadowOffset * 100}%`,
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,230,0.6), transparent)'
          }}
        />
      )}

      {/* Earthshine effect for new moon - brighter */}
      {(phase < 0.08 || phase > 0.92) && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(140,160,190,0.25) 0%, transparent 70%)'
          }}
        />
      )}
    </div>
  )
}

// Activiteit bar (maanstand-gebaseerd)
function ActiviteitBar({ activity, label }: { activity: number; label: string }) {
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

// Maanstand modal - vooral relevant voor zeevissen
function MaanstandModal({ onClose }: { onClose: () => void }) {
  const now = new Date()
  const moonPhase = getMoonPhase(now)
  const maanTijden = getMaanTijden(now)

  // Generate 24-hour activity forecast
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(now)
    hour.setHours(i, 0, 0, 0)
    return { hour: i, activity: getMaanTijden(hour).activiteit }
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

  // Get tide type based on moon phase
  const getGetijType = (phase: number) => {
    // Spring tide around new and full moon
    if (phase < 0.1 || phase > 0.9 || (phase > 0.4 && phase < 0.6)) {
      return { type: 'Springtij', desc: 'Sterke stroming, actieve vis', color: 'text-green-600', bg: 'bg-green-50' }
    }
    // Neap tide around quarters
    if ((phase > 0.2 && phase < 0.3) || (phase > 0.7 && phase < 0.8)) {
      return { type: 'Doodtij', desc: 'Zwakke stroming, minder activiteit', color: 'text-orange-600', bg: 'bg-orange-50' }
    }
    return { type: 'Normaal getij', desc: 'Gemiddelde stroming', color: 'text-blue-600', bg: 'bg-blue-50' }
  }

  const getij = getGetijType(moonPhase)
  const formatHour = (h: number) => `${h.toString().padStart(2, '0')}:00`

  // Find best and worst times
  const sortedHours = [...hourlyActivity].sort((a, b) => b.activity - a.activity)
  const besteTijden = sortedHours.slice(0, 4).map(h => h.hour).sort((a, b) => a - b)
  const slechteTijden = sortedHours.slice(-4).map(h => h.hour).sort((a, b) => a - b)

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
            <Moon size={18} className="text-indigo-500" />
            Maanstand & Getij
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors border-0 outline-none bg-transparent">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Moon phase with large realistic moon */}
        <div className="flex items-center gap-4 mb-4 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl">
          <MoonPhase phase={moonPhase} size={60} />
          <div>
            <div className="font-medium text-white text-lg">{getMoonPhaseName(moonPhase)}</div>
            <div className="text-sm text-slate-300">{Math.round(moonPhase * 100)}% verlicht</div>
          </div>
        </div>

        {/* Tide type indicator */}
        <div className={`p-3 rounded-lg mb-4 ${getij.bg}`}>
          <div className={`font-medium ${getij.color}`}>{getij.type}</div>
          <div className="text-sm text-gray-600">{getij.desc}</div>
        </div>

        {/* Best fishing periods for sea fishing */}
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
            🎣 Zeevissen - beste en slechtste tijden
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <div className="text-xs text-green-700 font-medium mb-1">Beste tijden</div>
              <div className="text-sm text-green-800 font-medium">
                {besteTijden.map(h => formatHour(h)).join(', ')}
              </div>
              <div className="text-[10px] text-green-600 mt-1">
                Maan hoog/laag
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="text-xs text-red-700 font-medium mb-1">Slechtste tijden</div>
              <div className="text-sm text-red-800 font-medium">
                {slechteTijden.map(h => formatHour(h)).join(', ')}
              </div>
              <div className="text-[10px] text-red-600 mt-1">
                Maan tussen standen
              </div>
            </div>
          </div>
        </div>

        {/* 24-hour activity chart */}
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-600 mb-2">Visactiviteit per uur</div>
          <div className="flex items-end gap-0.5 h-16 bg-gray-50 rounded-lg p-1">
            {hourlyActivity.map(({ hour, activity }) => (
              <div
                key={hour}
                className={`flex-1 rounded-t transition-all ${
                  activity >= 0.7 ? 'bg-green-500' :
                  activity >= 0.5 ? 'bg-lime-500' :
                  activity >= 0.3 ? 'bg-amber-500' : 'bg-red-400'
                } ${hour === now.getHours() ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
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

        <div className="text-xs text-gray-400 text-center bg-amber-50 p-2 rounded-lg">
          ⚠️ Maanstand is vooral relevant voor <strong>zeevissen</strong>.<br/>
          Bij zoetwater speelt dit minder een rol.
        </div>
      </motion.div>
    </motion.div>
  )
}

// Get moon-based fishing times (replaces getSolunarActivity)
function getMaanTijden(date: Date): { besteTijden: number[]; slechteTijden: number[]; activiteit: number } {
  const moonPhase = getMoonPhase(date)
  const hour = date.getHours()

  // Moon transit times (simplified)
  const maanHoogste = Math.floor((moonPhase * 24 + 12) % 24)
  const maanOpkomst = (maanHoogste + 6) % 24
  const maanOndergang = (maanHoogste + 18) % 24
  const maanLaagste = (maanHoogste + 12) % 24

  // Best times: when moon is highest or lowest (strongest tidal pull)
  const besteTijden = [maanHoogste, maanLaagste]
  // Worst times: moonrise and moonset (transition periods)
  const slechteTijden = [maanOpkomst, maanOndergang]

  // Calculate activity for current hour
  let activiteit = 0.3 // Base activity

  // Spring tide boost (new moon or full moon)
  if (moonPhase < 0.1 || moonPhase > 0.9 || (moonPhase > 0.4 && moonPhase < 0.6)) {
    activiteit += 0.3
  }

  // Best time boost (moon highest/lowest)
  besteTijden.forEach(t => {
    const diff = Math.abs(hour - t)
    if (diff <= 1 || diff >= 23) activiteit += 0.3
    else if (diff <= 2 || diff >= 22) activiteit += 0.15
  })

  // Worst time penalty
  slechteTijden.forEach(t => {
    const diff = Math.abs(hour - t)
    if (diff <= 1) activiteit -= 0.1
  })

  return {
    besteTijden,
    slechteTijden,
    activiteit: Math.max(0.1, Math.min(1, activiteit))
  }
}

export function WeatherWidget() {
  const { current, loading, fetchWeather, getFishingCondition, getFishingScore, pressureHistory, getPressureTrend } = useWeatherStore()
  const position = useGPSStore(state => state.position)
  const showWeatherWidget = useSettingsStore(state => state.showWeatherWidget)
  const [showPressureGraph, setShowPressureGraph] = useState(false)
  const [showMaanstand, setShowMaanstand] = useState(false)

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

  // Maanstand data
  const maanTijden = getMaanTijden(new Date())
  const moonPhase = getMoonPhase(new Date())

  // Combined score (weather + moon activity)
  const combinedScore = Math.min(3, (score / 2) + (maanTijden.activiteit * 1.5))

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
                onClick={() => setShowMaanstand(true)}
                className="flex items-center gap-1 p-1 hover:bg-white/50 rounded transition-colors border-0 outline-none bg-transparent"
                title="Maanstand"
              >
                <MoonPhase phase={moonPhase} size={16} />
                <ChevronRight size={12} className="text-gray-400" />
              </button>
            </div>

            {/* Activiteit bar */}
            <ActiviteitBar activity={maanTijden.activiteit} label="Activiteit" />

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
        {showMaanstand && (
          <MaanstandModal onClose={() => setShowMaanstand(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
