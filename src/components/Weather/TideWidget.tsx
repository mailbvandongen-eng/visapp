import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Waves, X, ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import { useGPSStore, useSettingsStore } from '../../store'

interface TideData {
  time: string
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
  { id: 'HARVLGTHVSNS', name: 'Harlingen', lat: 53.1747, lng: 5.4083 },
  { id: 'VLISSGN', name: 'Vlissingen', lat: 51.4428, lng: 3.5961 },
  { id: 'SCHEVNGN', name: 'Scheveningen', lat: 52.1033, lng: 4.2664 },
]

// Calculate approximate tides based on moon phase (simplified)
function calculateApproximateTides(date: Date, station: TideStation): TideData[] {
  const tides: TideData[] = []

  // Moon phase affects tide timing
  const synodic = 29.53058867
  const known = new Date('2000-01-06T18:14:00Z')
  const diff = (date.getTime() - known.getTime()) / (1000 * 60 * 60 * 24)
  const moonPhase = (diff % synodic) / synodic

  // Base high tide time varies by station (simplified)
  const stationOffset = (station.lng / 15) * 60 // minutes offset based on longitude

  // Two high tides and two low tides per day (approximately 12h 25min apart)
  const tidalPeriod = 12 * 60 + 25 // minutes

  // First high tide of the day (based on moon transit)
  let firstHighTide = (moonPhase * tidalPeriod * 2) % (24 * 60)
  firstHighTide = (firstHighTide + stationOffset) % (24 * 60)

  // Generate tides for the day
  for (let i = 0; i < 4; i++) {
    const isHigh = i % 2 === 0
    const minuteOffset = i * (tidalPeriod / 2)
    const totalMinutes = (firstHighTide + minuteOffset) % (24 * 60)

    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.floor(totalMinutes % 60)

    // Spring/neap tide variation based on moon phase
    const moonFactor = Math.abs(Math.sin(moonPhase * Math.PI * 2))
    const baseHeight = isHigh ? 1.8 : 0.4
    const variation = moonFactor * 0.5

    tides.push({
      time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      height: isHigh ? baseHeight + variation : baseHeight - variation * 0.5,
      type: isHigh ? 'high' : 'low'
    })
  }

  return tides.sort((a, b) => a.time.localeCompare(b.time))
}

// Find nearest station to position
function findNearestStation(lat: number, lng: number): TideStation {
  let nearest = TIDE_STATIONS[0]
  let minDist = Infinity

  for (const station of TIDE_STATIONS) {
    const dist = Math.sqrt(
      Math.pow(station.lat - lat, 2) + Math.pow(station.lng - lng, 2)
    )
    if (dist < minDist) {
      minDist = dist
      nearest = station
    }
  }

  return nearest
}

