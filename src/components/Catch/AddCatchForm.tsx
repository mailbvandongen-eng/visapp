import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Fish, MapPin, Scale, Ruler, Navigation, Camera, Map, Sparkles, Loader2 } from 'lucide-react'
import { useCatchStore, useWeatherStore, useGPSStore } from '../../store'
import { FISH_SPECIES, FISHING_METHODS, BAIT_TYPES } from '../../data/fishSpecies'
import { PhotoCapture } from './PhotoCapture'
import { extractGPSFromPhoto } from '../../lib/exifUtils'
import { processImageForUpload, generatePhotoId } from '../../lib/imageUtils'
import { recognizeFish, getFishInfo } from '../../lib/fishRecognition'
import type { PhotoData } from '../../store/catchStore'
import type { LocationSource } from '../../store/uiStore'

interface AddCatchFormProps {
  onClose: () => void
  initialLocation?: { lat: number; lng: number }
  initialLocationSource?: LocationSource
  initialPhotos?: PhotoData[]
}

export function AddCatchForm({ onClose, initialLocation, initialLocationSource, initialPhotos = [] }: AddCatchFormProps) {
  const addCatch = useCatchStore(state => state.addCatch)
  const current = useWeatherStore(state => state.current)
  const gpsPosition = useGPSStore(state => state.position)

  // Location state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || (gpsPosition ? { lat: gpsPosition.lat, lng: gpsPosition.lng } : null)
  )
  const [locationSource, setLocationSource] = useState<LocationSource | null>(
    initialLocationSource || (gpsPosition ? 'gps' : null)
  )

  const [species, setSpecies] = useState('')
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [method, setMethod] = useState('')
  const [bait, setBait] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<PhotoData[]>(initialPhotos)

  // AI recognition state
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [aiConfidence, setAiConfidence] = useState(0)

  // Handle photo adding with EXIF extraction and AI recognition
  const handleAddPhoto = async (photo: PhotoData) => {
    setPhotos(prev => [...prev, photo])

    // Try AI fish recognition
    if (photo.dataUrl && !species) {
      setIsRecognizing(true)
      try {
        const result = await recognizeFish(photo.dataUrl)
        setAiSuggestions(result.suggestions)
        setAiConfidence(result.confidence)

        // Auto-fill if high confidence
        if (result.species && result.confidence > 0.4) {
          setSpecies(result.species)

          // Suggest typical weight/length if not set
          const fishInfo = getFishInfo(result.species)
          if (fishInfo && !weight && !length) {
            // Don't auto-fill, but show in placeholder
          }
        }
      } catch (error) {
        console.error('AI recognition failed:', error)
      } finally {
        setIsRecognizing(false)
      }
    }
  }

  // Handle AI suggestion click
  const handleSuggestionClick = (suggestedSpecies: string) => {
    setSpecies(suggestedSpecies)
    setAiSuggestions([])
  }

  const handleRemovePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  // Use current GPS if available and no location set
  const handleUseGPS = () => {
    if (gpsPosition) {
      setLocation({ lat: gpsPosition.lat, lng: gpsPosition.lng })
      setLocationSource('gps')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!species || !location) {
      alert('Selecteer een vissoort en zorg dat er een locatie is')
      return
    }

    addCatch({
      location,
      species,
      weight: weight ? parseInt(weight) : undefined,
      length: length ? parseInt(length) : undefined,
      photos: photos.length > 0 ? photos : undefined,
      method: method || 'Anders',
      bait: bait || undefined,
      notes: notes || undefined,
      weather: current ? {
        temp: current.temperature,
        windSpeed: current.windSpeed,
        windDirection: current.windDirection,
        pressure: current.pressure
      } : undefined
    })

    onClose()
  }

  // Get location source icon and label
  const getLocationSourceInfo = () => {
    switch (locationSource) {
      case 'gps':
        return { icon: Navigation, label: 'GPS', color: 'text-blue-500' }
      case 'photo':
        return { icon: Camera, label: 'Foto EXIF', color: 'text-green-500' }
      case 'map':
        return { icon: Map, label: 'Kaart', color: 'text-orange-500' }
      default:
        return { icon: MapPin, label: 'Locatie', color: 'text-gray-500' }
    }
  }

  const sourceInfo = getLocationSourceInfo()
  const SourceIcon = sourceInfo.icon

  return (
    <motion.div
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 flex items-center justify-between rounded-t-2xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Fish className="text-white" size={24} />
            <h2 className="text-lg font-semibold">Vangst registreren</h2>
          </div>
          <button onClick={onClose} className="p-1.5 border-0 outline-none bg-transparent text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Location */}
          <div className="space-y-2">
            {location ? (
              <div className="flex items-center justify-between gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <SourceIcon size={16} className={sourceInfo.color} />
                  <span className="text-gray-600">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </span>
                </div>
                <span className={`text-xs ${sourceInfo.color} font-medium`}>
                  {sourceInfo.label}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 text-sm bg-red-50 p-2 rounded-lg text-red-600">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>Geen locatie</span>
                </div>
                {gpsPosition && (
                  <button
                    type="button"
                    onClick={handleUseGPS}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded-md border-0 outline-none"
                  >
                    Gebruik GPS
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Species with AI suggestions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              Vissoort *
              {isRecognizing && (
                <span className="flex items-center gap-1 text-xs text-blue-500">
                  <Loader2 size={12} className="animate-spin" />
                  AI analyseert...
                </span>
              )}
            </label>

            {/* AI Suggestions */}
            <AnimatePresence>
              {aiSuggestions.length > 0 && !species && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                    <Sparkles size={12} />
                    <span>AI suggesties {aiConfidence > 0.3 ? `(${Math.round(aiConfidence * 100)}% zeker)` : ''}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {aiSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-2 py-1 text-xs bg-white border border-blue-300 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <select
              value={species}
              onChange={(e) => {
                setSpecies(e.target.value)
                setAiSuggestions([])
              }}
              className="form-select"
              required
            >
              <option value="">Selecteer vissoort...</option>
              {FISH_SPECIES.map((fish) => (
                <option key={fish.name} value={fish.name}>
                  {fish.name}
                </option>
              ))}
            </select>
          </div>

          {/* Weight & Length */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Scale size={14} className="inline mr-1" />
                Gewicht (gram)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="bijv. 1500"
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Ruler size={14} className="inline mr-1" />
                Lengte (cm)
              </label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="bijv. 45"
                className="form-input"
              />
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vismethode
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="form-select"
            >
              <option value="">Selecteer methode...</option>
              {FISHING_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Bait */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aas
            </label>
            <select
              value={bait}
              onChange={(e) => setBait(e.target.value)}
              className="form-select"
            >
              <option value="">Selecteer aas...</option>
              {BAIT_TYPES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notities
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Extra opmerkingen..."
              className="form-input resize-none"
              rows={2}
            />
          </div>

          {/* Photos */}
          <PhotoCapture
            photos={photos}
            onAddPhoto={handleAddPhoto}
            onRemovePhoto={handleRemovePhoto}
          />

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Vangst opslaan
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}
