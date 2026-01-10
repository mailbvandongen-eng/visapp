import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Star, MapPin } from 'lucide-react'
import { useSpotStore } from '../../store'
import { FISH_SPECIES } from '../../data/fishSpecies'

interface AddSpotFormProps {
  onClose: () => void
  initialLocation?: { lat: number; lng: number }
}

export function AddSpotForm({ onClose, initialLocation }: AddSpotFormProps) {
  const addSpot = useSpotStore(state => state.addSpot)

  const [name, setName] = useState('')
  const [waterBody, setWaterBody] = useState('')
  const [fishTypes, setFishTypes] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState(3)

  const location = initialLocation

  const handleFishTypeToggle = (fishName: string) => {
    setFishTypes(prev =>
      prev.includes(fishName)
        ? prev.filter(f => f !== fishName)
        : [...prev, fishName]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !location) {
      alert('Geef een naam op voor deze locatie')
      return
    }

    addSpot({
      name,
      location,
      waterBody: waterBody || undefined,
      fishTypes,
      notes: notes || undefined,
      rating
    })

    onClose()
  }

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
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 flex items-center justify-between rounded-t-2xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Star className="text-white" size={24} />
            <h2 className="text-lg font-semibold">Locatie vastleggen</h2>
          </div>
          <button onClick={onClose} className="p-1.5 border-0 outline-none bg-transparent text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
              <MapPin size={16} />
              <span>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Naam *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bijv. Mijn favoriete stek"
              className="form-input"
              required
            />
          </div>

          {/* Water body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Water
            </label>
            <input
              type="text"
              value={waterBody}
              onChange={(e) => setWaterBody(e.target.value)}
              placeholder="bijv. IJsselmeer, Waal, etc."
              className="form-input"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beoordeling
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 border-0 outline-none bg-transparent"
                >
                  <Star
                    size={28}
                    className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Fish types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Welke vis zit hier?
            </label>
            <div className="flex flex-wrap gap-2">
              {FISH_SPECIES.slice(0, 12).map((fish) => (
                <button
                  key={fish.name}
                  type="button"
                  onClick={() => handleFishTypeToggle(fish.name)}
                  className={`px-3 py-1.5 text-sm rounded-full border-0 outline-none transition-colors ${
                    fishTypes.includes(fish.name)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {fish.name}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notities
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tips, omstandigheden, etc."
              className="form-input resize-none"
              rows={2}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Locatie opslaan
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}
