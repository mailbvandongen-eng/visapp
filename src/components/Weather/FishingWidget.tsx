import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind,
  Thermometer, Droplets, ChevronDown, ChevronUp, RefreshCw,
  Navigation, Waves, Moon, BarChart3, TrendingUp, TrendingDown, Minus, X, ChevronRight,
  Search, MapPin, Play, Pause, Gauge
} from 'lucide-react'
import { useWeatherStore, useGPSStore, useSettingsStore } from '../../store'
import { useWaterDataStore } from '../../store/waterDataStore'
import { RWS_STATIONS } from '../../services/rwsService'

// Default location: center of Netherlands
const DEFAULT_LOCATION = { lat: 52.1326, lng: 5.2913 }

// Weather descriptions
const weatherCodeDescriptions: Record<number, string> = {
  0: 'Helder',
  1: 'Overwegend helder',
  2: 'Halfbewolkt',
  3: 'Bewolkt',
  45: 'Mist',
  48: 'Rijpmist',
  51: 'Lichte motregen',
  53: 'Motregen',
  55: 'Zware motregen',
  61: 'Lichte regen',
  63: 'Regen',
  65: 'Zware regen',
  71: 'Lichte sneeuw',
  73: 'Sneeuw',
  75: 'Zware sneeuw',
  80: 'Lichte buien',
  81: 'Buien',
  82: 'Zware buien',
  95: 'Onweer',
  96: 'Onweer met hagel',
  99: 'Zwaar onweer'
}

// Weather icon based on code
function WeatherIcon({ code, size = 18 }: { code: number; size?: number }) {
  if (code === 0) return <Sun size={size} className="text-yellow-500" />
  if (code >= 1 && code <= 3) return <Cloud size={size} className="text-gray-400" />
  if (code === 45 || code === 48) return <CloudFog size={size} className="text-gray-400" />
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain size={size} className="text-blue-500" />
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <CloudSnow size={size} className="text-cyan-500" />
  if (code >= 95) return <CloudLightning size={size} className="text-purple-500" />
  return <Cloud size={size} className="text-gray-400" />
}

// Wind direction arrow
function WindArrow({ degrees, size = 14 }: { degrees: number; size?: number }) {
  return (
    <div style={{ transform: `rotate(${degrees + 180}deg)` }} className="inline-flex">
      <Navigation size={size} className="text-blue-500" />
    </div>
  )
}

// Fish bone icon (for score < 0.5)
function FishBone({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Main spine */}
      <path d="M2 12h16" />
      {/* Tail fin */}
      <path d="M18 12l4-4" />
      <path d="M18 12l4 4" />
      {/* Head */}
      <circle cx="3" cy="12" r="1.5" fill="currentColor" />
      {/* Ribs */}
      <path d="M6 12l1.5-3" />
      <path d="M6 12l1.5 3" />
      <path d="M10 12l1.5-3" />
      <path d="M10 12l1.5 3" />
      <path d="M14 12l1.5-2.5" />
      <path d="M14 12l1.5 2.5" />
    </svg>
  )
}

// Fish icon - proper fish shape with clear tail
function FishIcon({ size = 16, className = '', clipPercent = 100 }: { size?: number; className?: string; clipPercent?: number }) {
  const clipId = `fish-clip-${Math.random().toString(36).substr(2, 9)}`
  return (
    <svg width={size * (clipPercent / 100)} height={size} viewBox={`0 0 ${24 * (clipPercent / 100)} 24`} fill="currentColor" className={className} style={{ overflow: 'hidden' }}>
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={24 * (clipPercent / 100)} height="24" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {/* Fish body - more elongated */}
        <ellipse cx="12" cy="12" rx="8" ry="5" />
        {/* Tail fin - clear V shape */}
        <path d="M3 12L0 7V17L3 12Z" />
        {/* Eye */}
        <circle cx="17" cy="10.5" r="1.2" fill="white" />
        <circle cx="17.3" cy="10.5" r="0.5" fill="black" />
        {/* Top fin */}
        <path d="M10 7L12 4L14 7" fill="currentColor" />
        {/* Bottom fin */}
        <path d="M11 17L12 19L13 17" fill="currentColor" />
      </g>
    </svg>
  )
}

// Fish scale (0-3 fish) with proper spacing
function FishScale({ value, maxFish = 3, color }: { value: number; maxFish?: number; color: string }) {
  const fullFish = Math.floor(value)
  const partialFish = value % 1
  const fishArray = []

  // Full fish
  for (let i = 0; i < fullFish && i < maxFish; i++) {
    fishArray.push(<FishIcon key={i} size={18} className={color} />)
  }

  // Half fish (if >= 0.5 remainder)
  if (partialFish >= 0.5 && fullFish < maxFish) {
    fishArray.push(<FishIcon key="half" size={18} className={color} clipPercent={60} />)
  }

  return (
    <div className="flex items-center gap-1">
      {fishArray.length > 0 ? fishArray : <FishBone size={18} className={color} />}
    </div>
  )
}

// Moon phase calculation
function getMoonPhase(date: Date): number {
  const synodic = 29.53058867
  const known = new Date('2000-01-06T18:14:00Z')
  const diff = (date.getTime() - known.getTime()) / (1000 * 60 * 60 * 24)
  return (diff % synodic) / synodic
}

// Moon phase name
function getMoonPhaseName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return 'Nieuwe maan'
  if (phase < 0.22) return 'Wassende sikkel'
  if (phase < 0.28) return 'Eerste kwartier'
  if (phase < 0.47) return 'Wassende maan'
  if (phase < 0.53) return 'Volle maan'
  if (phase < 0.72) return 'Afnemende maan'
  if (phase < 0.78) return 'Laatste kwartier'
  return 'Afnemende sikkel'
}

// NASA Moon texture URL (public domain)
const MOON_TEXTURE_URL = 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_1k.jpg'

