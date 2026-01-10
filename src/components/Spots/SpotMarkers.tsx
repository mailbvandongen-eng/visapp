import { useEffect, useRef } from 'react'
import { Feature } from 'ol'
import { Point } from 'ol/geom'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Circle, Fill, Stroke, Text } from 'ol/style'
import { fromLonLat } from 'ol/proj'
import { useMapStore, useSpotStore } from '../../store'

export function SpotMarkers() {
  const map = useMapStore(state => state.map)
  const spots = useSpotStore(state => state.spots)
  const layerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const sourceRef = useRef<VectorSource | null>(null)

  // Initialize layer
  useEffect(() => {
    if (!map) return

    sourceRef.current = new VectorSource()

    layerRef.current = new VectorLayer({
      source: sourceRef.current,
      zIndex: 450
    })

    map.addLayer(layerRef.current)

    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current)
      }
    }
  }, [map])

  // Update markers when spots change
  useEffect(() => {
    if (!sourceRef.current) return

    sourceRef.current.clear()

    spots.forEach((spot) => {
      const coords = fromLonLat([spot.location.lng, spot.location.lat])

      const feature = new Feature({
        geometry: new Point(coords),
        spotData: spot
      })

      // Star icon style based on rating
      const starColor = spot.rating >= 4 ? '#f59e0b' : spot.rating >= 2 ? '#fbbf24' : '#d1d5db'

      feature.setStyle(
        new Style({
          image: new Circle({
            radius: 12,
            fill: new Fill({ color: starColor }),
            stroke: new Stroke({ color: '#fff', width: 2 })
          }),
          text: new Text({
            text: '★',
            font: 'bold 14px sans-serif',
            fill: new Fill({ color: '#fff' }),
            offsetY: 1
          })
        })
      )

      sourceRef.current!.addFeature(feature)
    })
  }, [spots])

  return null
}
