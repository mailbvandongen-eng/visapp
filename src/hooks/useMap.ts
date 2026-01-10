import { useEffect, useRef } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import { fromLonLat } from 'ol/proj'
import { ScaleLine } from 'ol/control'
import { useMapStore, useSettingsStore } from '../store'

interface UseMapOptions {
  target: string
}

export function useMap({ target }: UseMapOptions) {
  const mapRef = useRef<Map | null>(null)
  const scaleLineRef = useRef<ScaleLine | null>(null)
  const setMap = useMapStore(state => state.setMap)
  const showScaleBar = useSettingsStore(state => state.showScaleBar)

  useEffect(() => {
    if (!mapRef.current) {
      const map = new Map({
        target,
        controls: [],
        view: new View({
          center: fromLonLat([5.1214, 52.0907]), // Nederland centrum
          zoom: 8,
          rotation: 0,
          minZoom: 3,
          maxZoom: 19
        })
      })

      mapRef.current = map
      setMap(map)
      ;(window as any).__olMap = map
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(undefined)
        setMap(null)
        ;(window as any).__olMap = null
      }
    }
  }, [target, setMap])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (showScaleBar) {
      if (!scaleLineRef.current) {
        scaleLineRef.current = new ScaleLine({
          units: 'metric',
          bar: false,
          text: true,
          minWidth: 80
        })
        map.addControl(scaleLineRef.current)
      }
    } else {
      if (scaleLineRef.current) {
        map.removeControl(scaleLineRef.current)
        scaleLineRef.current = null
      }
    }
  }, [showScaleBar])

  return mapRef.current
}
