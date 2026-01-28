import { useEffect, useRef } from 'react'
import { Feature, MapBrowserEvent } from 'ol'
import { Point } from 'ol/geom'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Circle, Fill, Stroke, Icon } from 'ol/style'
import { fromLonLat } from 'ol/proj'
import { useMapStore } from '../../store'
import { useGooglePhotosStore, useMapGooglePhotos, type GooglePhoto } from '../../store/googlePhotosStore'

// Camera icon SVG as data URI
const cameraIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`
const cameraIconDataUrl = `data:image/svg+xml;base64,${btoa(cameraIconSvg)}`

export function GooglePhotoMarkers() {
  const map = useMapStore(state => state.map)
  const photos = useMapGooglePhotos()
  const openPhotoActionDialog = useGooglePhotosStore(state => state.openPhotoActionDialog)
  const layerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const sourceRef = useRef<VectorSource | null>(null)

  // Initialize layer
  useEffect(() => {
    if (!map) return

    sourceRef.current = new VectorSource()

    layerRef.current = new VectorLayer({
      source: sourceRef.current,
      zIndex: 450, // Below catches (500)
      properties: { name: 'googlePhotos' }
    })

    map.addLayer(layerRef.current)

    // Add click handler
    const handleClick = (e: MapBrowserEvent<UIEvent>) => {
      const features = map.getFeaturesAtPixel(e.pixel, {
        layerFilter: (layer) => layer === layerRef.current
      })

      if (features && features.length > 0) {
        const feature = features[0] as Feature
        const photoData = feature.get('photoData') as GooglePhoto
        if (photoData) {
          openPhotoActionDialog(photoData.id)
        }
      }
    }

    map.on('click', handleClick)

    return () => {
      map.un('click', handleClick)
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current)
      }
    }
  }, [map, openPhotoActionDialog])

  // Update markers when photos change
  useEffect(() => {
    if (!sourceRef.current) return

    sourceRef.current.clear()

    photos.forEach((photo) => {
      if (!photo.location) return

      const coords = fromLonLat([photo.location.lng, photo.location.lat])

      const feature = new Feature({
        geometry: new Point(coords),
        photoData: photo
      })

      // Style: Blue circle with camera icon, or green if weather is fetched
      const hasWeather = photo.weather !== null
      const color = hasWeather ? '#10b981' : '#3b82f6' // Green if weather, blue otherwise

      feature.setStyle(
        new Style({
          image: new Circle({
            radius: 16,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: '#fff', width: 2 })
          })
        })
      )

      // Add camera icon overlay
      feature.setStyle([
        new Style({
          image: new Circle({
            radius: 16,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: '#fff', width: 2 })
          })
        }),
        new Style({
          image: new Icon({
            src: cameraIconDataUrl,
            scale: 0.6,
            anchor: [0.5, 0.5]
          })
        })
      ])

      sourceRef.current!.addFeature(feature)
    })
  }, [photos])

  return null
}
