import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Waves, X, ChevronLeft, ChevronRight, MapPin, Calendar, Sunrise, Sunset } from 'lucide-react'
import { useGPSStore, useSettingsStore } from '../../store'

interface TideData {
  time: Date
  height: number
  type: 'high' | 'low'
}

interface TideStation {
  id: string
  name: string
  lat: number
  lng: number
}

// Dutch tide stations (Rijkswaterstaat)
const TIDE_STATIONS: TideStation[] = [
  { id: 'HOEKVHLD', name: 'Hoek van Holland', lat: 51.9775, lng: 4.1200 },
  { id: 'IJMDMNTHVN', name: 'IJmuiden', lat: 52.4639, lng: 4.5556 },
  { id: 'DENHDR', name: 'Den Helder', lat: 52.9647, lng: 4.7456 },
  { id: 'HARVLGTHVN', name: 'Harlingen', lat: 53.1747, lng: 5.4083 },
  { id: 'VLISSGN', name: 'Vlissingen', lat: 51.4428, lng: 3.5961 },
  { id: 'SCHEVNGN', name: 'Scheveningen', lat: 52.1033, lng: 4.2664 },
  { id: 'TEXEL', name: 'Texel', lat: 53.0044, lng: 4.7819 },
  { id: 'TERNEUZN', name: 'Terneuzen', lat: 51.3356, lng: 3.8283 },
]

// Calculate sun times for a given date and location
function getSunTimes(date: Date, lat: number, lng: number): { sunrise: Date; sunset: Date } {
  // Simplified sunrise/sunset calculation
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
  const declination = -23.45 * Math.cos((360 / 365) * (dayOfYear + 10) * Math.PI / 180)
  const latRad = lat * Math.PI / 180
  const declRad = declination * Math.PI / 180

  const hourAngle = Math.acos(-Math.tan(latRad) * Math.tan(declRad)) * 180 / Math.PI
  const solarNoon = 12 - lng / 15 + 1 // +1 for CET

  const sunriseHour = solarNoon - hourAngle / 15
  const sunsetHour = solarNoon + hourAngle / 15

  const sunrise = new Date(date)
  sunrise.setHours(Math.floor(sunriseHour), Math.floor((sunriseHour % 1) * 60), 0, 0)

  const sunset = new Date(date)
  sunset.setHours(Math.floor(sunsetHour), Math.floor((sunsetHour % 1) * 60), 0, 0)

  return { sunrise, sunset }
}

// Calculate approximate tides for a given date
function calculateTidesForDay(date: Date, station: TideStation): TideData[] {
  const tides: TideData[] = []
  const synodic = 29.53058867
  const known = new Date('2000-01-06T18:14:00Z')
  const stationOffset = (station.lng / 15) * 60
  const tidalPeriod = 12 * 60 + 25 // minutes between high tides

  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)

  const diff = (dayStart.getTime() - known.getTime()) / (1000 * 60 * 60 * 24)
  const moonPhase = (diff % synodic) / synodic

  // First high tide of the day
  let firstHighTide = (moonPhase * tidalPeriod * 2) % (24 * 60)
  firstHighTide = (firstHighTide + stationOffset) % (24 * 60)

  // Ensure first tide is early enough in the day
  if (firstHighTide > 6 * 60) {
    firstHighTide -= tidalPeriod / 2
  }

  // Generate 5 tides to cover full day plus margins
  for (let i = -1; i < 5; i++) {
    const isHigh = i % 2 === 0
    const minuteOffset = i * (tidalPeriod / 2)
    let totalMinutes = firstHighTide + minuteOffset

    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.floor(totalMinutes % 60)

    const tideTime = new Date(dayStart)
    tideTime.setHours(hours, minutes, 0, 0)

    // Spring/neap tide variation
    const moonFactor = Math.abs(Math.sin(moonPhase * Math.PI * 2))
    const baseHeight = isHigh ? 1.8 : 0.4
    const variation = moonFactor * 0.5

    tides.push({
      time: tideTime,
      height: isHigh ? baseHeight + variation : baseHeight - variation * 0.5,
      type: isHigh ? 'high' : 'low'
    })
  }

  return tides.sort((a, b) => a.time.getTime() - b.time.getTime())
}

