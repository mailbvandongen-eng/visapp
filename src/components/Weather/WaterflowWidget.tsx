import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, X, RefreshCw, TrendingUp, TrendingDown, Minus, MapPin } from 'lucide-react'
import { useSettingsStore } from '../../store'

interface WaterflowWidgetProps {
  embedded?: boolean
}

interface RiverStation {
  id: string
  name: string
  river: string
  lat: number
  lng: number
  normalFlow: number // m³/s normal average
}

// Dutch river monitoring stations (Rijkswaterstaat)
const RIVER_STATIONS: RiverStation[] = [
  { id: 'lobith', name: 'Lobith', river: 'Rijn', lat: 51.8556, lng: 6.1086, normalFlow: 2300 },
  { id: 'borgharen', name: 'Borgharen', river: 'Maas', lat: 50.8708, lng: 5.6956, normalFlow: 250 },
  { id: 'vreeswijk', name: 'Vreeswijk', river: 'Lek', lat: 52.0167, lng: 5.0833, normalFlow: 800 },
  { id: 'tiel', name: 'Tiel', river: 'Waal', lat: 51.8833, lng: 5.4333, normalFlow: 1500 },
  { id: 'deventer', name: 'Deventer', river: 'IJssel', lat: 52.2500, lng: 6.1833, normalFlow: 400 },
  { id: 'olst', name: 'Olst', river: 'IJssel', lat: 52.3333, lng: 6.1167, normalFlow: 380 },
]

interface FlowData {
  stationId: string
  flow: number // m³/s
  trend: 'rising' | 'falling' | 'stable'
  timestamp: Date
}

// Simulated flow data (in real implementation, fetch from RWS API)
function getSimulatedFlowData(station: RiverStation): FlowData {
  // Simulate seasonal variation and random fluctuation
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))

  // Higher flow in winter/spring, lower in summer
  const seasonalFactor = 1 + 0.4 * Math.sin((dayOfYear - 100) * Math.PI / 182)
  const randomFactor = 0.9 + Math.random() * 0.2

  const flow = Math.round(station.normalFlow * seasonalFactor * randomFactor)

  // Random trend
  const trendRand = Math.random()
  const trend = trendRand < 0.33 ? 'rising' : trendRand < 0.66 ? 'falling' : 'stable'

  return {
    stationId: station.id,
    flow,
    trend,
    timestamp: now
  }
}

export function WaterflowWidget({ embedded = false }: WaterflowWidgetProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedStation, setSelectedStation] = useState<RiverStation>(RIVER_STATIONS[0])
  const [flowData, setFlowData] = useState<Map<string, FlowData>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const showWaterflowWidget = useSettingsStore(state => state.showWaterflowWidget)

  // Fetch flow data for all stations
  const fetchFlowData = () => {
    setIsLoading(true)
    const newData = new Map<string, FlowData>()

    RIVER_STATIONS.forEach(station => {
      newData.set(station.id, getSimulatedFlowData(station))
    })

    setFlowData(newData)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchFlowData()
  }, [])

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(fetchFlowData, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (!showWaterflowWidget && !embedded) return null

  const currentFlow = flowData.get(selectedStation.id)

  const getFlowStatus = (flow: number, normal: number) => {
    const ratio = flow / normal
    if (ratio < 0.7) return { text: 'Laag', color: 'text-orange-500', bg: 'bg-orange-50' }
    if (ratio > 1.3) return { text: 'Hoog', color: 'text-blue-600', bg: 'bg-blue-50' }
    return { text: 'Normaal', color: 'text-green-500', bg: 'bg-green-50' }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'rising') return <TrendingUp size={14} className="text-blue-500" />
    if (trend === 'falling') return <TrendingDown size={14} className="text-orange-500" />
    return <Minus size={14} className="text-gray-400" />
  }

  const status = currentFlow ? getFlowStatus(currentFlow.flow, selectedStation.normalFlow) : null

  return (
    <>
      {/* Compact button */}
      <motion.button
        className={`${embedded ? '' : 'fixed top-52 right-2 z-[700]'} bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-2 flex items-center gap-2 border-0 outline-none`}
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Droplets size={18} className="text-cyan-500" />
        <div className="text-left">
          <div className="text-[10px] text-gray-500 truncate max-w-[80px]">{selectedStation.river}</div>
          <div className={`text-xs font-medium ${status?.color || 'text-gray-600'}`}>
            {currentFlow ? `${currentFlow.flow} m³/s` : 'Laden...'}
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
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600">
                <div className="flex items-center gap-2">
                  <Droplets size={20} className="text-white" />
                  <span className="font-semibold text-white">Waterafvoer</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchFlowData}
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
                {/* Current station info */}
                {currentFlow && (
                  <div className={`rounded-lg p-4 ${status?.bg || 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-500" />
                        <span className="font-medium text-gray-800">{selectedStation.name}</span>
                        <span className="text-sm text-gray-500">({selectedStation.river})</span>
                      </div>
                      {getTrendIcon(currentFlow.trend)}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-bold ${status?.color}`}>
                        {currentFlow.flow.toLocaleString()}
                      </span>
                      <span className="text-gray-500">m³/s</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Normaal: {selectedStation.normalFlow.toLocaleString()} m³/s
                    </div>
                    <div className={`mt-1 text-sm font-medium ${status?.color}`}>
                      {status?.text} waterstand
                    </div>
                  </div>
                )}

                {/* All stations */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Meetstations</div>
                  <div className="grid gap-2">
                    {RIVER_STATIONS.map(station => {
                      const data = flowData.get(station.id)
                      const stationStatus = data ? getFlowStatus(data.flow, station.normalFlow) : null
                      const isSelected = station.id === selectedStation.id

                      return (
                        <button
                          key={station.id}
                          onClick={() => setSelectedStation(station)}
                          className={`w-full p-3 rounded-lg text-left transition-colors border-0 outline-none ${
                            isSelected
                              ? 'bg-cyan-50 border-2 border-cyan-300'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-800">{station.name}</div>
                              <div className="text-xs text-gray-500">{station.river}</div>
                            </div>
                            <div className="text-right">
                              <div className={`font-semibold ${stationStatus?.color || 'text-gray-600'}`}>
                                {data ? `${data.flow.toLocaleString()} m³/s` : '...'}
                              </div>
                              <div className="flex items-center justify-end gap-1">
                                {data && getTrendIcon(data.trend)}
                                <span className={`text-xs ${stationStatus?.color || 'text-gray-400'}`}>
                                  {stationStatus?.text || ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Info */}
                <div className="text-xs text-gray-400 text-center space-y-1">
                  <div>Waterafvoer in kubieke meter per seconde</div>
                  <div>Bron: Rijkswaterstaat (simulatie)</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
