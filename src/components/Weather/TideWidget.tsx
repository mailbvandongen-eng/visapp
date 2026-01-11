import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Waves, X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
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
]

// Calculate approximate tides for a given date range
function calculateTidesForRange(startDate: Date, days: number, station: TideStation): TideData[] {
  const tides: TideData[] = []
  const synodic = 29.53058867
  const known = new Date('2000-01-06T18:14:00Z')
  const stationOffset = (station.lng / 15) * 60 // minutes offset based on longitude
  const tidalPeriod = 12 * 60 + 25 // minutes between high tides

  for (let day = 0; day < days; day++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + day)
    date.setHours(0, 0, 0, 0)

    const diff = (date.getTime() - known.getTime()) / (1000 * 60 * 60 * 24)
    const moonPhase = (diff % synodic) / synodic

    // First high tide of the day
    let firstHighTide = (moonPhase * tidalPeriod * 2) % (24 * 60)
    firstHighTide = (firstHighTide + stationOffset) % (24 * 60)

    // Generate 4 tides per day
    for (let i = 0; i < 4; i++) {
      const isHigh = i % 2 === 0
      const minuteOffset = i * (tidalPeriod / 2)
      let totalMinutes = (firstHighTide + minuteOffset)

      // Handle overflow to next day
      const dayOffset = Math.floor(totalMinutes / (24 * 60))
      totalMinutes = totalMinutes % (24 * 60)

      const hours = Math.floor(totalMinutes / 60)
      const minutes = Math.floor(totalMinutes % 60)

      const tideTime = new Date(date)
      tideTime.setDate(tideTime.getDate() + dayOffset)
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
  }

  return tides.sort((a, b) => a.time.getTime() - b.time.getTime())
}

