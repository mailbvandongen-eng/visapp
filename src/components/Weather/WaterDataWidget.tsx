import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, Waves, Navigation, Thermometer, X, RefreshCw, Info } from 'lucide-react'
import { useWaterDataStore } from '../../store/waterDataStore'
import { useGPSStore, useSettingsStore } from '../../store'
import { RWS_STATIONS } from '../../services/rwsService'

export function WaterDataWidget() {
  const [showModal, setShowModal] = useState(false)
  const {
    station,
    waterData,
    lastUpdated,
    isLoading,
    fetchData,
    setStation,
    setStationByPosition
  } = useWaterDataStore()
  const position = useGPSStore(state => state.position)
  const showWaterDataWidget = useSettingsStore(state => state.showWaterDataWidget)

  // Update station based on GPS position
  useEffect(() => {
    if (position) {
      setStationByPosition(position.lat, position.lng)
    }
  }, [position, setStationByPosition])

  // Fetch data on mount and every 10 minutes
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData, station])

  if (!showWaterDataWidget) return null

  // Temperature color based on value
  const getTempColor = (temp: number) => {
    if (temp < 8) return 'text-blue-600'
    if (temp < 14) return 'text-cyan-500'
    if (temp < 18) return 'text-green-500'
    return 'text-orange-500'
  }

  // Wave indicator
  const getWaveLabel = (height: number) => {
    if (height < 30) return 'Kalm'
    if (height < 60) return 'Licht'
    if (height < 100) return 'Matig'
    if (height < 150) return 'Ruw'
    return 'Hoog'
  }

  const getWaveColor = (height: number) => {
    if (height < 30) return 'text-green-500'
    if (height < 60) return 'text-green-400'
    if (height < 100) return 'text-yellow-500'
    if (height < 150) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <>
      {/* Compact button */}
      <motion.button
        className="fixed bottom-60 left-2 z-[700] bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-2 flex items-center gap-2 border-0 outline-none"
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Droplets size={18} className="text-cyan-500" />
        <div className="text-left">
          <div className="text-[10px] text-gray-500 truncate max-w-[80px]">
            {station?.name || 'Water'}
          </div>
          {waterData?.temperature !== undefined && (
            <div className={`text-xs font-medium ${getTempColor(waterData.temperature)}`}>
              {waterData.temperature.toFixed(1)}°C
            </div>
          )}
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
              className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500">
                <div className="flex items-center gap-2">
                  <Droplets size={20} className="text-white" />
                  <span className="font-semibold text-white">Waterdata</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchData()}
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
                {/* Station selector */}
                <div className="flex items-center gap-2">
                  <select
                    value={station?.id || ''}
                    onChange={(e) => {
                      const newStation = RWS_STATIONS.find(s => s.id === e.target.value)
                      if (newStation) setStation(newStation)
                    }}
                    className="flex-1 p-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    {RWS_STATIONS.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Data cards */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Temperature */}
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer size={18} className="text-cyan-500" />
                      <span className="text-xs text-gray-500">Watertemperatuur</span>
                    </div>
                    {waterData?.temperature !== undefined ? (
                      <div className={`text-2xl font-bold ${getTempColor(waterData.temperature)}`}>
                        {waterData.temperature.toFixed(1)}°C
                      </div>
                    ) : (
                      <div className="text-gray-400">-</div>
                    )}
                    <div className="text-[10px] text-gray-400 mt-1">
                      {waterData?.temperature !== undefined && (
                        waterData.temperature < 10 ? 'Koud - minder activiteit' :
                        waterData.temperature < 15 ? 'Goed voor roofvis' :
                        'Warm - actieve vis'
                      )}
                    </div>
                  </div>

                  {/* Wave height */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Waves size={18} className="text-blue-500" />
                      <span className="text-xs text-gray-500">Golfhoogte</span>
                    </div>
                    {waterData?.waveHeight !== undefined ? (
                      <>
                        <div className={`text-2xl font-bold ${getWaveColor(waterData.waveHeight)}`}>
                          {waterData.waveHeight} cm
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {getWaveLabel(waterData.waveHeight)}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400">-</div>
                    )}
                  </div>

                  {/* Current speed */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Navigation size={18} className="text-green-500" />
                      <span className="text-xs text-gray-500">Stroomsnelheid</span>
                    </div>
                    {waterData?.currentSpeed !== undefined ? (
                      <>
                        <div className="text-2xl font-bold text-green-600">
                          {waterData.currentSpeed} cm/s
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {waterData.currentSpeed < 20 ? 'Zwak' :
                           waterData.currentSpeed < 50 ? 'Matig' : 'Sterk'}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400">-</div>
                    )}
                  </div>

                  {/* Current direction compass */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Navigation size={18} className="text-purple-500" />
                      <span className="text-xs text-gray-500">Stroomrichting</span>
                    </div>
                    {waterData?.currentDirection !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 flex items-center justify-center"
                          style={{ transform: `rotate(${waterData.currentDirection}deg)` }}
                        >
                          <Navigation size={24} className="text-purple-500" fill="currentColor" />
                        </div>
                        <div className="text-lg font-bold text-purple-600">
                          {Math.round(waterData.currentDirection)}°
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400">-</div>
                    )}
                  </div>
                </div>

                {/* Fish activity indicator based on water temp */}
                {waterData?.temperature !== undefined && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">Visactiviteit</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            waterData.temperature < 5 ? 'w-1/6 bg-blue-500' :
                            waterData.temperature < 10 ? 'w-2/6 bg-cyan-500' :
                            waterData.temperature < 15 ? 'w-4/6 bg-green-500' :
                            waterData.temperature < 20 ? 'w-5/6 bg-yellow-500' :
                            'w-3/6 bg-orange-500'
                          }`}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {waterData.temperature < 5 ? 'Zeer laag' :
                         waterData.temperature < 10 ? 'Laag' :
                         waterData.temperature < 15 ? 'Goed' :
                         waterData.temperature < 20 ? 'Uitstekend' :
                         'Goed'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Last updated */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Info size={12} />
                    <span>Bron: Rijkswaterstaat</span>
                  </div>
                  {lastUpdated && (
                    <span>
                      Bijgewerkt: {lastUpdated.toLocaleTimeString('nl-NL', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
