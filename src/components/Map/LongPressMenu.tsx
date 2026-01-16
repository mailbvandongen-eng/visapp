import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, ExternalLink, Fish, PersonStanding, Camera } from 'lucide-react'
import { toLonLat } from 'ol/proj'
import { useMapStore, useUIStore } from '../../store'
import { extractGPSFromPhoto } from '../../lib/exifUtils'
import { processImageForUpload, generatePhotoId } from '../../lib/imageUtils'
import type { PhotoData } from '../../store/catchStore'

interface LongPressLocation {
  pixel: [number, number]
  coordinate: [number, number] // [lng, lat]
}

export function LongPressMenu() {
  const map = useMapStore(state => state.map)
  const openCatchForm = useUIStore(state => state.openCatchForm)

  const [menuLocation, setMenuLocation] = useState<LongPressLocation | null>(null)
  const [visible, setVisible] = useState(false)
  const [canClose, setCanClose] = useState(false)

  const longPressTimer = useRef<number | null>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!map) return

    const viewport = map.getViewport()
    if (!viewport) return

    const LONG_PRESS_DURATION = 600
    const MOVE_THRESHOLD = 15

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return

      const touch = e.touches[0]
      startPos.current = { x: touch.clientX, y: touch.clientY }

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }

      longPressTimer.current = window.setTimeout(() => {
        if (!startPos.current) return

        const currentMap = (window as any).__olMap
        if (!currentMap) return

        const rect = viewport.getBoundingClientRect()
        const pixel: [number, number] = [
          startPos.current.x - rect.left,
          startPos.current.y - rect.top
        ]

        const coordinate = currentMap.getCoordinateFromPixel(pixel)
        if (coordinate) {
          const lonLat = toLonLat(coordinate) as [number, number]

          e.preventDefault()

          setMenuLocation({
            pixel: [startPos.current.x, startPos.current.y],
            coordinate: lonLat
          })
          setVisible(true)
          setCanClose(false)

          setTimeout(() => setCanClose(true), 300)

          if ('vibrate' in navigator) {
            navigator.vibrate(50)
          }
        }
      }, LONG_PRESS_DURATION)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!longPressTimer.current || !startPos.current) return

      const touch = e.touches[0]
      const dx = touch.clientX - startPos.current.x
      const dy = touch.clientY - startPos.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > MOVE_THRESHOLD) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }

    const handleTouchEnd = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      startPos.current = null
    }

    const handleContextMenu = (e: Event) => {
      if (visible) {
        e.preventDefault()
      }
    }

    // Mouse events for desktop
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      startPos.current = { x: e.clientX, y: e.clientY }

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }

      longPressTimer.current = window.setTimeout(() => {
        if (!startPos.current) return

        const currentMap = (window as any).__olMap
        if (!currentMap) return

        const rect = viewport.getBoundingClientRect()
        const pixel: [number, number] = [
          startPos.current.x - rect.left,
          startPos.current.y - rect.top
        ]

        const coordinate = currentMap.getCoordinateFromPixel(pixel)
        if (coordinate) {
          const lonLat = toLonLat(coordinate) as [number, number]

          setMenuLocation({
            pixel: [startPos.current.x, startPos.current.y],
            coordinate: lonLat
          })
          setVisible(true)
          setCanClose(false)
          setTimeout(() => setCanClose(true), 300)
        }
      }, LONG_PRESS_DURATION)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!longPressTimer.current || !startPos.current) return

      const dx = e.clientX - startPos.current.x
      const dy = e.clientY - startPos.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > MOVE_THRESHOLD) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }

    const handleMouseUp = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      startPos.current = null
    }

    viewport.addEventListener('touchstart', handleTouchStart, { passive: false })
    viewport.addEventListener('touchmove', handleTouchMove, { passive: true })
    viewport.addEventListener('touchend', handleTouchEnd)
    viewport.addEventListener('touchcancel', handleTouchEnd)
    viewport.addEventListener('contextmenu', handleContextMenu)
    viewport.addEventListener('mousedown', handleMouseDown)
    viewport.addEventListener('mousemove', handleMouseMove)
    viewport.addEventListener('mouseup', handleMouseUp)
    viewport.addEventListener('mouseleave', handleMouseUp)

    return () => {
      viewport.removeEventListener('touchstart', handleTouchStart)
      viewport.removeEventListener('touchmove', handleTouchMove)
      viewport.removeEventListener('touchend', handleTouchEnd)
      viewport.removeEventListener('touchcancel', handleTouchEnd)
      viewport.removeEventListener('contextmenu', handleContextMenu)
      viewport.removeEventListener('mousedown', handleMouseDown)
      viewport.removeEventListener('mousemove', handleMouseMove)
      viewport.removeEventListener('mouseup', handleMouseUp)
      viewport.removeEventListener('mouseleave', handleMouseUp)

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [map, visible])

  const handleClose = () => {
    if (!canClose) return
    setVisible(false)
    setMenuLocation(null)
    setCanClose(false)
  }

  const forceClose = () => {
    setVisible(false)
    setMenuLocation(null)
    setCanClose(false)
  }

  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleAddCatch = () => {
    if (!menuLocation) return
    const [lng, lat] = menuLocation.coordinate
    openCatchForm({ location: { lat, lng }, locationSource: 'map' })
    forceClose()
  }

  const handleTakePhoto = () => {
    cameraInputRef.current?.click()
  }

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !menuLocation) return

    try {
      const gpsFromPhoto = await extractGPSFromPhoto(file)
      const { thumbnailBase64 } = await processImageForUpload(file)
      const photo: PhotoData = {
        id: generatePhotoId(),
        thumbnailBase64,
        createdAt: new Date().toISOString(),
        pendingUpload: true
      }

      if (gpsFromPhoto) {
        openCatchForm({
          location: gpsFromPhoto,
          locationSource: 'photo',
          photos: [photo]
        })
      } else {
        const [lng, lat] = menuLocation.coordinate
        openCatchForm({
          location: { lat, lng },
          locationSource: 'map',
          photos: [photo]
        })
      }
    } catch (error) {
      console.error('Failed to process photo:', error)
      const [lng, lat] = menuLocation.coordinate
      openCatchForm({ location: { lat, lng }, locationSource: 'map' })
    }

    e.target.value = ''
    forceClose()
  }

  const handleOpenGoogleMaps = () => {
    if (!menuLocation) return
    const [lng, lat] = menuLocation.coordinate
    const url = `https://www.google.com/maps?q=${lat},${lng}`
    window.open(url, '_blank')
    forceClose()
  }

  const handleOpenStreetView = () => {
    if (!menuLocation) return
    const [lng, lat] = menuLocation.coordinate
    const url = `https://www.google.com/maps?layer=c&cbll=${lat},${lng}`
    window.open(url, '_blank')
    forceClose()
  }

  const formatCoordinate = (coord: [number, number]) => {
    const [lng, lat] = coord
    return `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`
  }

  // Calculate menu position to prevent going off-screen
  const getMenuStyle = () => {
    if (!menuLocation) return {}

    const menuWidth = 220
    const menuHeight = 280

    // Horizontal position - ensure menu stays within screen
    let left = menuLocation.pixel[0]
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 10
    }
    if (left < 10) left = 10

    // Vertical position - check if there's space below or above
    let top = menuLocation.pixel[1]
    const spaceBelow = window.innerHeight - menuLocation.pixel[1]
    const spaceAbove = menuLocation.pixel[1]

    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      // Position above click point
      top = menuLocation.pixel[1] - menuHeight + 40
    } else if (spaceBelow < menuHeight) {
      // Not enough space above or below, position at top of screen
      top = Math.max(10, window.innerHeight - menuHeight - 10)
    }

    return { left, top }
  }

  return (
    <AnimatePresence>
      {visible && menuLocation && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[1600]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Context Menu */}
          <motion.div
            className="fixed z-[1601] bg-white rounded-xl shadow-md overflow-hidden min-w-[200px] border-0 outline-none max-h-[90vh] overflow-y-auto"
            style={getMenuStyle()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            {/* Header with coordinates */}
            <div className="px-4 py-3 bg-white border-b border-gray-100">
              <div className="flex items-center gap-2 text-blue-600">
                <MapPin size={16} />
                <span className="text-xs font-mono">
                  {formatCoordinate(menuLocation.coordinate)}
                </span>
              </div>
            </div>

            {/* Menu items */}
            <div className="bg-white">
              {/* Take photo */}
              <button
                onClick={handleTakePhoto}
                className="w-full px-4 py-3 flex items-center gap-3 transition-colors hover:bg-green-50 text-gray-700 bg-white border-0 outline-none"
              >
                <Camera size={20} className="text-green-500" />
                <span className="font-medium">Maak foto</span>
              </button>

              {/* Add catch */}
              <button
                onClick={handleAddCatch}
                className="w-full px-4 py-3 flex items-center gap-3 transition-colors hover:bg-orange-50 text-gray-700 bg-white border-0 outline-none"
              >
                <Fish size={20} className="text-orange-500" />
                <span className="font-medium">Vangst toevoegen</span>
              </button>

              {/* Street View */}
              <button
                onClick={handleOpenStreetView}
                className="w-full px-4 py-3 flex items-center gap-3 transition-colors hover:bg-yellow-50 text-gray-700 bg-white border-0 outline-none"
              >
                <PersonStanding size={20} className="text-yellow-600" />
                <span className="font-medium">Street View</span>
              </button>

              {/* Google Maps */}
              <button
                onClick={handleOpenGoogleMaps}
                className="w-full px-4 py-3 flex items-center gap-3 transition-colors hover:bg-blue-50 text-gray-700 bg-white border-0 outline-none"
              >
                <ExternalLink size={20} className="text-blue-600" />
                <span className="font-medium">Google Maps</span>
              </button>
            </div>

            {/* Hidden camera input */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />

            {/* Cancel button */}
            <div className="bg-white border-t border-gray-100">
              <button
                onClick={forceClose}
                className="w-full px-4 py-3 flex items-center justify-center gap-2 text-gray-500 hover:bg-blue-50 transition-colors bg-white border-0 outline-none"
              >
                <X size={18} />
                <span>Annuleren</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
