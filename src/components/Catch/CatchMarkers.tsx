import { useEffect, useRef } from 'react'
import { Feature } from 'ol'
import { Point } from 'ol/geom'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Circle, Fill, Stroke, Text } from 'ol/style'
import { fromLonLat } from 'ol/proj'
import { useMapStore, useCatchStore } from '../../store'

export function CatchMarkers() {
  const map = useMapStore(state => state.map)
  const catches = useCatchStore(state => state.catches)
  const layerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const sourceRef = useRef<VectorSource | null>(null)

  // Initialize layer
  useEffect(() => {
    if (!map) return

    sourceRef.current = new VectorSource()

    layerRef.current = new VectorLayer({
      source: sourceRef.current,
      zIndex: 500
    })

    map.addLayer(layerRef.current)

    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current)
      }
    }
  }, [map])

  // Update markers when catches change
  useEffect(() => {
    if (!sourceRef.current) return

    sourceRef.current.clear()

    catches.forEach((catch_) => {
      const coords = fromLonLat([catch_.location.lng, catch_.location.lat])

      const feature = new Feature({
        geometry: new Point(coords),
        catchData: catch_
      })

      // Get species first letter for marker
      const initial = catch_.species.charAt(0).toUpperCase()

      feature.setStyle(
        new Style({
          image: new Circle({
            radius: 14,
            fill: new Fill({ color: '#22c55e' }),
            stroke: new Stroke({ color: '#fff', width: 2 })
          }),
          text: new Text({
            text: initial,
            font: 'bold 12px sans-serif',
            fill: new Fill({ color: '#fff' }),
            offsetY: 1
          })
        })
      )

      sourceRef.current!.addFeature(feature)
    })
  }, [catches])

  return null
}
