import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ExternalLink, PersonStanding } from 'lucide-react'
import { toLonLat } from 'ol/proj'
import { useMapStore } from '../../store'
import type { MapBrowserEvent } from 'ol'

export function Popup() {
  const map = useMapStore(state => state.map)
  const [allContents, setAllContents] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [mapsUrl, setMapsUrl] = useState<string | null>(null)

  const totalItems = allContents.length
  const currentContent = allContents[currentIndex] || ''

  useEffect(() => {
    if (!map) return

    const handleClick = async (event: MapBrowserEvent<UIEvent>) => {
      const features: Array<{ content: string; coordinate: number[] }> = []

      // Check for features at click location
      map.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
        const props = feature.getProperties()
        const layerTitle = layer?.get('title') || ''

        let content = ''

        // Handle different layer types
        if (layerTitle === 'Aanlegsteigers' || props.layerType === 'aanlegsteiger') {
          const name = props.name || 'Aanlegsteiger'
          const operator = props.operator || ''
          const access = props.access || ''
          const fee = props.fee || ''
          const capacity = props.capacity || ''
          const website = props.website || ''

          content = `<strong class="text-blue-800">${name}</strong>`
          if (operator) content += `<br/><span class="text-sm text-gray-600">Beheerder: ${operator}</span>`
          if (access) content += `<br/><span class="text-sm text-gray-600">Toegang: ${access === 'yes' ? 'Openbaar' : access === 'private' ? 'Privé' : access}</span>`
          if (fee) content += `<br/><span class="text-sm text-gray-600">Kosten: ${fee === 'yes' ? 'Betaald' : fee === 'no' ? 'Gratis' : fee}</span>`
          if (capacity) content += `<br/><span class="text-sm text-gray-600">Capaciteit: ${capacity} boten</span>`
          if (website) content += `<br/><a href="${website}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline text-sm">Website</a>`
        }

        else if (layerTitle === 'Trailerhellingen' || props.layerType === 'trailerhelling') {
          const name = props.name || null
          const operator = props.operator || ''
          const access = props.access || ''
          const fee = props.fee || ''
          const surface = props.surface || ''
          const website = props.website || ''
          const description = props.description || ''
          const openingHours = props.opening_hours || ''

          // Determine fee status with colored badge
          let feeLabel = ''
          if (fee === 'no') {
            feeLabel = '<span class="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Gratis</span>'
          } else if (fee === 'yes') {
            feeLabel = '<span class="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Betaald</span>'
          } else if (fee) {
            feeLabel = `<span class="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">${fee}</span>`
          }

          // Title with optional name
          if (name) {
            content = `<strong class="text-green-800 text-lg">${name}</strong>`
            if (feeLabel) content += ` ${feeLabel}`
          } else {
            content = `<strong class="text-green-800 text-lg">Trailerhelling</strong>`
            if (feeLabel) content += ` ${feeLabel}`
          }

          // Access info
          if (access) {
            const accessLabel = access === 'yes' || access === 'public' || access === 'permissive'
              ? 'Openbaar'
              : access === 'private'
                ? 'Privé'
                : access === 'customers'
                  ? 'Alleen klanten'
                  : access
            content += `<br/><span class="text-sm text-gray-600">Toegang: ${accessLabel}</span>`
          }

          // Operator
          if (operator) content += `<br/><span class="text-sm text-gray-600">Beheerder: ${operator}</span>`

          // Surface type
          if (surface) {
            const surfaceLabels: Record<string, string> = {
              'concrete': 'Beton',
              'asphalt': 'Asfalt',
              'gravel': 'Grind',
              'paved': 'Verhard',
              'unpaved': 'Onverhard',
              'grass': 'Gras',
              'sand': 'Zand',
              'wood': 'Hout'
            }
            content += `<br/><span class="text-sm text-gray-600">Ondergrond: ${surfaceLabels[surface] || surface}</span>`
          }

          // Opening hours
          if (openingHours) content += `<br/><span class="text-sm text-gray-600">Openingstijden: ${openingHours}</span>`

          // Description
          if (description) content += `<br/><span class="text-sm text-gray-500 italic">${description}</span>`

          // Website
          if (website) content += `<br/><a href="${website}" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:underline text-sm">Website</a>`
        }

        else if (layerTitle === 'Viswater' || props.layerType === 'viswater') {
          const name = props.name || 'Viswater'
          const fishingType = props.fishing || ''
          const access = props.access || ''
          const operator = props.operator || ''

          content = `<strong class="text-purple-800">${name}</strong>`
          if (fishingType) content += `<br/><span class="text-sm text-purple-700">Type: ${fishingType}</span>`
          if (operator) content += `<br/><span class="text-sm text-gray-600">Beheerder: ${operator}</span>`
          if (access) content += `<br/><span class="text-sm text-gray-600">Toegang: ${access}</span>`
        }

        // Generic fallback for other features
        else if (props.name || props.title) {
          const name = props.name || props.title
          content = `<strong class="text-gray-800">${name}</strong>`
          if (props.description) content += `<br/><span class="text-sm text-gray-600">${props.description}</span>`
        }

        if (content) {
          features.push({ content, coordinate: event.coordinate })
        }
      })

      if (features.length > 0) {
        setAllContents(features.map(f => f.content))
        setCurrentIndex(0)
        setVisible(true)

        // Set Google Maps URL
        const lonLat = toLonLat(features[0].coordinate)
        setMapsUrl(`https://www.google.com/maps/dir/?api=1&destination=${lonLat[1]},${lonLat[0]}`)
      }
    }

    map.on('singleclick', handleClick)

    return () => {
      map.un('singleclick', handleClick)
    }
  }, [map])

  const closePopup = () => {
    setVisible(false)
    setAllContents([])
    setCurrentIndex(0)
    setMapsUrl(null)
  }

  const goNext = () => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <AnimatePresence>
      {visible && currentContent && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-0 left-0 right-0 z-[1200] bg-white rounded-t-2xl shadow-lg max-h-[50vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-orange-600">
            <div className="flex items-center gap-2">
              {/* Navigation arrows */}
              {totalItems > 1 && (
                <div className="flex items-center gap-1 mr-2">
                  <button
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className="p-1 rounded bg-orange-600 hover:bg-orange-700 disabled:opacity-50 border-0 outline-none"
                  >
                    <ChevronLeft size={16} className="text-white" />
                  </button>
                  <span className="text-white text-xs px-1">
                    {currentIndex + 1}/{totalItems}
                  </span>
                  <button
                    onClick={goNext}
                    disabled={currentIndex === totalItems - 1}
                    className="p-1 rounded bg-orange-600 hover:bg-orange-700 disabled:opacity-50 border-0 outline-none"
                  >
                    <ChevronRight size={16} className="text-white" />
                  </button>
                </div>
              )}
              <span className="font-medium text-white text-sm">Info</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Google Maps navigation */}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded bg-orange-600 hover:bg-orange-700 border-0 outline-none"
                  title="Navigeer met Google Maps"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Navigation2 size={16} className="text-white" />
                </a>
              )}
              <button
                onClick={closePopup}
                className="p-1.5 rounded bg-blue-600 hover:bg-blue-700 border-0 outline-none"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            className="p-4 overflow-y-auto"
            style={{ maxHeight: 'calc(50vh - 56px)' }}
            dangerouslySetInnerHTML={{ __html: currentContent }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
