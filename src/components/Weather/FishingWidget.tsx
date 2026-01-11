import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind,
  Thermometer, Droplets, ChevronDown, ChevronUp, RefreshCw,
  Navigation, Waves, Moon, BarChart3, TrendingUp, TrendingDown, Minus, X, ChevronRight
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

// Extended Precipitation Modal with 48-hour forecast
function PrecipitationModal({ hourlyData, onClose }: { hourlyData: { time: string; precipitation: number; precipitationProbability: number }[]; onClose: () => void }) {
  const [selectedTime, setSelectedTime] = useState(new Date())

  const now = new Date()
  const minTime = new Date(now)
  minTime.setHours(now.getHours(), 0, 0, 0)
  const maxTime = new Date(minTime)
  maxTime.setHours(maxTime.getHours() + 48)

  const timeRange = maxTime.getTime() - minTime.getTime()
  const sliderValue = ((selectedTime.getTime() - minTime.getTime()) / timeRange) * 100

  // Filter hourly data for next 48 hours
  const forecast48h = hourlyData.filter(h => {
    const t = new Date(h.time)
    return t >= minTime && t <= maxTime
  })

  const handleSliderChange = (value: number) => {
    const newTime = new Date(minTime.getTime() + (value / 100) * timeRange)
    setSelectedTime(newTime)
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateDay = new Date(date)
    dateDay.setHours(0, 0, 0, 0)
    const diff = Math.floor((dateDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

    if (diff === 0) return 'Vandaag'
    if (diff === 1) return 'Morgen'
    return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' })
  }

  const formatHour = (date: Date) => `${date.getHours().toString().padStart(2, '0')}:00`

  // Find data at selected time
  const selectedData = forecast48h.find(h => {
    const t = new Date(h.time)
    return t.getHours() === selectedTime.getHours() &&
           t.getDate() === selectedTime.getDate()
  })

  // Graph dimensions
  const graphWidth = 320
  const graphHeight = 100
  const barWidth = graphWidth / forecast48h.length

  const maxPrecip = Math.max(...forecast48h.map(h => h.precipitation), 1)

  return (
    <motion.div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex items-center gap-2">
            <CloudRain size={20} className="text-white" />
            <span className="font-semibold text-white">Neerslag 48 uur</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors border-0 outline-none bg-transparent">
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Selected time info */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{formatDate(selectedTime)}</div>
                <div className="text-2xl font-bold text-blue-600">{formatHour(selectedTime)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Neerslag</div>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedData ? `${selectedData.precipitation.toFixed(1)} mm` : '-'}
                </div>
                {selectedData && selectedData.precipitationProbability > 0 && (
                  <div className="text-xs text-blue-500">{selectedData.precipitationProbability}% kans</div>
                )}
              </div>
            </div>
          </div>

          {/* 48-hour bar graph */}
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Neerslagverwachting</div>
            <div className="relative bg-gray-100 rounded-lg p-2" style={{ height: graphHeight + 30 }}>
              {/* Day separators */}
              <div className="absolute inset-x-2 top-2 bottom-8 flex">
                {forecast48h.map((h, i) => {
                  const t = new Date(h.time)
                  const showDayLine = t.getHours() === 0 && i > 0
                  return showDayLine ? (
                    <div key={i} className="absolute border-l border-gray-300" style={{ left: `${(i / forecast48h.length) * 100}%`, top: 0, bottom: 0 }}>
                      <span className="absolute -top-0 left-1 text-[8px] text-gray-400">
                        {formatDate(t)}
                      </span>
                    </div>
                  ) : null
                })}
              </div>

              {/* Bars */}
              <div className="absolute inset-x-2 top-4 bottom-8 flex items-end">
                {forecast48h.map((h, i) => {
                  const height = (h.precipitation / maxPrecip) * 100
                  const t = new Date(h.time)
                  const isSelected = t.getHours() === selectedTime.getHours() && t.getDate() === selectedTime.getDate()
                  const intensity = h.precipitation > 2 ? 'bg-blue-600' :
                                   h.precipitation > 0.5 ? 'bg-blue-500' :
                                   h.precipitation > 0 ? 'bg-blue-400' : 'bg-gray-200'
                  return (
                    <div
                      key={i}
                      className="flex-1 mx-px cursor-pointer"
                      onClick={() => setSelectedTime(t)}
                    >
                      <div
                        className={`w-full rounded-t transition-all ${intensity} ${isSelected ? 'ring-2 ring-amber-400' : ''}`}
                        style={{ height: `${Math.max(height, h.precipitation > 0 ? 5 : 2)}%` }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Time labels */}
              <div className="absolute bottom-1 left-2 right-2 flex justify-between text-[9px] text-gray-400">
                <span>Nu</span>
                <span>+12u</span>
                <span>+24u</span>
                <span>+36u</span>
                <span>+48u</span>
              </div>

              {/* Now marker */}
              <div className="absolute top-4 bottom-8 left-2 w-0.5 bg-amber-500" />
            </div>
          </div>

          {/* Time slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatDate(minTime)} {formatHour(minTime)}</span>
              <span>{formatDate(maxTime)} {formatHour(maxTime)}</span>
            </div>
          </div>

          {/* Quick navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTime(new Date())}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border-0 outline-none"
            >
              Nu
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                tomorrow.setHours(8, 0, 0, 0)
                setSelectedTime(tomorrow)
              }}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border-0 outline-none"
            >
              Morgen 8:00
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-blue-400" />
              <span>Licht</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span>Matig</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-blue-600" />
              <span>Zwaar</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Tide Modal (using existing TideWidget logic)
function TideModal({ onClose }: { onClose: () => void }) {
  const [selectedTime, setSelectedTime] = useState(new Date())
  const position = useGPSStore(state => state.position)

  // Tide stations
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
      if (dist < minDist) {
        minDist = dist
        nearest = station
      }
    }
    return nearest
  }

  const [selectedStation, setSelectedStation] = useState(() =>
    position ? findNearestStation(position.lat, position.lng) : TIDE_STATIONS[5]
  )

  // Calculate tides for 5 days
  const tideData = useMemo(() => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 2)
    startDate.setHours(0, 0, 0, 0)
    return calculateTides(startDate, 5)
  }, [])

  const now = new Date()
  const minTime = new Date()
  minTime.setDate(minTime.getDate() - 2)
  minTime.setHours(0, 0, 0, 0)
  const maxTime = new Date()
  maxTime.setDate(maxTime.getDate() + 2)
  maxTime.setHours(23, 59, 59, 999)

  const timeRange = maxTime.getTime() - minTime.getTime()
  const sliderValue = ((selectedTime.getTime() - minTime.getTime()) / timeRange) * 100

  const getWaterLevelAtTime = (time: Date): number => {
    if (tideData.length < 2) return 1.0
    let prevTide = tideData[0]
    let nextTide = tideData[1]
    for (let i = 0; i < tideData.length - 1; i++) {
      if (tideData[i].time <= time && tideData[i + 1].time > time) {
        prevTide = tideData[i]
        nextTide = tideData[i + 1]
        break
      }
    }
    const totalDuration = nextTide.time.getTime() - prevTide.time.getTime()
    const elapsed = time.getTime() - prevTide.time.getTime()
    const progress = Math.max(0, Math.min(1, elapsed / totalDuration))
    const cosineProgress = (1 - Math.cos(progress * Math.PI)) / 2
    return prevTide.height + (nextTide.height - prevTide.height) * cosineProgress
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const diff = Math.floor((date.getTime() - today.setHours(0,0,0,0)) / (24*60*60*1000))
    if (diff === 0) return 'Vandaag'
    if (diff === 1) return 'Morgen'
    if (diff === -1) return 'Gisteren'
    return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' })
  }

  const formatTime = (date: Date) => date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex items-center gap-2">
            <Waves size={20} className="text-white" />
            <span className="font-semibold text-white">Getijden</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors border-0 outline-none bg-transparent">
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <select
            value={selectedStation.id}
            onChange={(e) => {
              const station = TIDE_STATIONS.find(s => s.id === e.target.value)
              if (station) setSelectedStation(station)
            }}
            className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            {TIDE_STATIONS.map(station => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>

          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{formatDate(selectedTime)}</div>
                <div className="text-2xl font-bold text-blue-600">{formatTime(selectedTime)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Waterstand</div>
                <div className="text-2xl font-bold text-blue-600">
                  {getWaterLevelAtTime(selectedTime).toFixed(2)}m
                </div>
              </div>
            </div>
          </div>

          {/* Time slider */}
          <div className="space-y-2">
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
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatDate(minTime)}</span>
              <button onClick={() => setSelectedTime(new Date())} className="text-blue-500 font-medium border-0 bg-transparent">Nu</button>
              <span>{formatDate(maxTime)}</span>
            </div>
          </div>

          {/* Next tides */}
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs text-gray-500 mb-2">Volgende getijden</div>
            <div className="grid grid-cols-4 gap-2">
              {tideData.filter(t => t.time > now).slice(0, 4).map((tide, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTime(tide.time)}
                  className={`p-2 rounded-lg text-center transition-colors border-0 outline-none ${
                    tide.type === 'high' ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'
                  }`}
                >
                  <div className={`text-[10px] font-medium ${tide.type === 'high' ? 'text-green-600' : 'text-red-600'}`}>
                    {tide.type === 'high' ? 'HW' : 'LW'}
                  </div>
                  <div className="text-xs font-medium">{formatTime(tide.time)}</div>
                  <div className="text-[10px] text-gray-500">{tide.height.toFixed(1)}m</div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-400 text-center">
            Berekening gebaseerd op maanstand - Alleen ter indicatie
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Water Data Modal
function WaterDataModal({ onClose }: { onClose: () => void }) {
  const { waterData, station, fetchData, setStation, isLoading } = useWaterDataStore()
  const { RWS_STATIONS } = require('../../services/rwsService')

  const getTempColor = (temp: number) => {
    if (temp < 8) return 'text-blue-600'
    if (temp < 14) return 'text-cyan-500'
    if (temp < 18) return 'text-green-500'
    return 'text-orange-500'
  }

  const getWaveLabel = (height: number) => {
    if (height < 30) return 'Kalm'
    if (height < 60) return 'Licht'
    if (height < 100) return 'Matig'
    if (height < 150) return 'Ruw'
    return 'Hoog'
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
        className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500">
          <div className="flex items-center gap-2">
            <Droplets size={20} className="text-white" />
            <span className="font-semibold text-white">Waterdata</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchData()} className="p-1 hover:bg-white/20 rounded-lg transition-colors border-0 outline-none bg-transparent" disabled={isLoading}>
              <RefreshCw size={18} className={`text-white ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors border-0 outline-none bg-transparent">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <select
            value={station?.id || ''}
            onChange={(e) => {
              const newStation = RWS_STATIONS.find((s: any) => s.id === e.target.value)
              if (newStation) setStation(newStation)
            }}
            className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            {RWS_STATIONS.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer size={18} className="text-cyan-500" />
                <span className="text-xs text-gray-500">Watertemperatuur</span>
              </div>
              {waterData?.temperature !== undefined ? (
                <>
                  <div className={`text-2xl font-bold ${getTempColor(waterData.temperature)}`}>
                    {waterData.temperature.toFixed(1)}°C
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {waterData.temperature < 10 ? 'Koud - minder activiteit' :
                     waterData.temperature < 15 ? 'Goed voor roofvis' : 'Warm - actieve vis'}
                  </div>
                </>
              ) : <div className="text-gray-400">-</div>}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Waves size={18} className="text-blue-500" />
                <span className="text-xs text-gray-500">Golfhoogte</span>
              </div>
              {waterData?.waveHeight !== undefined ? (
                <>
                  <div className="text-2xl font-bold text-blue-600">{waterData.waveHeight} cm</div>
                  <div className="text-[10px] text-gray-400 mt-1">{getWaveLabel(waterData.waveHeight)}</div>
                </>
              ) : <div className="text-gray-400">-</div>}
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Navigation size={18} className="text-green-500" />
                <span className="text-xs text-gray-500">Stroomsnelheid</span>
              </div>
              {waterData?.currentSpeed !== undefined ? (
                <>
                  <div className="text-2xl font-bold text-green-600">{waterData.currentSpeed} cm/s</div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {waterData.currentSpeed < 20 ? 'Zwak' : waterData.currentSpeed < 50 ? 'Matig' : 'Sterk'}
                  </div>
                </>
              ) : <div className="text-gray-400">-</div>}
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Navigation size={18} className="text-purple-500" />
                <span className="text-xs text-gray-500">Stroomrichting</span>
              </div>
              {waterData?.currentDirection !== undefined ? (
                <div className="flex items-center gap-2">
                  <div style={{ transform: `rotate(${waterData.currentDirection}deg)` }}>
                    <Navigation size={24} className="text-purple-500" fill="currentColor" />
                  </div>
                  <div className="text-lg font-bold text-purple-600">{Math.round(waterData.currentDirection)}°</div>
                </div>
              ) : <div className="text-gray-400">-</div>}
            </div>
          </div>

          <div className="text-xs text-gray-400 text-center">Bron: Rijkswaterstaat</div>
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
  const [showWaterModal, setShowWaterModal] = useState(false)
  const [showPrecipModal, setShowPrecipModal] = useState(false)

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

                  {/* Water data - clickable */}
                  {waterData && (
                    <button
                      onClick={() => setShowWaterModal(true)}
                      className="w-full grid grid-cols-2 gap-2 border-0 bg-transparent p-0 cursor-pointer"
                    >
                      {waterData.temperature !== undefined && (
                        <div className="bg-cyan-50 rounded-lg p-2 hover:bg-cyan-100 transition-colors">
                          <div className="flex items-center justify-between text-[10px] text-gray-500">
                            <div className="flex items-center gap-1">
                              <Thermometer size={12} className="text-cyan-500" />
                              <span>Water</span>
                            </div>
                            <ChevronRight size={10} className="text-gray-400" />
                          </div>
                          <div className="text-sm font-bold text-cyan-600 text-left">
                            {waterData.temperature.toFixed(1)}°C
                          </div>
                        </div>
                      )}
                      {waterData.waveHeight !== undefined && (
                        <div className="bg-blue-50 rounded-lg p-2 hover:bg-blue-100 transition-colors">
                          <div className="flex items-center justify-between text-[10px] text-gray-500">
                            <div className="flex items-center gap-1">
                              <Waves size={12} className="text-blue-500" />
                              <span>Golven</span>
                            </div>
                            <ChevronRight size={10} className="text-gray-400" />
                          </div>
                          <div className="text-sm font-bold text-blue-600 text-left">
                            {waterData.waveHeight} cm
                          </div>
                        </div>
                      )}
                    </button>
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
        {showWaterModal && (
          <WaterDataModal onClose={() => setShowWaterModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrecipModal && hourlyForecast.length > 0 && (
          <PrecipitationModal hourlyData={hourlyForecast} onClose={() => setShowPrecipModal(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
