import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Fish, MapPin, Scale, Ruler, Navigation, Camera, Map } from 'lucide-react'
import { useCatchStore, useWeatherStore, useGPSStore } from '../../store'
import { FISH_SPECIES, FISHING_METHODS, BAIT_TYPES } from '../../data/fishSpecies'
import { PhotoCapture } from './PhotoCapture'
import { extractGPSFromPhoto } from '../../lib/exifUtils'
import { processImageForUpload, generatePhotoId } from '../../lib/imageUtils'
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

  // Handle photo adding with EXIF extraction
  const handleAddPhoto = async (photo: PhotoData) => {
    setPhotos(prev => [...prev, photo])
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

          {/* Species */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vissoort *
            </label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
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