// Realistic moon phase component with actual moon texture
function MoonPhase({ phase, size = 20 }: { phase: number; size?: number }) {
  // Calculate illumination - phase 0 = new moon, 0.5 = full moon
  // For Northern Hemisphere: waxing = right side lit first, waning = left side lit
  const illumination = phase <= 0.5 ? phase * 2 : (1 - phase) * 2 // 0 to 1 to 0
  const isWaxing = phase < 0.5

  // The terminator position (-1 = fully dark, 0 = half, 1 = fully lit)
  // At new moon (phase 0): terminator at right edge, moving left
  // At full moon (phase 0.5): fully illuminated
  // At last quarter going to new: terminator moving right
  let terminatorX: number
  if (phase <= 0.5) {
    // Waxing: light comes from right, terminator moves from right to left
    terminatorX = 1 - (phase * 4) // 1 -> -1
  } else {
    // Waning: light still from right, but shadow comes from right
    terminatorX = (phase - 0.5) * 4 - 1 // -1 -> 1
  }
  terminatorX = Math.max(-1, Math.min(1, terminatorX))

  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{
        width: size,
        height: size,
        boxShadow: `0 ${size * 0.05}px ${size * 0.15}px rgba(0,0,0,0.4)`
      }}
    >
      {/* Moon texture */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundImage: `url(${MOON_TEXTURE_URL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'contrast(1.1) brightness(1.05)'
        }}
      />

      {/* Fallback gradient if image doesn't load */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `
            radial-gradient(circle at 30% 25%, rgba(200,200,190,0.4) 0%, transparent 25%),
            radial-gradient(circle at 70% 60%, rgba(180,180,170,0.3) 0%, transparent 20%),
            radial-gradient(circle at 45% 75%, rgba(160,160,150,0.3) 0%, transparent 15%),
            radial-gradient(circle at 60% 30%, rgba(170,170,160,0.25) 0%, transparent 18%),
            radial-gradient(circle at 25% 55%, rgba(190,190,180,0.2) 0%, transparent 12%),
            linear-gradient(135deg, #d4d4c8 0%, #a8a89c 50%, #8c8c80 100%)
          `,
          mixBlendMode: 'overlay'
        }}
      />

      {/* Shadow overlay for phase - using SVG for accurate terminator */}
      <svg
        className="absolute inset-0"
        viewBox="0 0 100 100"
        style={{ width: size, height: size }}
      >
        <defs>
          {/* Gradient for soft terminator edge */}
          <linearGradient id={`moonShadow-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(5,5,15,0.97)" />
            <stop offset="40%" stopColor="rgba(5,5,15,0.95)" />
            <stop offset="100%" stopColor="rgba(5,5,15,0)" />
          </linearGradient>
        </defs>

        {phase < 0.03 || phase > 0.97 ? (
          // New moon - almost completely dark
          <circle cx="50" cy="50" r="50" fill="rgba(5,5,15,0.95)" />
        ) : phase > 0.47 && phase < 0.53 ? (
          // Full moon - no shadow
          null
        ) : (
          // Partial phase - elliptical terminator
          <ellipse
            cx={isWaxing ? 50 + terminatorX * 50 : 50 + terminatorX * 50}
            cy="50"
            rx={Math.abs(50 * (1 - Math.abs(terminatorX * 0.8)))}
            ry="50"
            fill="rgba(5,5,15,0.95)"
            style={{
              transform: isWaxing ? 'none' : 'none'
            }}
          />
        )}
      </svg>

      {/* Atmospheric glow on lit edge */}
      {illumination > 0.1 && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: isWaxing
              ? `radial-gradient(circle at ${85 - terminatorX * 20}% 50%, rgba(255,255,240,0.15) 0%, transparent 50%)`
              : `radial-gradient(circle at ${15 - terminatorX * 20}% 50%, rgba(255,255,240,0.15) 0%, transparent 50%)`
          }}
        />
      )}
    </div>
  )
}

// Moon-based activity
function getMoonActivity(date: Date): { activity: number; besteTijden: number[]; slechteTijden: number[] } {
  const moonPhase = getMoonPhase(date)
  const hour = date.getHours()

  const maanHoogste = Math.floor((moonPhase * 24 + 12) % 24)
  const maanOpkomst = (maanHoogste + 6) % 24
  const maanOndergang = (maanHoogste + 18) % 24
  const maanLaagste = (maanHoogste + 12) % 24

  const besteTijden = [maanHoogste, maanLaagste]
  const slechteTijden = [maanOpkomst, maanOndergang]

  let activity = 0.3

  if (moonPhase < 0.1 || moonPhase > 0.9 || (moonPhase > 0.4 && moonPhase < 0.6)) {
    activity += 0.3
  }

  besteTijden.forEach(t => {
    const diff = Math.abs(hour - t)
    if (diff <= 1 || diff >= 23) activity += 0.3
    else if (diff <= 2 || diff >= 22) activity += 0.15
  })

  slechteTijden.forEach(t => {
    const diff = Math.abs(hour - t)
    if (diff <= 1) activity -= 0.1
  })

  return { activity: Math.max(0.1, Math.min(1, activity)), besteTijden, slechteTijden }
}

// Tide type based on moon
function getTideType(phase: number): { type: string; color: string } {
  if (phase < 0.1 || phase > 0.9 || (phase > 0.4 && phase < 0.6)) {
    return { type: 'Springtij', color: 'text-green-600' }
  }
  if ((phase > 0.2 && phase < 0.3) || (phase > 0.7 && phase < 0.8)) {
    return { type: 'Doodtij', color: 'text-orange-600' }
  }
  return { type: 'Normaal', color: 'text-blue-600' }
}

// Tide data calculation
interface TideData {
  time: Date
  height: number
  type: 'high' | 'low'
}

function calculateTides(startDate: Date, days: number): TideData[] {
  const tides: TideData[] = []
  const synodic = 29.53058867
  const known = new Date('2000-01-06T18:14:00Z')
  const tidalPeriod = 12 * 60 + 25

  for (let day = 0; day < days; day++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + day)
    date.setHours(0, 0, 0, 0)

    const diff = (date.getTime() - known.getTime()) / (1000 * 60 * 60 * 24)
    const moonPhase = (diff % synodic) / synodic

    let firstHighTide = (moonPhase * tidalPeriod * 2) % (24 * 60)

    for (let i = 0; i < 4; i++) {
      const isHigh = i % 2 === 0
      const minuteOffset = i * (tidalPeriod / 2)
      let totalMinutes = (firstHighTide + minuteOffset)

      const dayOffset = Math.floor(totalMinutes / (24 * 60))
      totalMinutes = totalMinutes % (24 * 60)

      const hours = Math.floor(totalMinutes / 60)
      const minutes = Math.floor(totalMinutes % 60)

      const tideTime = new Date(date)
      tideTime.setDate(tideTime.getDate() + dayOffset)
      tideTime.setHours(hours, minutes, 0, 0)

      const moonFactor = Math.abs(Math.sin(moonPhase * Math.PI * 2))
      const baseHeight = isHigh ? 1.8 : 0.4
      const variation = moonFactor * 0.5

      tides.push({
        time: tideTime,
        height: isHigh ? baseHeight + variation : baseHeight - variation * 0.5,
        type: isHigh ? 'high' : 'low'
      })
    }
  }

  return tides.sort((a, b) => a.time.getTime() - b.time.getTime())
}

