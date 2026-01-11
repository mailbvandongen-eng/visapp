import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind,
  Thermometer, Droplets, ChevronDown, ChevronUp, RefreshCw,
  Navigation, Waves, Moon, BarChart3, TrendingUp, TrendingDown, Minus
} from 'lucide-react'
import { useWeatherStore, useGPSStore, useSettingsStore } from '../../store'
import { useWaterDataStore } from '../../store/waterDataStore'

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

// Fish bone icon
function FishBone({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
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

// Fish icon with optional clipping
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
        <path d="M6.5 12c0-3.5 3-6 7-6 2.5 0 4.5 1 6 2.5.8.8 1.5 1.8 2 3-.5 1.2-1.2 2.2-2 3-1.5 1.5-3.5 2.5-6 2.5-4 0-7-2.5-7-5z" />
        <path d="M2.5 12l3-3v6l-3-3z" />
        <circle cx="17" cy="11" r="1" fill="white" />
      </g>
    </svg>
  )
}

// Fish scale (0-3 fish)
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
      {fishArray.length > 0 ? fishArray : <FishBone size={16} className={color} />}
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

// Realistic moon phase component
function MoonPhase({ phase, size = 20 }: { phase: number; size?: number }) {
  const shadowOffset = phase < 0.5 ? (0.5 - phase) * 2 : (phase - 0.5) * 2
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
      <div
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle at 30% 30%, transparent 0%, rgba(139,119,101,0.3) 100%)`
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: isWaxing
            ? `linear-gradient(to left, transparent ${(1 - shadowOffset) * 100}%, rgba(20,20,30,0.95) ${(1 - shadowOffset) * 100 + 15}%)`
            : `linear-gradient(to right, transparent ${(1 - shadowOffset) * 100}%, rgba(20,20,30,0.95) ${(1 - shadowOffset) * 100 + 15}%)`,
        }}
      />
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
function PrecipitationGraph({ data }: { data: { time: string; precipitation: number }[] }) {
  if (!data || data.length === 0) return null

  const maxPrecip = Math.max(...data.map(d => d.precipitation), 0.5)
  const hasRain = data.some(d => d.precipitation > 0)

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500">Neerslag komende 2 uur</span>
        {!hasRain && (
          <span className="text-[10px] text-green-600 font-medium">Droog</span>
        )}
      </div>

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

export function FishingWidget() {
  const { current, loading, fetchWeather, getFishingScore, pressureHistory, getPressureTrend, hourlyForecast, precipitation15min } = useWeatherStore()
  const position = useGPSStore(state => state.position)
  const showWeatherWidget = useSettingsStore(state => state.showWeatherWidget)
  const { waterData, station, fetchData: fetchWaterData } = useWaterDataStore()

  const [isExpanded, setIsExpanded] = useState(false)

  const safeTopStyle = { top: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))' }

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

  const getBgForScore = (s: number) => {
    if (s >= 2.5) return 'bg-green-50 border-green-200'
    if (s >= 1.5) return 'bg-lime-50 border-lime-200'
    if (s >= 0.8) return 'bg-amber-50 border-amber-200'
    return 'bg-red-50 border-red-200'
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
    <motion.div
      className={`fixed left-2 z-[700] backdrop-blur-sm rounded-xl shadow-sm border transition-all ${getBgForScore(combinedScore)}`}
      style={safeTopStyle}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {loading && !current ? (
        <div className="p-3 flex items-center gap-2">
          <RefreshCw size={16} className="animate-spin text-blue-500" />
          <span className="text-sm text-gray-500">Laden...</span>
        </div>
      ) : current ? (
        <div className="p-2.5 min-w-[160px]">
          {/* Collapsed view */}
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

                  {/* Moon phase section */}
                  <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-3">
                    <MoonPhase phase={moonPhase} size={36} />
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{getMoonPhaseName(moonPhase)}</div>
                      <div className="text-slate-400 text-[10px]">{Math.round(moonPhase * 100)}% verlicht</div>
                      <div className={`text-[10px] font-medium ${tideType.color}`}>{tideType.type}</div>
                    </div>
                  </div>

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

                  {/* Water data */}
                  {waterData && (
                    <div className="grid grid-cols-2 gap-2">
                      {waterData.temperature !== undefined && (
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
                      {waterData.waveHeight !== undefined && (
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
                    </div>
                  )}

                  {/* Weather details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Wind size={12} className="text-gray-400" />
                      <span>{Math.round(current.windSpeed)} km/u {windDirectionToText(current.windDirection)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <BarChart3 size={12} className="text-gray-400" />
                      <span>{Math.round(current.pressure)} hPa</span>
                      {(() => {
                        const trend = getPressureTrend()
                        if (trend === 'rising') return <TrendingUp size={12} className="text-green-500" />
                        if (trend === 'falling') return <TrendingDown size={12} className="text-red-500" />
                        return <Minus size={12} className="text-gray-400" />
                      })()}
                    </div>
                  </div>

                  {/* Precipitation graph */}
                  {precipitation15min.length > 0 && (
                    <PrecipitationGraph data={precipitation15min} />
                  )}

                  {/* Hourly forecast */}
                  {hourlyForecast.length > 0 && (
                    <HourlyForecast hourly={hourlyForecast} />
                  )}

                  {/* Next tides */}
                  {nextTides.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Waves size={12} />
                        <span>Volgende getijden</span>
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
    </motion.div>
  )
}