// Find nearest station to position
function findNearestStation(lat: number, lng: number): TideStation {
  let nearest = TIDE_STATIONS[5] // Default Scheveningen
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

// Generate water level for any given time (interpolated)
function getWaterLevelAtTime(time: Date, tides: TideData[]): number {
  if (tides.length < 2) return 1.0

  let prevTide = tides[0]
  let nextTide = tides[1]

  for (let i = 0; i < tides.length - 1; i++) {
    if (tides[i].time <= time && tides[i + 1].time > time) {
      prevTide = tides[i]
      nextTide = tides[i + 1]
      break
    }
  }

  const totalDuration = nextTide.time.getTime() - prevTide.time.getTime()
  const elapsed = time.getTime() - prevTide.time.getTime()
  const progress = Math.max(0, Math.min(1, elapsed / totalDuration))
  const cosineProgress = (1 - Math.cos(progress * Math.PI)) / 2

  return prevTide.height + (nextTide.height - prevTide.height) * cosineProgress
}

interface TideWidgetProps {
  embedded?: boolean
}

export function TideWidget({ embedded = false }: TideWidgetProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedStation, setSelectedStation] = useState<TideStation>(TIDE_STATIONS[5])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showStationPicker, setShowStationPicker] = useState(false)
  const position = useGPSStore(state => state.position)
  const showTideWidget = useSettingsStore(state => state.showTideWidget)

  // Update station based on GPS position
  useEffect(() => {
    if (position) {
      setSelectedStation(findNearestStation(position.lat, position.lng))
    }
  }, [position])

  // Calculate tides for selected date
  const tideData = useMemo(() => {
    return calculateTidesForDay(selectedDate, selectedStation)
  }, [selectedDate, selectedStation])

  // Sun times
  const sunTimes = useMemo(() => {
    return getSunTimes(selectedDate, selectedStation.lat, selectedStation.lng)
  }, [selectedDate, selectedStation])

  if (!showTideWidget && !embedded) return null

  const now = new Date()
  const currentLevel = getWaterLevelAtTime(now, tideData)

  // Next tide
  const nextTide = tideData.find(t => t.time > now)

  const goToPrevDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const formatDateShort = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)
    const diff = Math.floor((compareDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

    if (diff === 0) return 'Vandaag'
    if (diff === 1) return 'Morgen'
    if (diff === -1) return 'Gisteren'

    return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  }

  const isToday = () => {
    const today = new Date()
    return selectedDate.toDateString() === today.toDateString()
  }

  return (
    <>
      {/* Compact button */}
      <motion.button
        className={`${embedded ? '' : 'fixed top-28 right-2 z-[700]'} bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-2 flex items-center gap-2 border-0 outline-none`}
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Waves size={18} className="text-blue-500" />
        <div className="text-left">
          <div className="text-[10px] text-gray-500 truncate max-w-[80px]">{selectedStation.name}</div>
          <div className="text-xs font-medium text-blue-600">
            {currentLevel.toFixed(1)}m
            {nextTide && (
              <span className="text-gray-400 ml-1">
                {nextTide.type === 'high' ? '↑' : '↓'}
              </span>
            )}
          </div>
        </div>
      </motion.button>

      {/* Full modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500">
                <div className="flex items-center gap-2">
                  <Waves size={20} className="text-white" />
                  <span className="font-semibold text-white">Getijden</span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors border-0 outline-none bg-transparent"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Station selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowStationPicker(!showStationPicker)}
                    className="w-full flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg text-left border-0 outline-none hover:bg-gray-100 transition-colors"
                  >
                    <MapPin size={16} className="text-blue-500" />
                    <span className="flex-1 text-sm font-medium text-gray-700">{selectedStation.name}</span>
                    <ChevronRight size={16} className={`text-gray-400 transition-transform ${showStationPicker ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showStationPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-48 overflow-y-auto"
                      >
                        {TIDE_STATIONS.map(station => (
                          <button
                            key={station.id}
                            onClick={() => {
                              setSelectedStation(station)
                              setShowStationPicker(false)
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-0 outline-none transition-colors ${
                              station.id === selectedStation.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {station.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Date navigation */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                  <button
                    onClick={goToPrevDay}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors border-0 outline-none bg-transparent"
                  >
                    <ChevronLeft size={20} className="text-gray-600" />
                  </button>

                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <span className="font-medium text-gray-700">{formatDateShort(selectedDate)}</span>
                    {!isToday() && (
                      <button
                        onClick={goToToday}
                        className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full border-0 outline-none hover:bg-blue-200 transition-colors"
                      >
                        Vandaag
                      </button>
                    )}
                  </div>

                  <button
                    onClick={goToNextDay}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors border-0 outline-none bg-transparent"
                  >
                    <ChevronRight size={20} className="text-gray-600" />
                  </button>
                </div>

                {/* Tide graph - 24h view with sunrise/sunset */}
                <TideGraph24h
                  tides={tideData}
                  sunTimes={sunTimes}
                  selectedDate={selectedDate}
                  isToday={isToday()}
                />

                {/* Next tides */}
                <div className="grid grid-cols-4 gap-2">
                  {tideData
                    .filter(t => {
                      const dayStart = new Date(selectedDate)
                      dayStart.setHours(0, 0, 0, 0)
                      const dayEnd = new Date(selectedDate)
                      dayEnd.setHours(23, 59, 59, 999)
                      return t.time >= dayStart && t.time <= dayEnd
                    })
                    .slice(0, 4)
                    .map((tide, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg text-center ${
                          tide.type === 'high'
                            ? 'bg-emerald-50 border border-emerald-200'
                            : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        <div className={`text-xs font-bold ${
                          tide.type === 'high' ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {tide.type === 'high' ? 'HW' : 'LW'}
                        </div>
                        <div className="text-sm font-semibold text-gray-800">
                          {formatTime(tide.time)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {tide.height.toFixed(2)}m
                        </div>
                      </div>
                    ))}
                </div>

                {/* Sun times */}
                <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Sunrise size={18} className="text-amber-500" />
                    <div>
                      <div className="text-[10px] text-gray-500">Zonsopkomst</div>
                      <div className="text-sm font-medium text-gray-700">{formatTime(sunTimes.sunrise)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sunset size={18} className="text-orange-500" />
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500">Zonsondergang</div>
                      <div className="text-sm font-medium text-gray-700">{formatTime(sunTimes.sunset)}</div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 text-center">
                  Bron: berekening gebaseerd op maanstand • Alleen ter indicatie
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// 24-hour tide graph with sunrise/sunset bands
function TideGraph24h({
  tides,
  sunTimes,
  selectedDate,
  isToday
}: {
  tides: TideData[]
  sunTimes: { sunrise: Date; sunset: Date }
  selectedDate: Date
  isToday: boolean
}) {
  const width = 360
  const height = 140
  const padding = { top: 15, right: 10, bottom: 25, left: 35 }
  const graphWidth = width - padding.left - padding.right
  const graphHeight = height - padding.top - padding.bottom

  // Day range: 00:00 to 24:00
  const dayStart = new Date(selectedDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(selectedDate)
  dayEnd.setHours(24, 0, 0, 0)

  const timeRange = dayEnd.getTime() - dayStart.getTime()
  const now = new Date()

  // Sunrise/sunset positions
  const sunriseX = padding.left + ((sunTimes.sunrise.getTime() - dayStart.getTime()) / timeRange) * graphWidth
  const sunsetX = padding.left + ((sunTimes.sunset.getTime() - dayStart.getTime()) / timeRange) * graphWidth

  // Generate smooth curve points
  const points: { x: number; y: number; time: Date; height: number }[] = []
  const pointCount = 96 // Every 15 minutes

  for (let i = 0; i <= pointCount; i++) {
    const time = new Date(dayStart.getTime() + (i / pointCount) * timeRange)
    const waterHeight = getWaterLevelAtTime(time, tides)
    const x = padding.left + (i / pointCount) * graphWidth
    // Height range: 0m to 2.5m
    const y = padding.top + graphHeight - ((waterHeight - 0) / 2.5) * graphHeight
    points.push({ x, y, time, height: waterHeight })
  }

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  // Now marker position (only for today)
  const nowX = isToday ? padding.left + ((now.getTime() - dayStart.getTime()) / timeRange) * graphWidth : -100
  const nowPoint = isToday ? points.find(p => Math.abs(p.time.getTime() - now.getTime()) < 15 * 60 * 1000) : null

  // Hour markers
  const hours = [0, 6, 12, 18, 24]

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <svg width={width} height={height} className="w-full">
        {/* Night backgrounds (before sunrise, after sunset) */}
        <rect
          x={padding.left}
          y={padding.top}
          width={Math.max(0, sunriseX - padding.left)}
          height={graphHeight}
          fill="rgba(99, 102, 241, 0.08)"
        />
        <rect
          x={sunsetX}
          y={padding.top}
          width={Math.max(0, width - padding.right - sunsetX)}
          height={graphHeight}
          fill="rgba(99, 102, 241, 0.08)"
        />

        {/* Day background (sunrise to sunset) */}
        <rect
          x={sunriseX}
          y={padding.top}
          width={Math.max(0, sunsetX - sunriseX)}
          height={graphHeight}
          fill="rgba(251, 191, 36, 0.08)"
        />

        {/* Grid lines - horizontal (heights) */}
        {[0, 0.5, 1.0, 1.5, 2.0, 2.5].map((h) => {
          const y = padding.top + graphHeight - ((h - 0) / 2.5) * graphHeight
          return (
            <g key={h}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke={h === 0 ? '#d1d5db' : '#e5e7eb'}
                strokeWidth={h === 0 ? 1.5 : 1}
              />
              <text
                x={padding.left - 5}
                y={y + 3}
                fontSize="9"
                fill="#9ca3af"
                textAnchor="end"
              >
                {h.toFixed(1)}
              </text>
            </g>
          )
        })}

        {/* Grid lines - vertical (hours) */}
        {hours.map((hour) => {
          const x = padding.left + (hour / 24) * graphWidth
          return (
            <g key={hour}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={height - padding.bottom}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={x}
                y={height - 8}
                fontSize="10"
                fill="#6b7280"
                textAnchor="middle"
              >
                {hour.toString().padStart(2, '0')}:00
              </text>
            </g>
          )
        })}

        {/* Sunrise marker */}
        <line
          x1={sunriseX}
          y1={padding.top}
          x2={sunriseX}
          y2={height - padding.bottom}
          stroke="#fbbf24"
          strokeWidth="1.5"
          strokeDasharray="4,2"
        />

        {/* Sunset marker */}
        <line
          x1={sunsetX}
          y1={padding.top}
          x2={sunsetX}
          y2={height - padding.bottom}
          stroke="#f97316"
          strokeWidth="1.5"
          strokeDasharray="4,2"
        />

        {/* Tide curve - thin line */}
        <path
          d={pathD}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* High/Low tide markers */}
        {tides
          .filter(t => t.time >= dayStart && t.time <= dayEnd)
          .map((tide, i) => {
            const x = padding.left + ((tide.time.getTime() - dayStart.getTime()) / timeRange) * graphWidth
            const y = padding.top + graphHeight - ((tide.height - 0) / 2.5) * graphHeight
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill={tide.type === 'high' ? '#10b981' : '#ef4444'}
                  stroke="white"
                  strokeWidth="2"
                />
              </g>
            )
          })}

        {/* Now marker (only if today) */}
        {isToday && nowX >= padding.left && nowX <= width - padding.right && (
          <>
            <line
              x1={nowX}
              y1={padding.top}
              x2={nowX}
              y2={height - padding.bottom}
              stroke="#8b5cf6"
              strokeWidth="2"
            />
            {nowPoint && (
              <circle
                cx={nowX}
                cy={nowPoint.y}
                r="6"
                fill="#8b5cf6"
                stroke="white"
                strokeWidth="2"
              />
            )}
            <rect
              x={nowX - 12}
              y={padding.top - 12}
              width="24"
              height="14"
              rx="3"
              fill="#8b5cf6"
            />
            <text
              x={nowX}
              y={padding.top - 2}
              fontSize="8"
              fill="white"
              textAnchor="middle"
              fontWeight="bold"
            >
              NU
            </text>
          </>
        )}

        {/* Y-axis label */}
        <text
          x={8}
          y={padding.top + graphHeight / 2}
          fontSize="9"
          fill="#9ca3af"
          textAnchor="middle"
          transform={`rotate(-90, 8, ${padding.top + graphHeight / 2})`}
        >
          meter
        </text>
      </svg>
    </div>
  )
}