// Tide graph component
function TideGraph({ tides, currentHour }: { tides: TideData[]; currentHour: number }) {
  const width = 280
  const height = 80
  const padding = { top: 10, right: 10, bottom: 20, left: 30 }

  // Generate smooth curve through tide points
  const points: { x: number; y: number; time: string; height: number }[] = []

  // Create 24 hourly points interpolating between tides
  for (let hour = 0; hour < 24; hour++) {
    const x = padding.left + (hour / 23) * (width - padding.left - padding.right)

    // Find surrounding tides
    const hourStr = `${hour.toString().padStart(2, '0')}:00`
    let prevTide = tides[tides.length - 1]
    let nextTide = tides[0]

    for (let i = 0; i < tides.length; i++) {
      if (tides[i].time <= hourStr) {
        prevTide = tides[i]
        nextTide = tides[(i + 1) % tides.length]
      }
    }

    // Interpolate using cosine for smoother curve
    const prevHour = parseInt(prevTide.time.split(':')[0])
    const nextHour = parseInt(nextTide.time.split(':')[0]) || 24
    const progress = (hour - prevHour) / ((nextHour - prevHour) || 12)
    const cosineProgress = (1 - Math.cos(progress * Math.PI)) / 2
    const height = prevTide.height + (nextTide.height - prevTide.height) * cosineProgress

    const y = padding.top + (1 - (height / 2.5)) * (80 - padding.top - padding.bottom)
    points.push({ x, y, time: hourStr, height })
  }

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <svg width={width} height={height} className="w-full">
      {/* Grid */}
      {[0.5, 1.0, 1.5, 2.0].map((h) => {
        const y = padding.top + (1 - h / 2.5) * (height - padding.top - padding.bottom)
        return (
          <g key={h}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
            <text x={padding.left - 4} y={y + 3} fontSize="8" fill="#9ca3af" textAnchor="end">{h}m</text>
          </g>
        )
      })}

      {/* Time labels */}
      {[0, 6, 12, 18, 24].map((h) => {
        const x = padding.left + (h / 24) * (width - padding.left - padding.right)
        return (
          <text key={h} x={x} y={height - 5} fontSize="8" fill="#9ca3af" textAnchor="middle">
            {h.toString().padStart(2, '0')}:00
          </text>
        )
      })}

      {/* Water fill */}
      <path
        d={`${pathD} L ${width - padding.right} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`}
        fill="rgba(59, 130, 246, 0.15)"
      />

      {/* Tide curve */}
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" />

      {/* Current time marker */}
      {currentHour >= 0 && currentHour < 24 && (
        <>
          <line
            x1={padding.left + (currentHour / 23) * (width - padding.left - padding.right)}
            y1={padding.top}
            x2={padding.left + (currentHour / 23) * (width - padding.left - padding.right)}
            y2={height - padding.bottom}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
          <circle
            cx={padding.left + (currentHour / 23) * (width - padding.left - padding.right)}
            cy={points[currentHour]?.y || padding.top}
            r="4"
            fill="#f59e0b"
          />
        </>
      )}

      {/* High/Low markers */}
      {tides.map((tide, i) => {
        const hour = parseInt(tide.time.split(':')[0])
        const x = padding.left + (hour / 23) * (width - padding.left - padding.right)
        const y = padding.top + (1 - tide.height / 2.5) * (height - padding.top - padding.bottom)
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="3" fill={tide.type === 'high' ? '#22c55e' : '#ef4444'} />
          </g>
        )
      })}
    </svg>
  )
}

export function TideWidget() {
  const [expanded, setExpanded] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedStation, setSelectedStation] = useState<TideStation>(TIDE_STATIONS[0])
  const position = useGPSStore(state => state.position)
  const showWeatherWidget = useSettingsStore(state => state.showWeatherWidget)

  // Update station based on GPS position
  useEffect(() => {
    if (position) {
      setSelectedStation(findNearestStation(position.lat, position.lng))
    }
  }, [position])

  if (!showWeatherWidget) return null

  const now = new Date()
  const tides = calculateApproximateTides(now, selectedStation)
  const currentHour = now.getHours()

  // Find next tide
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const nextTide = tides.find(t => t.time > currentTimeStr) || tides[0]

  return (
    <>
      <motion.button
        className="fixed bottom-44 left-2 z-[700] bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-2 flex items-center gap-2 border-0 outline-none"
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Waves size={18} className="text-blue-500" />
        <div className="text-left">
          <div className="text-[10px] text-gray-500">{selectedStation.name}</div>
          <div className="text-xs font-medium">
            {nextTide.type === 'high' ? (
              <span className="text-green-600 flex items-center gap-0.5">
                <ChevronUp size={12} />
                {nextTide.time}
              </span>
            ) : (
              <span className="text-red-500 flex items-center gap-0.5">
                <ChevronDown size={12} />
                {nextTide.time}
              </span>
            )}
          </div>
        </div>
      </motion.button>

      {/* Tide Modal */}
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
              className="bg-white rounded-xl shadow-xl p-4 max-w-sm w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Waves size={18} className="text-blue-500" />
                  Getijden
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors border-0 outline-none bg-transparent"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              {/* Station selector */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-1 block">Meetstation</label>
                <select
                  value={selectedStation.id}
                  onChange={(e) => {
                    const station = TIDE_STATIONS.find(s => s.id === e.target.value)
                    if (station) setSelectedStation(station)
                  }}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                >
                  {TIDE_STATIONS.map(station => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tide graph */}
              <div className="mb-4">
                <TideGraph tides={tides} currentHour={currentHour} />
              </div>

              {/* Tide times */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {tides.map((tide, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-lg ${
                      tide.type === 'high' ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className={`text-xs font-medium ${
                      tide.type === 'high' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tide.type === 'high' ? 'Hoogwater' : 'Laagwater'}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{tide.time}</span>
                      <span className="text-xs text-gray-500">{tide.height.toFixed(1)}m</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-gray-500 text-center">
                Geschatte tijden gebaseerd op maanstand
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