// Precipitation graph (Buienalarm style)
function PrecipitationGraph({ data, showHeader = false }: { data: { time: string; precipitation: number }[]; showHeader?: boolean }) {
  if (!data || data.length === 0) return null

  const maxPrecip = Math.max(...data.map(d => d.precipitation), 0.5)
  const hasRain = data.some(d => d.precipitation > 0)

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-1">
      {showHeader && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500">Neerslag komende 2 uur</span>
        </div>
      )}
      {!hasRain && (
        <div className="text-[10px] text-green-600 font-medium text-right">Droog</div>
      )}

      <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex-1 border-r border-gray-200/50" />
          ))}
        </div>

        <div className="absolute inset-0 flex items-end px-0.5">
          {data.map((d, i) => {
            const height = (d.precipitation / maxPrecip) * 100
            const intensity = d.precipitation > 2 ? 'bg-blue-600' :
                             d.precipitation > 0.5 ? 'bg-blue-500' :
                             d.precipitation > 0 ? 'bg-blue-400' : 'bg-transparent'
            return (
              <div
                key={i}
                className="flex-1 mx-px"
                title={`${formatTime(d.time)}: ${d.precipitation.toFixed(1)} mm`}
              >
                <div
                  className={`w-full rounded-t transition-all ${intensity}`}
                  style={{ height: `${Math.max(height, d.precipitation > 0 ? 8 : 0)}%` }}
                />
              </div>
            )
          })}
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[8px] text-gray-400">
          <span>Nu</span>
          <span>+1u</span>
          <span>+2u</span>
        </div>
      </div>

      {hasRain && (
        <div className="flex items-center gap-2 text-[9px] text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-blue-400" />
            <span>Licht</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-blue-500" />
            <span>Matig</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-blue-600" />
            <span>Zwaar</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Hourly forecast
interface HourlyData {
  time: string
  temperature: number
  weatherCode: number
  precipitationProbability: number
}

function HourlyForecast({ hourly }: { hourly: HourlyData[] }) {
  const now = new Date()
  const currentHour = now.getHours()

  // Filter to show next 8 hours from now
  const upcomingHours = hourly
    .filter(h => new Date(h.time) >= now)
    .slice(0, 8)

  if (upcomingHours.length === 0) return null

  return (
    <div className="space-y-1">
      <div className="text-[10px] text-gray-500">Komende uren</div>
      <div className="flex gap-1 overflow-x-auto py-1 -mx-1 px-1">
        {upcomingHours.map((hour, i) => {
          const time = new Date(hour.time)
          const isNow = time.getHours() === currentHour
          return (
            <div
              key={hour.time}
              className={`flex flex-col items-center p-1.5 rounded-lg min-w-[36px] ${
                isNow ? 'bg-blue-100' : 'bg-gray-50'
              }`}
            >
              <span className="text-[9px] text-gray-500">
                {isNow ? 'Nu' : `${time.getHours()}:00`}
              </span>
              <WeatherIcon code={hour.weatherCode} size={14} />
              <span className="text-[10px] font-medium">{Math.round(hour.temperature)}°</span>
              {hour.precipitationProbability > 20 && (
                <span className="text-[8px] text-blue-500">{hour.precipitationProbability}%</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Dutch cities for location search
const DUTCH_CITIES = [
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'Rotterdam', lat: 51.9244, lng: 4.4777 },
  { name: 'Den Haag', lat: 52.0705, lng: 4.3007 },
  { name: 'Utrecht', lat: 52.0907, lng: 5.1214 },
  { name: 'Eindhoven', lat: 51.4416, lng: 5.4697 },
  { name: 'Groningen', lat: 53.2194, lng: 6.5665 },
  { name: 'Tilburg', lat: 51.5555, lng: 5.0913 },
  { name: 'Almere', lat: 52.3508, lng: 5.2647 },
  { name: 'Breda', lat: 51.5719, lng: 4.7683 },
  { name: 'Nijmegen', lat: 51.8126, lng: 5.8372 },
  { name: 'Arnhem', lat: 51.9851, lng: 5.8987 },
  { name: 'Haarlem', lat: 52.3874, lng: 4.6462 },
  { name: 'Enschede', lat: 52.2215, lng: 6.8937 },
  { name: 'Zwolle', lat: 52.5168, lng: 6.0830 },
  { name: 'Maastricht', lat: 50.8514, lng: 5.6909 },
  { name: 'Leiden', lat: 52.1601, lng: 4.4970 },
  { name: 'Dordrecht', lat: 51.8133, lng: 4.6901 },
  { name: 'Zoetermeer', lat: 52.0575, lng: 4.4931 },
  { name: 'Leeuwarden', lat: 53.2012, lng: 5.7999 },
  { name: 'Den Bosch', lat: 51.6978, lng: 5.3037 },
]

// Extended Precipitation Modal with 48-hour forecast and location search
function PrecipitationModal({ hourlyData, onClose, onLocationChange }: {
  hourlyData: { time: string; precipitation: number; precipitationProbability: number }[];
  onClose: () => void;
  onLocationChange?: (lat: number, lng: number, name: string) => void;
}) {
  const [selectedTime, setSelectedTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  const now = new Date()
  const minTime = useMemo(() => { const t = new Date(now); t.setHours(t.getHours(), 0, 0, 0); return t }, [])
  const maxTime = useMemo(() => { const t = new Date(minTime); t.setHours(t.getHours() + 48); return t }, [minTime])

  const timeRange = maxTime.getTime() - minTime.getTime()
  const sliderValue = ((selectedTime.getTime() - minTime.getTime()) / timeRange) * 100

  const forecast48h = hourlyData.filter(h => {
    const t = new Date(h.time)
    return t >= minTime && t <= maxTime
  })

  const filteredCities = DUTCH_CITIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 6)

  const formatDate = (date: Date) => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const dateDay = new Date(date); dateDay.setHours(0, 0, 0, 0)
    const diff = Math.floor((dateDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    if (diff === 0) return 'Vandaag'
    if (diff === 1) return 'Morgen'
    if (diff === 2) return 'Overmorgen'
    return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' })
  }

  const formatHour = (date: Date) => `${date.getHours().toString().padStart(2, '0')}:00`

  const selectedData = forecast48h.find(h => {
    const t = new Date(h.time)
    return t.getHours() === selectedTime.getHours() && t.getDate() === selectedTime.getDate()
  })

  const maxPrecip = Math.max(...forecast48h.map(h => h.precipitation), 1)
  const hasRain = forecast48h.some(h => h.precipitation > 0)

  const handleCitySelect = (city: typeof DUTCH_CITIES[0]) => {
    setSelectedLocation(city.name)
    setShowSearch(false)
    setSearchQuery('')
    if (onLocationChange) {
      onLocationChange(city.lat, city.lng, city.name)
    }
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
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden select-none"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudRain size={20} className="text-blue-500" />
              <span className="font-semibold text-gray-800">Neerslag 48 uur</span>
              {!hasRain && <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Droog</span>}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors border-0 outline-none bg-transparent">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Location search */}
          <div className="relative">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border-0 outline-none text-left"
            >
              <MapPin size={16} className="text-gray-400" />
              <span className="flex-1 text-sm text-gray-700">{selectedLocation || 'Huidige locatie'}</span>
              <Search size={14} className="text-gray-400" />
            </button>

            {showSearch && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Zoek plaats..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                    autoFocus
                  />
                </div>
                <div className="max-h-40 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedLocation(null); setShowSearch(false); if (onLocationChange) onLocationChange(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, 'Huidige locatie') }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 border-0 outline-none bg-transparent text-left"
                  >
                    <Navigation size={14} className="text-blue-500" />
                    <span className="text-sm text-gray-700">Huidige locatie</span>
                  </button>
                  {filteredCities.map(city => (
                    <button
                      key={city.name}
                      onClick={() => handleCitySelect(city)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 border-0 outline-none bg-transparent text-left"
                    >
                      <MapPin size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{city.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected info */}
          <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">{formatDate(selectedTime)}</div>
              <div className="text-xl font-bold text-blue-600">{formatHour(selectedTime)}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {selectedData ? `${selectedData.precipitation.toFixed(1)} mm` : '0 mm'}
              </div>
              {selectedData && selectedData.precipitationProbability > 0 && (
                <div className="text-xs text-blue-500">{selectedData.precipitationProbability}% kans</div>
              )}
            </div>
          </div>

          {/* Bar graph */}
          <div className="relative bg-gray-100 rounded-xl p-2 h-28">
            {/* Now indicator text */}
            <div className="absolute top-1 left-2 text-[9px] font-medium text-amber-600">▼ Nu</div>
            <div className="absolute inset-2 pt-3 flex items-end gap-px">
              {forecast48h.map((h, i) => {
                const height = (h.precipitation / maxPrecip) * 100
                const t = new Date(h.time)
                const isSelected = t.getHours() === selectedTime.getHours() && t.getDate() === selectedTime.getDate()
                const isNow = i === 0
                const intensity = h.precipitation > 2 ? 'bg-blue-600' :
                                 h.precipitation > 0.5 ? 'bg-blue-500' :
                                 h.precipitation > 0 ? 'bg-blue-400' : 'bg-gray-200'
                return (
                  <div key={i} className="flex-1 cursor-pointer h-full flex flex-col justify-end" onClick={() => setSelectedTime(t)}>
                    <div className={`w-full rounded-t transition-all ${intensity} ${isSelected ? 'ring-2 ring-amber-400 ring-offset-1' : ''} ${isNow ? 'ring-1 ring-amber-500' : ''}`}
                      style={{ height: `${Math.max(height, h.precipitation > 0 ? 8 : 3)}%` }} />
                  </div>
                )
              })}
            </div>
            <div className="absolute bottom-0.5 left-2 right-2 flex justify-between text-[8px] text-gray-400">
              <span>Nu</span>
              <span>+24u</span>
              <span>+48u</span>
            </div>
          </div>

          {/* Slider with current position indicator */}
          <div className="space-y-1">
            <input
              type="range" min="0" max="100" value={sliderValue}
              onChange={(e) => setSelectedTime(new Date(minTime.getTime() + (parseFloat(e.target.value) / 100) * timeRange))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[9px] text-gray-400">
              <span className={sliderValue < 5 ? 'text-amber-600 font-medium' : ''}>Nu</span>
              <span>{formatDate(selectedTime)} {formatHour(selectedTime)}</span>
              <span>+48u</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400">
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-400" /><span>Licht</span></div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500" /><span>Matig</span></div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-600" /><span>Zwaar</span></div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Moon Modal with slider
function MoonModal({ onClose }: { onClose: () => void }) {
  const [daysOffset, setDaysOffset] = useState(0)

  const selectedDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    return d
  }, [daysOffset])

  const moonPhase = getMoonPhase(selectedDate)

  const formatDate = (days: number) => {
    if (days === 0) return 'Vandaag'
    if (days === 1) return 'Morgen'
    if (days === -1) return 'Gisteren'
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  // Tide type
  const tideType = getTideType(moonPhase)

  return (
    <motion.div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden select-none"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon size={18} className="text-slate-400" />
              <span className="font-semibold text-white">Maanstand</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors border-0 outline-none bg-transparent">
              <X size={16} className="text-slate-400" />
            </button>
          </div>

          {/* Moon display */}
          <div className="flex flex-col items-center py-4">
            <MoonPhase phase={moonPhase} size={120} />
            <div className="mt-4 text-center">
              <div className="text-xl font-semibold text-white">{getMoonPhaseName(moonPhase)}</div>
              <div className="text-slate-400 text-sm">{Math.round(moonPhase * 100)}% verlicht</div>
              <div className={`text-sm font-medium mt-1 ${tideType.color}`}>{tideType.type}</div>
            </div>
          </div>

          {/* Date display */}
          <div className="text-center text-slate-300 text-sm">
            {formatDate(daysOffset)}
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="-14"
              max="14"
              value={daysOffset}
              onChange={(e) => setDaysOffset(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>-14 dagen</span>
              <span>Nu</span>
              <span>+14 dagen</span>
            </div>
          </div>

          {/* Quick buttons */}
          <div className="flex gap-2">
            <button onClick={() => setDaysOffset(0)} className="flex-1 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors border-0 outline-none">Vandaag</button>
            <button onClick={() => {
              // Find next new moon
              for (let i = 1; i <= 30; i++) {
                const d = new Date(); d.setDate(d.getDate() + i)
                const p = getMoonPhase(d)
                if (p < 0.03 || p > 0.97) { setDaysOffset(i); break }
              }
            }} className="flex-1 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors border-0 outline-none">Nieuwe maan</button>
            <button onClick={() => {
              // Find next full moon
              for (let i = 1; i <= 30; i++) {
                const d = new Date(); d.setDate(d.getDate() + i)
                const p = getMoonPhase(d)
                if (p > 0.47 && p < 0.53) { setDaysOffset(i); break }
              }
            }} className="flex-1 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors border-0 outline-none">Volle maan</button>
          </div>

          {/* Info */}
          <div className="text-[10px] text-slate-500 text-center">
            Springtij: nieuwe/volle maan (sterk getij)
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Tide Modal with nice graph
function TideModal({ onClose }: { onClose: () => void }) {
  const [selectedTime, setSelectedTime] = useState(new Date())
  const position = useGPSStore(state => state.position)

  const TIDE_STATIONS = [
    { id: 'HOEKVHLD', name: 'Hoek van Holland', lat: 51.9775, lng: 4.1200 },
    { id: 'IJMDMNTHVN', name: 'IJmuiden', lat: 52.4639, lng: 4.5556 },
    { id: 'DENHDR', name: 'Den Helder', lat: 52.9647, lng: 4.7456 },
    { id: 'HARVLGTHVN', name: 'Harlingen', lat: 53.1747, lng: 5.4083 },
    { id: 'VLISSGN', name: 'Vlissingen', lat: 51.4428, lng: 3.5961 },
    { id: 'SCHEVNGN', name: 'Scheveningen', lat: 52.1033, lng: 4.2664 },
  ]

  const findNearestStation = (lat: number, lng: number) => {
    let nearest = TIDE_STATIONS[5]
    let minDist = Infinity
    for (const station of TIDE_STATIONS) {
      const dist = Math.sqrt(Math.pow(station.lat - lat, 2) + Math.pow(station.lng - lng, 2))
      if (dist < minDist) { minDist = dist; nearest = station }
    }
    return nearest
  }

  const [selectedStation, setSelectedStation] = useState(() =>
    position ? findNearestStation(position.lat, position.lng) : TIDE_STATIONS[5]
  )

  const now = new Date()
  const minTime = useMemo(() => {
    const t = new Date(); t.setDate(t.getDate() - 1); t.setHours(0, 0, 0, 0); return t
  }, [])
  const maxTime = useMemo(() => {
    const t = new Date(); t.setDate(t.getDate() + 2); t.setHours(23, 59, 59, 999); return t
  }, [])

  const tideData = useMemo(() => {
    const startDate = new Date(minTime)
    return calculateTides(startDate, 4)
  }, [minTime])

  const timeRange = maxTime.getTime() - minTime.getTime()
  const sliderValue = ((selectedTime.getTime() - minTime.getTime()) / timeRange) * 100

  const getWaterLevelAtTime = (time: Date): number => {
    if (tideData.length < 2) return 1.0
    let prevTide = tideData[0], nextTide = tideData[1]
    for (let i = 0; i < tideData.length - 1; i++) {
      if (tideData[i].time <= time && tideData[i + 1].time > time) {
        prevTide = tideData[i]; nextTide = tideData[i + 1]; break
      }
    }
    const totalDuration = nextTide.time.getTime() - prevTide.time.getTime()
    const elapsed = time.getTime() - prevTide.time.getTime()
    const progress = Math.max(0, Math.min(1, elapsed / totalDuration))
    const cosineProgress = (1 - Math.cos(progress * Math.PI)) / 2
    return prevTide.height + (nextTide.height - prevTide.height) * cosineProgress
  }

  // Generate curve data points
  const curvePoints = useMemo(() => {
    const points: { x: number; y: number; time: Date }[] = []
    const steps = 200
    for (let i = 0; i <= steps; i++) {
      const time = new Date(minTime.getTime() + (i / steps) * timeRange)
      const level = getWaterLevelAtTime(time)
      points.push({ x: (i / steps) * 100, y: level, time })
    }
    return points
  }, [minTime, timeRange, tideData])

  const minLevel = Math.min(...curvePoints.map(p => p.y))
  const maxLevel = Math.max(...curvePoints.map(p => p.y))
  const levelRange = maxLevel - minLevel || 1

  const formatDate = (date: Date) => {
    const today = new Date(); today.setHours(0,0,0,0)
    const dateDay = new Date(date); dateDay.setHours(0,0,0,0)
    const diff = Math.floor((dateDay.getTime() - today.getTime()) / (24*60*60*1000))
    if (diff === 0) return 'Vandaag'
    if (diff === 1) return 'Morgen'
    if (diff === -1) return 'Gisteren'
    return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' })
  }

  const formatTime = (date: Date) => date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })

  const currentLevel = getWaterLevelAtTime(selectedTime)
  const nowPosition = ((now.getTime() - minTime.getTime()) / timeRange) * 100
  const selectedPosition = ((selectedTime.getTime() - minTime.getTime()) / timeRange) * 100

  return (
    <motion.div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md overflow-hidden select-none"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves size={20} className="text-blue-500" />
              <span className="font-semibold text-gray-800">Getijden</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors border-0 outline-none bg-transparent">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Station selector */}
          <select
            value={selectedStation.id}
            onChange={(e) => {
              const station = TIDE_STATIONS.find(s => s.id === e.target.value)
              if (station) setSelectedStation(station)
            }}
            className="w-full p-2.5 border border-gray-200 rounded-xl text-sm bg-white/80 outline-none focus:ring-2 focus:ring-blue-400"
          >
            {TIDE_STATIONS.map(station => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>

          {/* Tide Graph */}
          <div className="relative bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl p-3 h-32">
            {/* SVG Curve */}
            <svg className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)]" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Water fill */}
              <path
                d={`M 0 100 ${curvePoints.map(p => `L ${p.x} ${100 - ((p.y - minLevel) / levelRange) * 80}`).join(' ')} L 100 100 Z`}
                fill="url(#waterGradient)"
                opacity="0.6"
              />
              {/* Curve line */}
              <path
                d={`M ${curvePoints.map(p => `${p.x} ${100 - ((p.y - minLevel) / levelRange) * 80}`).join(' L ')}`}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
              />
              {/* Now marker */}
              {nowPosition >= 0 && nowPosition <= 100 && (
                <line x1={nowPosition} y1="0" x2={nowPosition} y2="100" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
              )}
              {/* Selected marker */}
              <line x1={selectedPosition} y1="0" x2={selectedPosition} y2="100" stroke="#ef4444" strokeWidth="1.5" />
              <circle cx={selectedPosition} cy={100 - ((currentLevel - minLevel) / levelRange) * 80} r="3" fill="#ef4444" />
              <defs>
                <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#93c5fd" />
                </linearGradient>
              </defs>
            </svg>

            {/* Time labels */}
            <div className="absolute bottom-1 left-3 right-3 flex justify-between text-[9px] text-gray-500">
              <span>{formatDate(minTime)}</span>
              <span>{formatDate(now)}</span>
              <span>{formatDate(maxTime)}</span>
            </div>

            {/* Level display */}
            <div className="absolute top-2 right-3 bg-white/90 rounded-lg px-2 py-1 shadow-sm">
              <div className="text-[10px] text-gray-500">{formatDate(selectedTime)} {formatTime(selectedTime)}</div>
              <div className="text-lg font-bold text-blue-600">{currentLevel.toFixed(2)}m</div>
            </div>
          </div>

          {/* Time slider */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={(e) => {
              const newTime = new Date(minTime.getTime() + (parseFloat(e.target.value) / 100) * timeRange)
              setSelectedTime(newTime)
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />

          {/* Quick buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTime(new Date())}
              className="flex-1 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors border-0 outline-none font-medium"
            >
              Nu
            </button>
            {tideData.filter(t => t.time > now).slice(0, 2).map((tide, i) => (
              <button
                key={i}
                onClick={() => setSelectedTime(tide.time)}
                className={`flex-1 px-2 py-2 text-sm rounded-xl transition-colors border-0 outline-none font-medium ${
                  tide.type === 'high' ? 'bg-green-50 hover:bg-green-100 text-green-600' : 'bg-red-50 hover:bg-red-100 text-red-600'
                }`}
              >
                {tide.type === 'high' ? 'HW' : 'LW'} {formatTime(tide.time)}
              </button>
            ))}
          </div>

          <div className="text-[10px] text-gray-400 text-center">Berekening op basis van maanstand</div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Pressure Modal with fishing activity timeline
function PressureModal({ pressureHistory, currentPressure, trend, onClose }: {
  pressureHistory: { time: string; pressure: number }[];
  currentPressure: number;
  trend: 'rising' | 'falling' | 'stable';
  onClose: () => void;
}) {
  const [selectedHour, setSelectedHour] = useState(12) // Current time marker

  // Get 48 hours of data
  const now = new Date()
  const data48h = pressureHistory.slice(-72) // Get more data for display

  const minPressure = Math.min(...data48h.map(d => d.pressure), 990)
  const maxPressure = Math.max(...data48h.map(d => d.pressure), 1040)
  const range = maxPressure - minPressure || 20

  // Calculate fish activity based on pressure changes
  const getFishActivityForHour = (hourIndex: number): number => {
    if (hourIndex >= data48h.length - 1 || hourIndex < 1) return 0.5
    const pressureChange = data48h[hourIndex].pressure - data48h[hourIndex - 1].pressure
    const currentP = data48h[hourIndex].pressure

    let activity = 0.5

    // Rising pressure is good
    if (pressureChange > 0.5) activity += 0.3
    else if (pressureChange < -0.5) activity -= 0.2

    // Optimal pressure range
    if (currentP >= 1010 && currentP <= 1025) activity += 0.2

    // Stable high pressure is excellent
    if (currentP > 1020 && Math.abs(pressureChange) < 0.3) activity += 0.2

    return Math.max(0, Math.min(1, activity))
  }

  // Find best fishing hours
  const hourActivities = data48h.map((_, i) => ({ hour: i, activity: getFishActivityForHour(i) }))
  const bestHours = [...hourActivities].sort((a, b) => b.activity - a.activity).slice(0, 5)

  const getTrendIcon = () => {
    if (trend === 'rising') return <TrendingUp size={16} className="text-green-500" />
    if (trend === 'falling') return <TrendingDown size={16} className="text-red-500" />
    return <Minus size={16} className="text-gray-400" />
  }

  const getTrendText = () => {
    if (trend === 'rising') return 'Stijgend - Goed voor vissen!'
    if (trend === 'falling') return 'Dalend - Minder activiteit'
    return 'Stabiel'
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
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden select-none"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge size={20} className="text-purple-500" />
              <span className="font-semibold text-gray-800">Luchtdruk</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors border-0 outline-none bg-transparent">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Current pressure */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-600">{Math.round(currentPressure)} hPa</div>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon()}
                  <span className="text-sm text-gray-600">{getTrendText()}</span>
                </div>
              </div>
              <div className="text-right">
                <FishScale value={getFishActivityForHour(data48h.length - 1) * 3} color={
                  getFishActivityForHour(data48h.length - 1) > 0.7 ? 'text-green-500' :
                  getFishActivityForHour(data48h.length - 1) > 0.4 ? 'text-amber-500' : 'text-red-500'
                } />
                <div className="text-[10px] text-gray-500 mt-1">Nu</div>
              </div>
            </div>
          </div>

          {/* Pressure graph with fish activity */}
          <div className="space-y-1">
            <div className="text-[10px] text-gray-500">Druk & visactiviteit (48 uur)</div>
            <div className="relative bg-gray-100 rounded-xl p-2 h-32">
              {/* Pressure curve */}
              <svg className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)]" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Fish activity bars (background) */}
                {data48h.slice(-48).map((_, i) => {
                  const activity = getFishActivityForHour(data48h.length - 48 + i)
                  const x = (i / 47) * 100
                  const height = activity * 30
                  const color = activity > 0.7 ? '#22c55e' : activity > 0.4 ? '#f59e0b' : '#ef4444'
                  return (
                    <rect
                      key={i}
                      x={x - 1}
                      y={100 - height}
                      width={2}
                      height={height}
                      fill={color}
                      opacity="0.3"
                    />
                  )
                })}
                {/* Pressure line */}
                <path
                  d={`M ${data48h.slice(-48).map((d, i) => {
                    const x = (i / 47) * 100
                    const y = 100 - ((d.pressure - minPressure) / range) * 80
                    return `${x} ${y}`
                  }).join(' L ')}`}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                />
                {/* Optimal zone */}
                <rect x="0" y={100 - ((1025 - minPressure) / range) * 80} width="100" height={((1025 - 1010) / range) * 80} fill="#22c55e" opacity="0.1" />
              </svg>

              {/* Labels */}
              <div className="absolute top-1 left-2 text-[9px] text-gray-400">{Math.round(maxPressure)}</div>
              <div className="absolute bottom-4 left-2 text-[9px] text-gray-400">{Math.round(minPressure)}</div>
              <div className="absolute bottom-0.5 left-2 right-2 flex justify-between text-[8px] text-gray-400">
                <span>-48u</span>
                <span>-24u</span>
                <span>Nu</span>
              </div>
            </div>
          </div>

          {/* Best fishing times */}
          <div className="space-y-2">
            <div className="text-[10px] text-gray-500 flex items-center gap-1">
              <FishIcon size={12} className="text-green-500" />
              Beste vistijden (op basis van druk)
            </div>
            <div className="flex flex-wrap gap-1">
              {bestHours.slice(0, 4).map((h, i) => {
                const time = new Date(data48h[h.hour]?.time || now)
                const isToday = time.getDate() === now.getDate()
                return (
                  <div key={i} className="bg-green-50 rounded-lg px-2 py-1 text-xs">
                    <span className="text-green-700 font-medium">
                      {isToday ? 'Vandaag' : 'Morgen'} {time.getHours()}:00
                    </span>
                    <span className="text-green-500 ml-1">
                      {Math.round(h.activity * 100)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-1.5 rounded-sm bg-green-400 opacity-50" />
              <span>Actief</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1.5 rounded-sm bg-amber-400 opacity-50" />
              <span>Matig</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-8 h-3 rounded-sm bg-green-500 opacity-20" />
              <span>Optimale zone</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Rain Radar Modal with animated map
function RainRadarModal({ onClose }: { onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [frameIndex, setFrameIndex] = useState(0)
  const [radarFrames, setRadarFrames] = useState<string[]>([])
  const position = useGPSStore(state => state.position)

  // RainViewer API for radar frames
  useEffect(() => {
    const fetchRadarData = async () => {
      try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json')
        const data = await response.json()
        if (data.radar?.past) {
          const frames = data.radar.past.map((f: { path: string }) =>
            `https://tilecache.rainviewer.com${f.path}/256/{z}/{x}/{y}/2/1_1.png`
          )
          // Add nowcast frames
          if (data.radar?.nowcast) {
            frames.push(...data.radar.nowcast.map((f: { path: string }) =>
              `https://tilecache.rainviewer.com${f.path}/256/{z}/{x}/{y}/2/1_1.png`
            ))
          }
          setRadarFrames(frames)
        }
      } catch (error) {
        console.error('Failed to fetch radar data:', error)
      }
    }
    fetchRadarData()
  }, [])

  // Animation loop
  useEffect(() => {
    if (!isPlaying || radarFrames.length === 0) return
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % radarFrames.length)
    }, 500)
    return () => clearInterval(interval)
  }, [isPlaying, radarFrames.length])

  const lat = position?.lat || 52.1326
  const lng = position?.lng || 5.2913
  const zoom = 7

  // Calculate tile coordinates
  const n = Math.pow(2, zoom)
  const x = Math.floor((lng + 180) / 360 * n)
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n)

  const getCurrentFrame = () => {
    if (radarFrames.length === 0) return null
    return radarFrames[frameIndex]?.replace('{z}', zoom.toString()).replace('{x}', x.toString()).replace('{y}', y.toString())
  }

  const getTimeLabel = () => {
    if (radarFrames.length === 0) return 'Laden...'
    const pastFrames = 12 // Approximate past frames
    const diff = frameIndex - pastFrames
    if (diff < -5) return `-${Math.abs(diff) * 5} min`
    if (diff < 0) return `-${Math.abs(diff) * 5} min`
    if (diff === 0) return 'Nu'
    return `+${diff * 5} min`
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
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden select-none"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudRain size={20} className="text-blue-500" />
              <span className="font-semibold text-gray-800">Buienradar</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors border-0 outline-none bg-transparent">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Radar map */}
          <div className="relative bg-gray-200 rounded-xl overflow-hidden" style={{ aspectRatio: '1/1' }}>
            {/* Base map (OSM) - 3x3 grid for more coverage */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {[-1, 0, 1].map(dy =>
                [-1, 0, 1].map(dx => (
                  <img
                    key={`${dx}-${dy}`}
                    src={`https://tile.openstreetmap.org/${zoom}/${x + dx}/${y + dy}.png`}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ filter: 'saturate(0.3) brightness(1.1)' }}
                  />
                ))
              )}
            </div>

            {/* Radar overlay - 3x3 grid */}
            {getCurrentFrame() && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {[-1, 0, 1].map(dy =>
                  [-1, 0, 1].map(dx => (
                    <img
                      key={`radar-${dx}-${dy}`}
                      src={radarFrames[frameIndex]?.replace('{z}', zoom.toString()).replace('{x}', (x + dx).toString()).replace('{y}', (y + dy).toString())}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  ))
                )}
              </div>
            )}

            {/* Time indicator */}
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-medium">
              {getTimeLabel()}
            </div>

            {/* Location marker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
            </div>
          </div>

          {/* Timeline slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={Math.max(0, radarFrames.length - 1)}
              value={frameIndex}
              onChange={(e) => {
                setIsPlaying(false)
                setFrameIndex(parseInt(e.target.value))
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[9px] text-gray-400">
              <span>-1 uur</span>
              <span>Nu</span>
              <span>+30 min</span>
            </div>
          </div>

          {/* Play controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors border-0 outline-none"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span className="text-sm font-medium">{isPlaying ? 'Pauzeren' : 'Afspelen'}</span>
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
            <span>Licht</span>
            <div className="flex h-2">
              <div className="w-4 bg-blue-200 rounded-l" />
              <div className="w-4 bg-blue-400" />
              <div className="w-4 bg-blue-600" />
              <div className="w-4 bg-purple-600" />
              <div className="w-4 bg-red-500 rounded-r" />
            </div>
            <span>Zwaar</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function FishingWidget() {
  const { current, loading, fetchWeather, getFishingScore, pressureHistory, getPressureTrend, hourlyForecast, precipitation15min } = useWeatherStore()
  const position = useGPSStore(state => state.position)
  const showWeatherWidget = useSettingsStore(state => state.showWeatherWidget)
  const { waterData, station, fetchData: fetchWaterData } = useWaterDataStore()

  const [isExpanded, setIsExpanded] = useState(false)
  const [showTideModal, setShowTideModal] = useState(false)
  const [showPrecipModal, setShowPrecipModal] = useState(false)
  const [showMoonModal, setShowMoonModal] = useState(false)
  const [showPressureModal, setShowPressureModal] = useState(false)
  const [showRadarModal, setShowRadarModal] = useState(false)

  // Fetch weather and water data
  useEffect(() => {
    const loc = position || DEFAULT_LOCATION
    fetchWeather(loc.lat, loc.lng)
    fetchWaterData()
  }, [])

  useEffect(() => {
    if (position) {
      fetchWeather(position.lat, position.lng)
    }
  }, [position, fetchWeather])

  // Auto-refresh
  useEffect(() => {
    const loc = position || DEFAULT_LOCATION
    const interval = setInterval(() => {
      fetchWeather(loc.lat, loc.lng)
      fetchWaterData()
    }, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [position, fetchWeather, fetchWaterData])

  // Moon and activity data
  const now = new Date()
  const moonPhase = getMoonPhase(now)
  const moonActivity = getMoonActivity(now)
  const tideType = getTideType(moonPhase)

  // Tide data for today
  const tideData = useMemo(() => {
    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)
    return calculateTides(startDate, 2)
  }, [])

  const nextTides = tideData.filter(t => t.time > now).slice(0, 4)

  // Combined fishing score
  const weatherScore = getFishingScore ? getFishingScore() : 1
  const combinedScore = Math.min(3, (weatherScore / 2) + (moonActivity.activity * 1.5))

  const getColorForScore = (s: number) => {
    if (s >= 2.5) return 'text-green-500'
    if (s >= 1.5) return 'text-lime-500'
    if (s >= 0.8) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreLabel = (s: number) => {
    if (s >= 2.5) return 'Uitstekend'
    if (s >= 1.5) return 'Goed'
    if (s >= 0.8) return 'Matig'
    return 'Slecht'
  }

  const windDirectionToText = (deg: number) => {
    const directions = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW']
    return directions[Math.round(deg / 45) % 8]
  }

  const formatTime = (date: Date) => date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })

  if (!showWeatherWidget) return null

  return (
    <>
      {/* Backdrop when expanded - click to close */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[1499]"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Widget */}
      <motion.div
        className={`fixed left-2 z-[1500] bg-white shadow-lg border border-gray-200 select-none rounded-xl ${
          isExpanded ? 'top-2 bottom-2 w-[220px] overflow-y-auto' : ''
        }`}
        style={!isExpanded ? { top: 'calc(max(0.5rem, env(safe-area-inset-top, 0.5rem)) + 52px)' } : undefined}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        layout
      >
        {loading && !current ? (
          <div className="p-3 flex items-center gap-2">
            <RefreshCw size={16} className="animate-spin text-blue-500" />
            <span className="text-sm text-gray-500">Laden...</span>
          </div>
        ) : current ? (
          <div className="p-2.5">
            {/* Collapsed view - always visible as header */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full border-0 outline-none bg-transparent p-0"
            >
              <div className="flex items-center gap-3">
                {/* Weather + temp */}
                <div className="flex items-center gap-2">
                  <WeatherIcon code={current.weatherCode} size={24} />
                  <div className="flex flex-col leading-tight">
                    <span className="text-lg font-bold text-gray-800">
                      {Math.round(current.temperature)}°
                    </span>
                  </div>
                </div>

                {/* Wind */}
                <div className="flex items-center gap-1">
                  <Wind size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{Math.round(current.windSpeed)}</span>
                  <WindArrow degrees={current.windDirection} size={12} />
                </div>

                {/* Expand */}
                <div className="ml-auto">
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Fish score bar */}
              <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-gray-200/50">
                <FishScale value={combinedScore} color={getColorForScore(combinedScore)} />
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      combinedScore >= 2.5 ? 'bg-green-500' :
                      combinedScore >= 1.5 ? 'bg-lime-500' :
                      combinedScore >= 0.8 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max((combinedScore / 3) * 100, 5)}%` }}
                  />
                </div>
                <span className={`text-[10px] font-medium ${getColorForScore(combinedScore)}`}>
                  {getScoreLabel(combinedScore)}
                </span>
              </div>
            </button>

            {/* Expanded view */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                <div className="pt-3 mt-2 border-t border-gray-200/50 space-y-3">
                  {/* Weather description */}
                  <div className="text-xs text-gray-600">
                    {weatherCodeDescriptions[current.weatherCode] || 'Onbekend'}
                  </div>

                  {/* Moon phase section - clickable */}
                  <button
                    onClick={() => setShowMoonModal(true)}
                    className="w-full bg-slate-800 hover:bg-slate-700 rounded-lg p-3 flex items-center gap-3 border-0 outline-none cursor-pointer transition-colors"
                  >
                    <MoonPhase phase={moonPhase} size={36} />
                    <div className="flex-1 text-left">
                      <div className="text-white text-sm font-medium">{getMoonPhaseName(moonPhase)}</div>
                      <div className="text-slate-400 text-[10px]">{Math.round(moonPhase * 100)}% verlicht</div>
                      <div className={`text-[10px] font-medium ${tideType.color}`}>{tideType.type}</div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>

                  {/* Activity bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500">Maanactiviteit</span>
                      <span className="text-gray-600">{Math.round(moonActivity.activity * 100)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          moonActivity.activity >= 0.7 ? 'bg-green-500' :
                          moonActivity.activity >= 0.5 ? 'bg-lime-500' :
                          moonActivity.activity >= 0.3 ? 'bg-amber-500' : 'bg-red-400'
                        }`}
                        style={{ width: `${moonActivity.activity * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Water data with station picker */}
                  <div className="space-y-2">
                    {/* Station picker inline */}
                    <div className="flex items-center gap-2">
                      <Droplets size={14} className="text-cyan-500" />
                      <select
                        value={station?.id || ''}
                        onChange={(e) => {
                          e.stopPropagation()
                          const newStation = RWS_STATIONS.find(s => s.id === e.target.value)
                          if (newStation) {
                            const { setStation, fetchData } = useWaterDataStore.getState()
                            setStation(newStation)
                            // Fetch new data for the selected station
                            setTimeout(() => fetchData(), 50)
                          }
                        }}
                        className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white/80 outline-none focus:ring-1 focus:ring-cyan-400"
                      >
                        {RWS_STATIONS.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Water data grid - all 4 items (display only) */}
                    <div className="grid grid-cols-2 gap-2">
                      {waterData?.temperature !== undefined && (
                        <div className="bg-cyan-50 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Thermometer size={12} className="text-cyan-500" />
                            <span>Water</span>
                          </div>
                          <div className="text-sm font-bold text-cyan-600">
                            {waterData.temperature.toFixed(1)}°C
                          </div>
                        </div>
                      )}
                      {waterData?.waveHeight !== undefined && (
                        <div className="bg-blue-50 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Waves size={12} className="text-blue-500" />
                            <span>Golven</span>
                          </div>
                          <div className="text-sm font-bold text-blue-600">
                            {waterData.waveHeight} cm
                          </div>
                        </div>
                      )}
                      {waterData?.currentSpeed !== undefined && (
                        <div className="bg-green-50 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Navigation size={12} className="text-green-500" />
                            <span>Stroming</span>
                          </div>
                          <div className="text-sm font-bold text-green-600">
                            {waterData.currentSpeed} cm/s
                          </div>
                        </div>
                      )}
                      {waterData?.currentDirection !== undefined && (
                        <div className="bg-purple-50 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Navigation size={12} className="text-purple-500" style={{ transform: `rotate(${waterData.currentDirection}deg)` }} />
                            <span>Richting</span>
                          </div>
                          <div className="text-sm font-bold text-purple-600">
                            {Math.round(waterData.currentDirection)}°
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Weather details - pressure clickable */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Wind size={12} className="text-gray-400" />
                      <span>{Math.round(current.windSpeed)} km/u {windDirectionToText(current.windDirection)}</span>
                    </div>
                    <button
                      onClick={() => setShowPressureModal(true)}
                      className="flex items-center gap-1.5 text-gray-600 hover:bg-purple-50 rounded-lg p-1 -m-1 transition-colors border-0 bg-transparent cursor-pointer"
                    >
                      <Gauge size={12} className="text-purple-500" />
                      <span>{Math.round(current.pressure)} hPa</span>
                      {(() => {
                        const trend = getPressureTrend()
                        if (trend === 'rising') return <TrendingUp size={12} className="text-green-500" />
                        if (trend === 'falling') return <TrendingDown size={12} className="text-red-500" />
                        return <Minus size={12} className="text-gray-400" />
                      })()}
                      <ChevronRight size={10} className="text-gray-400 ml-auto" />
                    </button>
                  </div>

                  {/* Rain radar button */}
                  <button
                    onClick={() => setShowRadarModal(true)}
                    className="w-full flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border-0 cursor-pointer"
                  >
                    <CloudRain size={16} className="text-blue-500" />
                    <span className="text-sm text-blue-700 font-medium">Buienradar</span>
                    <span className="text-xs text-blue-500 ml-auto">Live kaart</span>
                    <ChevronRight size={14} className="text-blue-400" />
                  </button>

                  {/* Precipitation graph - clickable */}
                  {precipitation15min.length > 0 && (
                    <button
                      onClick={() => setShowPrecipModal(true)}
                      className="w-full border-0 bg-transparent p-0 cursor-pointer text-left"
                    >
                      <div className="hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Neerslag komende 2 uur</span>
                          <ChevronRight size={12} className="text-gray-400" />
                        </div>
                        <PrecipitationGraph data={precipitation15min} />
                      </div>
                    </button>
                  )}

                  {/* Hourly forecast */}
                  {hourlyForecast.length > 0 && (
                    <HourlyForecast hourly={hourlyForecast} />
                  )}

                  {/* Next tides - clickable */}
                  {nextTides.length > 0 && (
                    <button
                      onClick={() => setShowTideModal(true)}
                      className="w-full border-0 bg-transparent p-0 cursor-pointer text-left"
                    >
                      <div className="space-y-1 hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors">
                        <div className="text-[10px] text-gray-500 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Waves size={12} />
                            <span>Volgende getijden</span>
                          </div>
                          <ChevronRight size={12} className="text-gray-400" />
                        </div>
                        <div className="flex gap-1">
                          {nextTides.map((tide, i) => (
                            <div
                              key={i}
                              className={`flex-1 p-1.5 rounded text-center ${
                                tide.type === 'high' ? 'bg-green-50' : 'bg-red-50'
                              }`}
                            >
                              <div className={`text-[9px] font-medium ${
                                tide.type === 'high' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {tide.type === 'high' ? 'HW' : 'LW'}
                              </div>
                              <div className="text-[10px] font-medium">{formatTime(tide.time)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Water station info */}
                  {station && (
                    <div className="text-[9px] text-gray-400 text-center">
                      Waterdata: {station.name}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <button
          onClick={() => {
            const loc = position || DEFAULT_LOCATION
            fetchWeather(loc.lat, loc.lng)
          }}
          className="p-3 flex items-center gap-2 border-0 outline-none bg-transparent"
        >
          <Cloud size={18} className="text-gray-400" />
          <span className="text-sm text-gray-500">Weer laden</span>
        </button>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showTideModal && (
          <TideModal onClose={() => setShowTideModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrecipModal && hourlyForecast.length > 0 && (
          <PrecipitationModal hourlyData={hourlyForecast} onClose={() => setShowPrecipModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMoonModal && (
          <MoonModal onClose={() => setShowMoonModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPressureModal && current && (
          <PressureModal
            pressureHistory={pressureHistory}
            currentPressure={current.pressure}
            trend={getPressureTrend()}
            onClose={() => setShowPressureModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRadarModal && (
          <RainRadarModal onClose={() => setShowRadarModal(false)} />
        )}
      </AnimatePresence>
    </motion.div>
    </>
  )
}
