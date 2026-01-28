import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, MapPin, Calendar, CloudSun, Thermometer, Wind, Droplets,
  Gauge, Cloud, Fish, Loader2, AlertTriangle, Map, HardDrive
} from 'lucide-react'
import { useGooglePhotosStore, useSelectedGooglePhoto } from '../../store/googlePhotosStore'
import { useUIStore } from '../../store'
import { formatDateTimeDutch, formatCoordinates } from '../../lib/exifUtils'
import { getWeatherDescription, getWindDirectionText, calculateFishingScore } from '../../services/historicalWeatherService'
import { getThumbnailUrl } from '../../services/googlePhotosService'
import { getStoredPhoto } from '../../services/photoStorageService'

export function PhotoActionDialog() {
  const isOpen = useGooglePhotosStore(state => state.photoActionDialogOpen)
  const closeDialog = useGooglePhotosStore(state => state.closePhotoActionDialog)
  const updatePhoto = useGooglePhotosStore(state => state.updatePhoto)
  const fetchWeatherForPhoto = useGooglePhotosStore(state => state.fetchWeatherForPhoto)
  const removePhoto = useGooglePhotosStore(state => state.removePhoto)
  const openCatchForm = useUIStore(state => state.openCatchForm)

  const photo = useSelectedGooglePhoto()
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null)
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false)

  // Load local photo from IndexedDB
  useEffect(() => {
    if (!photo) {
      setLocalPhotoUrl(null)
      return
    }

    if (photo.isStoredLocally) {
      setIsLoadingPhoto(true)
      getStoredPhoto(photo.id)
        .then(stored => {
          if (stored) {
            setLocalPhotoUrl(stored.dataUrl)
          }
        })
        .finally(() => setIsLoadingPhoto(false))
    } else {
      setLocalPhotoUrl(null)
    }
  }, [photo?.id, photo?.isStoredLocally])

  if (!isOpen || !photo) return null

  const hasLocation = photo.location !== null
  const hasDateTime = photo.dateTime !== null
  const hasWeather = photo.weather !== null
  const canFetchWeather = hasLocation && hasDateTime && !hasWeather

  const handleFetchWeather = async () => {
    setIsLoadingWeather(true)
    try {
      await fetchWeatherForPhoto(photo.id)
    } finally {
      setIsLoadingWeather(false)
    }
  }

  const handlePlaceOnMap = () => {
    updatePhoto(photo.id, { isOnMap: true })
    closeDialog()
  }

  const handleRegisterCatch = () => {
    // Open catch form with photo data pre-filled
    openCatchForm({
      location: photo.location || undefined,
      locationSource: 'photo',
      // Note: We can't easily pass the photo itself since catch form uses PhotoData
      // This would need additional work to convert GooglePhoto to PhotoData
    })
    updatePhoto(photo.id, { isRegisteredAsCatch: true })
    closeDialog()
  }

  const handleRemove = () => {
    removePhoto(photo.id)
  }

  const fishingScore = hasWeather ? calculateFishingScore(photo.weather!) : null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeDialog}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600">
            <h2 className="text-lg font-semibold text-white">Foto details</h2>
            <button
              onClick={closeDialog}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors border-0 outline-none"
            >
              <X size={18} className="text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* Photo thumbnail */}
            <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden">
              {isLoadingPhoto ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <Loader2 size={32} className="animate-spin" />
                </div>
              ) : localPhotoUrl ? (
                <>
                  <img
                    src={localPhotoUrl}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />
                  {/* Local storage indicator */}
                  <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <HardDrive size={10} />
                    Lokaal
                  </div>
                </>
              ) : (
                <img
                  src={getThumbnailUrl(photo.baseUrl, 400)}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Location & Date info */}
            <div className="space-y-2">
              {hasLocation ? (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-blue-500 shrink-0" />
                  <span className="text-gray-700">
                    {formatCoordinates(photo.location!.lat, photo.location!.lng)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>Geen locatie in foto gevonden</span>
                </div>
              )}

              {hasDateTime ? (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-blue-500 shrink-0" />
                  <span className="text-gray-700">
                    {formatDateTimeDutch(photo.dateTime!)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>Geen datum in foto gevonden</span>
                </div>
              )}
            </div>

            {/* Fetch weather button */}
            {canFetchWeather && (
              <button
                onClick={handleFetchWeather}
                disabled={isLoadingWeather}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 border-0 outline-none"
              >
                {isLoadingWeather ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Weergegevens ophalen...
                  </>
                ) : (
                  <>
                    <CloudSun size={18} />
                    Haal weergegevens op
                  </>
                )}
              </button>
            )}

            {/* Weather data display */}
            {hasWeather && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    <CloudSun size={18} className="text-blue-500" />
                    Weer op {formatDateTimeDutch(photo.dateTime!).split(',')[0]}
                  </h3>
                  {fishingScore !== null && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      fishingScore >= 70 ? 'bg-green-100 text-green-700' :
                      fishingScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      <Fish size={12} />
                      {fishingScore}%
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Temperature */}
                  <div className="flex items-center gap-2">
                    <Thermometer size={16} className="text-orange-500" />
                    <span className="text-sm text-gray-700">
                      {photo.weather!.temp.toFixed(1)}°C
                    </span>
                  </div>

                  {/* Pressure */}
                  <div className="flex items-center gap-2">
                    <Gauge size={16} className="text-purple-500" />
                    <span className="text-sm text-gray-700">
                      {photo.weather!.pressure.toFixed(0)} hPa
                    </span>
                  </div>

                  {/* Wind */}
                  <div className="flex items-center gap-2">
                    <Wind size={16} className="text-cyan-500" />
                    <span className="text-sm text-gray-700">
                      {photo.weather!.windSpeed.toFixed(0)} km/u {getWindDirectionText(photo.weather!.windDirection)}
                    </span>
                  </div>

                  {/* Humidity */}
                  <div className="flex items-center gap-2">
                    <Droplets size={16} className="text-blue-500" />
                    <span className="text-sm text-gray-700">
                      {photo.weather!.humidity.toFixed(0)}%
                    </span>
                  </div>

                  {/* Cloud cover */}
                  <div className="flex items-center gap-2">
                    <Cloud size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {photo.weather!.cloudCover.toFixed(0)}% bewolkt
                    </span>
                  </div>

                  {/* Weather description */}
                  <div className="flex items-center gap-2">
                    <CloudSun size={16} className="text-yellow-500" />
                    <span className="text-sm text-gray-700">
                      {getWeatherDescription(photo.weather!.weatherCode)}
                    </span>
                  </div>
                </div>

                {/* Precipitation */}
                {photo.weather!.precipitation > 0 && (
                  <div className="text-sm text-blue-600 mt-2">
                    Neerslag: {photo.weather!.precipitation.toFixed(1)} mm
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              {hasLocation && (
                <>
                  <button
                    onClick={handlePlaceOnMap}
                    disabled={photo.isOnMap}
                    className={`w-full py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border-0 outline-none ${
                      photo.isOnMap
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <Map size={18} />
                    {photo.isOnMap ? 'Al op kaart geplaatst' : 'Plaats op kaart'}
                  </button>

                  <button
                    onClick={handleRegisterCatch}
                    disabled={photo.isRegisteredAsCatch}
                    className={`w-full py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border-0 outline-none ${
                      photo.isRegisteredAsCatch
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    <Fish size={18} />
                    {photo.isRegisteredAsCatch ? 'Al geregistreerd' : 'Registreer vangst'}
                  </button>
                </>
              )}

              <button
                onClick={handleRemove}
                className="w-full py-2 px-4 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-all border-0 outline-none"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
