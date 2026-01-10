import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Wind, Thermometer, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, X, Play, Pause } from 'lucide-react'
import { useWeatherStore, useSettingsStore } from '../../store'

// Weather code to icon mapping
function getWeatherIcon(code: number) {
  if (code === 0) return <Sun size={16} className="text-yellow-500" />
  if (code <= 3) return <Cloud size={16} className="text-gray-400" />
  if (code <= 49) return <Cloud size={16} className="text-gray-500" />
  if (code <= 69) return <CloudRain size={16} className="text-blue-500" />
  if (code <= 79) return <CloudSnow size={16} className="text-cyan-500" />
  if (code <= 99) return <CloudLightning size={16} className="text-purple-500" />
  return <Cloud size={16} className="text-gray-400" />
}

function getWeatherLabel(code: number) {
  if (code === 0) return 'Helder'
  if (code <= 3) return 'Bewolkt'
  if (code <= 49) return 'Mist'
  if (code <= 59) return 'Motregen'
  if (code <= 69) return 'Regen'
  if (code <= 79) return 'Sneeuw'
  if (code <= 99) return 'Onweer'
  return 'Onbekend'
}

export function ForecastSlider() {
  const hourlyForecast = useWeatherStore(state => state.hourlyForecast)
  const getWeatherAtTime = useWeatherStore(state => state.getWeatherAtTime)
  const showWeatherWidget = useSettingsStore(state => state.showWeatherWidget)

  const [isExpanded, setIsExpanded] = useState(false)
  const [sliderValue, setSliderValue] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Current time index in forecast array
  const now = new Date()
  const currentIndex = hourlyForecast.findIndex(f => new Date(f.time) >= now)

  // Calculate selected time based on slider
  const hoursOffset = sliderValue - 24 // -24 to +48 hours from now
  const selectedTime = new Date(now.getTime() + hoursOffset * 60 * 60 * 1000)
  const selectedWeather = getWeatherAtTime(selectedTime)

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setSliderValue(prev => {
        if (prev >= 72) {
          setIsPlaying(false)
          return 72
        }
        return prev + 1
      })
    }, 200)

    return () => clearInterval(interval)
  }, [isPlaying])

  if (!showWeatherWidget || hourlyForecast.length === 0) return null

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Vandaag'
    if (date.toDateString() === tomorrow.toDateString()) return 'Morgen'
    if (date.toDateString() === yesterday.toDateString()) return 'Gisteren'
    return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' })
  }

  const getWindDirection = (deg: number) => {
    const directions = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW']
    return directions[Math.round(deg / 45) % 8]
  }

  return (
    <>
      {/* Toggle button */}
      <motion.button
        className="fixed bottom-60 left-2 z-[700] bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-2 flex items-center gap-2 border-0 outline-none"
        onClick={() => setIsExpanded(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Clock size={18} className="text-blue-500" />
        <span className="text-xs text-gray-600">Forecast</span>
      </motion.button>

      {/* Expanded slider modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              className="bg-white rounded-t-2xl shadow-xl p-4 w-full max-w-md"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Clock size={18} className="text-blue-500" />
                  Weersvoorspelling
                </h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors border-0 outline-none bg-transparent"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              {/* Selected time display */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {formatTime(selectedTime)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(selectedTime)}
                    </div>
                  </div>
                  {selectedWeather && (
                    <div className="flex items-center gap-2">
                      {getWeatherIcon(selectedWeather.weatherCode)}
                      <span className="text-sm text-gray-600">
                        {getWeatherLabel(selectedWeather.weatherCode)}
                      </span>
                    </div>
                  )}
                </div>

                {selectedWeather && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      <Thermometer size={16} className="text-orange-500" />
                      <span className="text-sm font-medium">
                        {Math.round(selectedWeather.temperature)}°C
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind size={16} className="text-blue-500" />
                      <span className="text-sm font-medium">
                        {Math.round(selectedWeather.windSpeed)} km/u
                      </span>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {getWindDirection(selectedWeather.windDirection)}
                    </div>
                  </div>
                )}
              </div>

              {/* Time slider */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>-24u</span>
                  <span className="font-medium text-blue-500">Nu</span>
                  <span>+48u</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="72"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                    style={{
                      background: `linear-gradient(to right, #93c5fd 0%, #93c5fd ${(24/72)*100}%, #3b82f6 ${(24/72)*100}%, #3b82f6 ${(sliderValue/72)*100}%, #e5e7eb ${(sliderValue/72)*100}%, #e5e7eb 100%)`
                    }}
                  />
                  {/* Now marker */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-600 rounded"
                    style={{ left: `${(24/72)*100}%` }}
                  />
                </div>
              </div>

              {/* Play controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setSliderValue(0)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border-0 outline-none bg-transparent"
                >
                  Start
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors border-0 outline-none"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  onClick={() => setSliderValue(24)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border-0 outline-none bg-transparent"
                >
                  Nu
                </button>
              </div>

              {/* Hourly preview */}
              <div className="mt-4 overflow-x-auto">
                <div className="flex gap-2 pb-2">
                  {hourlyForecast.slice(currentIndex, currentIndex + 12).map((forecast, i) => {
                    const time = new Date(forecast.time)
                    const isSelected = Math.abs(time.getTime() - selectedTime.getTime()) < 30 * 60 * 1000
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          const hoursDiff = (time.getTime() - now.getTime()) / (60 * 60 * 1000)
                          setSliderValue(24 + Math.round(hoursDiff))
                        }}
                        className={`flex flex-col items-center p-2 rounded-lg min-w-[50px] transition-colors border-0 outline-none ${
                          isSelected ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-[10px] text-gray-500">
                          {time.getHours().toString().padStart(2, '0')}:00
                        </span>
                        {getWeatherIcon(forecast.weatherCode)}
                        <span className="text-xs font-medium">
                          {Math.round(forecast.temperature)}°
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
