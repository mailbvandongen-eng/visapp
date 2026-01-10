import { useEffect, useRef, useMemo } from 'react'
import { Feature } from 'ol'
import { Point } from 'ol/geom'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Fill, Icon, Circle as CircleStyle } from 'ol/style'
import { fromLonLat } from 'ol/proj'
import { useMapStore, useGPSStore, useSettingsStore } from '../../store'

const ARROW_SVG = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <polygon points="24,6 38,38 24,30 10,38" fill="#2196F3" stroke="white" stroke-width="3" stroke-linejoin="round"/>
  </svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
})()

export function GpsMarker() {
  const map = useMapStore(state => state.map)
  const position = useGPSStore(state => state.position)
  const accuracy = useGPSStore(state => state.accuracy)
  const tracking = useGPSStore(state => state.tracking)
  const smoothHeading = useGPSStore(state => state.smoothHeading)
  const showAccuracyCircle = useSettingsStore(state => state.showAccuracyCircle)
  const firstFix = useGPSStore(state => state.firstFix)
  const resetFirstFix = useGPSStore(state => state.resetFirstFix)

  const markerRef = useRef<Feature | null>(null)
  const accuracyRef = useRef<Feature | null>(null)
  const layerRef = useRef<VectorLayer<VectorSource> | null>(null)

  const createArrowStyle = useMemo(() => (rotation: number) => new Style({
    image: new Icon({
      src: ARROW_SVG,
      scale: 0.9,
      rotation: rotation,
      rotateWithView: false,
      anchor: [0.5, 0.5]
    })
  }), [])

  useEffect(() => {
    if (!map) return
    if (!tracking && !position) return

    const defaultCoords = fromLonLat([5.1214, 52.0907])

    markerRef.current = new Feature({
      geometry: new Point(defaultCoords)
    })
    markerRef.current.setStyle(createArrowStyle(0))

    accuracyRef.current = new Feature({
      geometry: new Point(defaultCoords)
    })

    layerRef.current = new VectorLayer({
      source: new VectorSource({
        features: [accuracyRef.current, markerRef.current]
      }),
      zIndex: 1000
    })

    map.addLayer(layerRef.current)

    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current)
      }
    }
  }, [map, tracking, position, createArrowStyle])

  useEffect(() => {
    if (!map || !position || !markerRef.current || !accuracyRef.current) return

    const coords = fromLonLat([position.lng, position.lat])

    markerRef.current.getGeometry()?.setCoordinates(coords)
    accuracyRef.current.getGeometry()?.setCoordinates(coords)

    if (showAccuracyCircle && accuracy) {
      const metersPerPixel = map.getView().getResolution() || 1
      const accuracyRadius = Math.min(accuracy / metersPerPixel, 80)

      accuracyRef.current.setStyle(
        new Style({
          image: new CircleStyle({
            radius: accuracyRadius,
            fill: new Fill({ color: 'rgba(33, 150, 243, 0.15)' })
          })
        })
      )
    } else {
      accuracyRef.current.setStyle(new Style({}))
    }

    if (firstFix && tracking) {
      map.getView().setCenter(coords)
      map.getView().setZoom(15)
      resetFirstFix()
      return
    }

    if (tracking && !firstFix) {
      map.getView().animate({
        center: coords,
        duration: 150
      })
    }
  }, [map, tracking, position, accuracy, firstFix, resetFirstFix, showAccuracyCircle])

  useEffect(() => {
    if (!markerRef.current) return
    const rotation = smoothHeading !== null ? (smoothHeading * Math.PI) / 180 : 0
    markerRef.current.setStyle(createArrowStyle(rotation))
  }, [smoothHeading, createArrowStyle])

  return null
}
