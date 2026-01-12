import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CloudRain, X, RefreshCw, MapPin } from 'lucide-react'
import { useGPSStore, useSettingsStore } from '../../store'

interface BuienradarWidgetProps {
  embedded?: boolean
}

// Default location: center of Netherlands
const DEFAULT_LOCATION = { lat: 52.1326, lng: 5.2913 }

export function BuienradarWidget({ embedded = false }: BuienradarWidgetProps) {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const position = useGPSStore(state => state.position)
  const showBuienradarWidget = useSettingsStore(state => state.showBuienradarWidget)

  const location = position || DEFAULT_LOCATION

  // Buienradar radar image URL (cached every 5 minutes)
  const getRadarUrl = () => {
    const timestamp = Math.floor(Date.now() / (5 * 60 * 1000)) * (5 * 60 * 1000)
    return `https://image.buienradar.nl/2.0/image/single/RadarMapRainNL?height=512&width=512&timestamp=${timestamp}`
  }

  // Buienradar precipitation graph URL for location
  const getPrecipGraphUrl = () => {
    return `https://gpsgadget.buienradar.nl/data/raintext/?lat=${location.lat.toFixed(2)}&lon=${location.lng.toFixed(2)}`
  }

  const [radarUrl, setRadarUrl] = useState(getRadarUrl())
  const [precipData, setPrecipData] = useState<{ time: string; value: number }[]>([])

  // Fetch precipitation data
  const fetchPrecipData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(getPrecipGraphUrl())
      if (response.ok) {
        const text = await response.text()
        const lines = text.trim().split('\n')
        const data = lines.map(line => {
          const [value, time] = line.split('|')
          return {
            time: time?.trim() || '',
            value: parseInt(value) || 0
          }
        }).filter(d => d.time)
        setPrecipData(data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch precipitation data:', error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (showModal) {
      fetchPrecipData()
      setRadarUrl(getRadarUrl())
    }
  }, [showModal, location.lat, location.lng])

  // Auto-refresh every 5 minutes when modal is open
  useEffect(() => {
    if (!showModal) return

    const interval = setInterval(() => {
      fetchPrecipData()
      setRadarUrl(getRadarUrl())
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [showModal])

  if (!showBuienradarWidget && !embedded) return null

  // Calculate rain status for compact view
  const hasRainComing = precipData.some(d => d.value > 0)
  const maxValue = Math.max(...precipData.map(d => d.value), 0)

  const getRainIntensity = (value: number) => {
    if (value === 0) return 'Droog'
    if (value < 77) return 'Licht'
    if (value < 166) return 'Matig'
    return 'Zwaar'
  }

  const getRainColor = (value: number) => {
    if (value === 0) return 'text-green-500'
    if (value < 77) return 'text-blue-400'
    if (value < 166) return 'text-blue-600'
    return 'text-blue-800'
  }

  return (
    <>
      {/* Compact button */}
      <motion.button
        className={`${embedded ? '' : 'fixed top-40 right-2 z-[700]'} bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-2 flex items-center gap-2 border-0 outline-none`}
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <CloudRain size={18} className={hasRainComing ? 'text-blue-500' : 'text-gray-400'} />
        <div className="text-left">
          <div className="text-[10px] text-gray-500">Buienradar</div>
          <div className={`text-xs font-medium ${getRainColor(maxValue)}`}>
            {getRainIntensity(maxValue)}
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
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600">
                <div className="flex items-center gap-2">
                  <CloudRain size={20} className="text-white" />
                  <span className="font-semibold text-white">Buienradar</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      fetchPrecipData()
                      setRadarUrl(getRadarUrl())
                    }}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors border-0 outline-none bg-transparent"
                    disabled={isLoading}
                  >
                    <RefreshCw size={18} className={`text-white ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors border-0 outline-none bg-transparent"
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="text-blue-500" />
                  <span>
                    {position ? 'Jouw locatie' : 'Nederland (centrum)'}
                  </span>
                  <span className="text-gray-400 text-xs">
                    ({location.lat.toFixed(2)}°N, {location.lng.toFixed(2)}°E)
                  </span>
                </div>

                {/* Precipitation graph */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Neerslag komende 2 uur
                  </div>
                  {precipData.length > 0 ? (
                    <PrecipitationGraph data={precipData} />
                  ) : (
                    <div className="h-20 flex items-center justify-center text-gray-400 text-sm">
                      {isLoading ? 'Laden...' : 'Geen data beschikbaar'}
                    </div>
                  )}
                </div>

                {/* Radar map */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Radar Nederland
                  </div>
                  <div className="relative rounded-lg overflow-hidden bg-gray-200" style={{ paddingBottom: '100%' }}>
                    <img
                      src={radarUrl}
                      alt="Buienradar"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="50" text-anchor="middle" fill="%23999">Laden...</text></svg>'
                      }}
                    />
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-400"></div>
                    <span>Droog</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-300"></div>
                    <span>Licht</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span>Matig</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-700"></div>
                    <span>Zwaar</span>
                  </div>
                </div>

                {/* Update time */}
                {lastUpdate && (
                  <div className="text-xs text-gray-400 text-center">
                    Laatst bijgewerkt: {lastUpdate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}

                <div className="text-xs text-gray-400 text-center">
                  Bron: Buienradar.nl
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Precipitation graph component
function PrecipitationGraph({ data }: { data: { time: string; value: number }[] }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  const barCount = data.length

  const getBarColor = (value: number) => {
    if (value === 0) return 'bg-green-300'
    if (value < 77) return 'bg-blue-300'
    if (value < 166) return 'bg-blue-500'
    return 'bg-blue-700'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-0.5 h-16">
        {data.map((point, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center"
          >
            <div
              className={`w-full rounded-t ${getBarColor(point.value)} transition-all`}
              style={{
                height: `${Math.max(2, (point.value / maxValue) * 100)}%`,
                minHeight: '2px'
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-gray-400">
        <span>{data[0]?.time || ''}</span>
        <span>{data[Math.floor(data.length / 2)]?.time || ''}</span>
        <span>{data[data.length - 1]?.time || ''}</span>
      </div>
    </div>
  )
}
