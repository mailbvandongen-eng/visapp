import { useState, useRef, useEffect } from 'react'
import { Search, X, ExternalLink } from 'lucide-react'
import { useMapStore } from '../../store'
import { fromLonLat } from 'ol/proj'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchResult {
  id: string
  weergavenaam: string
  type: string
  centroide_ll?: string
}

export function SearchBox() {
  const map = useMapStore(state => state.map)

  const [isExpanded, setIsExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<number>()

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  // Click outside to collapse
  useEffect(() => {
    if (!isExpanded) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        collapse()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isExpanded])

  // Escape to collapse
  useEffect(() => {
    if (!isExpanded) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        collapse()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isExpanded])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.length < 2) {
      setResults([])
      return
    }

    debounceRef.current = window.setTimeout(async () => {
      setSearching(true)
      try {
        const response = await fetch(
          `https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?q=${encodeURIComponent(query)}&rows=7`
        )
        const data = await response.json()

        if (data.response?.docs) {
          setResults(data.response.docs)
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  const collapse = () => {
    setIsExpanded(false)
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const getCoordinates = async (resultId: string): Promise<{lng: number, lat: number} | null> => {
    try {
      const response = await fetch(
        `https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup?id=${encodeURIComponent(resultId)}`
      )
      const data = await response.json()

      if (data.response?.docs?.[0]?.centroide_ll) {
        const centroid = data.response.docs[0].centroide_ll
        const match = centroid.match(/POINT\(([^ ]+) ([^)]+)\)/)
        if (match) {
          return {
            lng: parseFloat(match[1]),
            lat: parseFloat(match[2])
          }
        }
      }
    } catch (error) {
      console.error('Lookup error:', error)
    }
    return null
  }

  const handleSelect = async (result: SearchResult) => {
    if (!map) return

    const coords = await getCoordinates(result.id)
    if (coords) {
      const view = map.getView()
      view.animate({
        center: fromLonLat([coords.lng, coords.lat]),
        zoom: 16,
        duration: 1000
      })
    }

    collapse()
  }

  const handleOpenGoogleMaps = async (result: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation()

    const coords = await getCoordinates(result.id)
    if (coords) {
      const url = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
      window.open(url, '_blank')
    }

    collapse()
  }

  // Safe top position for mobile browsers (accounts for notch/status bar)
  const safeTopStyle = { top: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))' }

  // Collapsed state: just a search icon button
  if (!isExpanded) {
    return (
      <motion.button
        className="fixed right-14 z-[800] w-11 h-11 flex items-center justify-center bg-white/90 hover:bg-white rounded-xl shadow-sm border-0 outline-none transition-colors backdrop-blur-sm"
        style={safeTopStyle}
        onClick={() => setIsExpanded(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Zoeken"
      >
        <Search size={22} className="text-gray-600" />
      </motion.button>
    )
  }

  // Expanded state: full search bar
  return (
    <div
      ref={containerRef}
      className="fixed left-[52px] right-14 z-[850]"
      style={safeTopStyle}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="search-input-wrapper"
      >
        <Search size={18} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Zoek adres of plaats..."
          className="search-input"
        />
        <button
          onClick={collapse}
          className="search-clear"
          title="Sluiten"
        >
          <X size={18} />
        </button>
      </motion.div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.ul
            className="search-results"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {results.map((result) => (
              <li
                key={result.id}
                className="search-result-item"
              >
                <div
                  className="search-result-content"
                  onClick={() => handleSelect(result)}
                >
                  <span className="search-result-text">
                    {result.weergavenaam}
                  </span>
                </div>
                <button
                  className="search-navigate-btn"
                  onClick={(e) => handleOpenGoogleMaps(result, e)}
                  title="Open in Google Maps"
                >
                  <ExternalLink size={20} />
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {isOpen && searching && (
        <div className="search-loading">Zoeken...</div>
      )}
    </div>
  )
}