// Find nearest station to position
function findNearestStation(lat: number, lng: number): TideStation {
  let nearest = TIDE_STATIONS[0]
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

  // Find surrounding tides
  let prevTide = tides[0]
  let nextTide = tides[1]

  for (let i = 0; i < tides.length - 1; i++) {
    if (tides[i].time <= time && tides[i + 1].time > time) {
      prevTide = tides[i]
      nextTide = tides[i + 1]
      break
    }
  }

  // Cosine interpolation for smooth curve
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
  const [selectedStation, setSelectedStation] = useState<TideStation>(TIDE_STATIONS[5]) // Scheveningen default
  const [selectedTime, setSelectedTime] = useState(new Date())
  const [isPlaying, setIsPlaying] = useState(false)
  const position = useGPSStore(state => state.position)
  const showTideWidget = useSettingsStore(state => state.showTideWidget)

  // Update station based on GPS position
  useEffect(() => {
    if (position) {
      setSelectedStation(findNearestStation(position.lat, position.lng))
    }
  }, [position])

  // Calculate tides for 5 days (-2 to +2 from today)
  const tideData = useMemo(() => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 2)
    startDate.setHours(0, 0, 0, 0)
    return calculateTidesForRange(startDate, 5, selectedStation)
  }, [selectedStation])

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setSelectedTime(prev => {
        const next = new Date(prev.getTime() + 30 * 60 * 1000) // 30 minutes per tick
        const maxTime = new Date()
        maxTime.setDate(maxTime.getDate() + 2)
        maxTime.setHours(23, 59, 59, 999)

        if (next > maxTime) {
          setIsPlaying(false)
          return maxTime
        }
        return next
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying])

  if (!showTideWidget && !embedded) return null

  const now = new Date()
  const currentLevel = getWaterLevelAtTime(now, tideData)

  // Find next tide
  const nextTide = tideData.find(t => t.time > now)

  // Time range: -2 days to +2 days
  const minTime = new Date()
  minTime.setDate(minTime.getDate() - 2)
  minTime.setHours(0, 0, 0, 0)
  const maxTime = new Date()
  maxTime.setDate(maxTime.getDate() + 2)
  maxTime.setHours(23, 59, 59, 999)

  const timeRange = maxTime.getTime() - minTime.getTime()
  const sliderValue = ((selectedTime.getTime() - minTime.getTime()) / timeRange) * 100

  const handleSliderChange = (value: number) => {
    const newTime = new Date(minTime.getTime() + (value / 100) * timeRange)
    setSelectedTime(newTime)
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const diff = Math.floor((date.getTime() - today.setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000))

    if (diff === 0) return 'Vandaag'
    if (diff === 1) return 'Morgen'
    if (diff === -1) return 'Gisteren'
    if (diff === 2) return 'Overmorgen'
    if (diff === -2) return 'Eergisteren'

    return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
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
          </div>
        </div>
      </motion.button>

      {/* Full modal with RWS-style graph */}
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
              className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600">
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
                <div className="flex items-center gap-2">
                  <select
                    value={selectedStation.id}
                    onChange={(e) => {
                      const station = TIDE_STATIONS.find(s => s.id === e.target.value)
                      if (station) setSelectedStation(station)
                    }}
                    className="flex-1 p-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    {TIDE_STATIONS.map(station => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current info */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">{formatDate(selectedTime)}</div>
                      <div className="text-2xl font-bold text-blue-600">{formatTime(selectedTime)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Waterstand</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {getWaterLevelAtTime(selectedTime, tideData).toFixed(2)}m
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5-day graph */}
                <TideGraph
                  tides={tideData}
                  selectedTime={selectedTime}
                  minTime={minTime}
                  maxTime={maxTime}
                  onTimeSelect={(time) => setSelectedTime(time)}
                />

                {/* Time slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(minTime)}</span>
                    <span className="font-medium text-blue-500">Nu</span>
                    <span>{formatDate(maxTime)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValue}
                    onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #93c5fd 0%, #93c5fd ${40}%, #3b82f6 ${40}%, #3b82f6 ${sliderValue}%, #e5e7eb ${sliderValue}%, #e5e7eb 100%)`
                    }}
                  />
                </div>

                {/* Play controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      const newTime = new Date(minTime)
                      setSelectedTime(newTime)
                    }}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border-0 outline-none bg-transparent"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors border-0 outline-none"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button
                    onClick={() => setSelectedTime(new Date())}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-0 outline-none bg-transparent font-medium"
                  >
                    Nu
                  </button>
                  <button
                    onClick={() => {
                      const newTime = new Date(maxTime)
                      setSelectedTime(newTime)
                    }}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border-0 outline-none bg-transparent"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Next tides */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="text-xs text-gray-500 mb-2">Volgende getijden</div>
                  <div className="grid grid-cols-4 gap-2">
                    {tideData
                      .filter(t => t.time > now)
                      .slice(0, 4)
                      .map((tide, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedTime(tide.time)}
                          className={`p-2 rounded-lg text-center transition-colors border-0 outline-none ${
                            tide.type === 'high'
                              ? 'bg-green-50 hover:bg-green-100'
                              : 'bg-red-50 hover:bg-red-100'
                          }`}
                        >
                          <div className={`text-[10px] font-medium ${
                            tide.type === 'high' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {tide.type === 'high' ? 'HW' : 'LW'}
                          </div>
                          <div className="text-xs font-medium">
                            {formatTime(tide.time)}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {tide.height.toFixed(1)}m
                          </div>
                        </button>
                      ))}
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

// RWS-style tide graph
function TideGraph({
  tides,
  selectedTime,
  minTime,
  maxTime,
  onTimeSelect
}: {
  tides: TideData[]
  selectedTime: Date
  minTime: Date
  maxTime: Date
  onTimeSelect: (time: Date) => void
}) {
  const width = 400
  const height = 150
  const padding = { top: 20, right: 15, bottom: 30, left: 40 }
  const graphWidth = width - padding.left - padding.right
  const graphHeight = height - padding.top - padding.bottom

  const timeRange = maxTime.getTime() - minTime.getTime()
  const now = new Date()

  // Generate points for smooth curve (every 30 minutes)
  const points: { x: number; y: number; time: Date; height: number }[] = []
  const pointCount = 240 // 5 days * 48 half-hours

  for (let i = 0; i <= pointCount; i++) {
    const time = new Date(minTime.getTime() + (i / pointCount) * timeRange)
    const height = getWaterLevelAtTime(time, tides)
    const x = padding.left + (i / pointCount) * graphWidth
    const y = padding.top + graphHeight - ((height - 0.2) / 2.3) * graphHeight
    points.push({ x, y, time, height })
  }

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  // Now line position
  const nowX = padding.left + ((now.getTime() - minTime.getTime()) / timeRange) * graphWidth

  // Selected time position
  const selectedX = padding.left + ((selectedTime.getTime() - minTime.getTime()) / timeRange) * graphWidth
  const selectedY = points.find(p => Math.abs(p.time.getTime() - selectedTime.getTime()) < 30 * 60 * 1000)?.y || padding.top

  // Day boundaries
  const dayBoundaries: { x: number; label: string }[] = []
  for (let d = -2; d <= 2; d++) {
    const date = new Date()
    date.setDate(date.getDate() + d)
    date.setHours(0, 0, 0, 0)
    const x = padding.left + ((date.getTime() - minTime.getTime()) / timeRange) * graphWidth
    const label = d === 0 ? 'Vandaag' : d === 1 ? 'Morgen' : d === -1 ? 'Gisteren' : ''
    dayBoundaries.push({ x, label })
  }

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const relX = (x - padding.left) / graphWidth
    if (relX >= 0 && relX <= 1) {
      const newTime = new Date(minTime.getTime() + relX * timeRange)
      onTimeSelect(newTime)
    }
  }

  return (
    <svg
      width={width}
      height={height}
      className="w-full cursor-crosshair"
      onClick={handleClick}
    >
      {/* Grid lines */}
      {[0.5, 1.0, 1.5, 2.0].map((h) => {
        const y = padding.top + graphHeight - ((h - 0.2) / 2.3) * graphHeight
        return (
          <g key={h}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
            <text x={padding.left - 5} y={y + 4} fontSize="10" fill="#9ca3af" textAnchor="end">{h}m</text>
          </g>
        )
      })}

      {/* Day boundaries */}
      {dayBoundaries.map((boundary, i) => (
        <g key={i}>
          <line x1={boundary.x} y1={padding.top} x2={boundary.x} y2={height - padding.bottom} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
          {boundary.label && (
            <text x={boundary.x + 5} y={height - 10} fontSize="9" fill="#6b7280">{boundary.label}</text>
          )}
        </g>
      ))}

      {/* Past area (filled) */}
      <path
        d={`${points.filter(p => p.time <= now).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} L ${nowX} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`}
        fill="rgba(59, 130, 246, 0.2)"
      />

      {/* Future area (lighter) */}
      <path
        d={`M ${nowX} ${points.find(p => p.time >= now)?.y || padding.top} ${points.filter(p => p.time > now).map((p) => `L ${p.x} ${p.y}`).join(' ')} L ${width - padding.right} ${height - padding.bottom} L ${nowX} ${height - padding.bottom} Z`}
        fill="rgba(59, 130, 246, 0.08)"
      />

      {/* Tide curve */}
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" />

      {/* High/Low markers */}
      {tides.map((tide, i) => {
        const x = padding.left + ((tide.time.getTime() - minTime.getTime()) / timeRange) * graphWidth
        const y = padding.top + graphHeight - ((tide.height - 0.2) / 2.3) * graphHeight
        if (x < padding.left || x > width - padding.right) return null
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill={tide.type === 'high' ? '#22c55e' : '#ef4444'}
            stroke="white"
            strokeWidth="2"
          />
        )
      })}

      {/* Now marker */}
      <line x1={nowX} y1={padding.top} x2={nowX} y2={height - padding.bottom} stroke="#f59e0b" strokeWidth="2" />
      <text x={nowX} y={padding.top - 5} fontSize="9" fill="#f59e0b" textAnchor="middle" fontWeight="bold">NU</text>

      {/* Selected time marker */}
      <line x1={selectedX} y1={padding.top} x2={selectedX} y2={height - padding.bottom} stroke="#8b5cf6" strokeWidth="1" strokeDasharray="3,3" />
      <circle cx={selectedX} cy={selectedY} r="6" fill="#8b5cf6" stroke="white" strokeWidth="2" />
    </svg>
  )
}
