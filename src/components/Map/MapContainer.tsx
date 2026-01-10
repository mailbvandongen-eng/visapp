import { useEffect, useRef } from 'react'
import 'ol/ol.css'
import { Tile as TileLayer } from 'ol/layer'
import { OSM, XYZ } from 'ol/source'
import { useMap } from '../../hooks/useMap'
import { useLayerStore, useMapStore, useSettingsStore, useGPSStore } from '../../store'
import { getImmediateLoadLayers } from '../../layers/layerRegistry'

const BASE_LAYERS = ['OpenStreetMap', 'Luchtfoto']

export function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const initialBgApplied = useRef(false)
  useMap({ target: 'map' })
  const map = useMapStore(state => state.map)
  const registerLayer = useLayerStore(state => state.registerLayer)
  const setLayerVisibility = useLayerStore(state => state.setLayerVisibility)
  const defaultBackground = useSettingsStore(state => state.defaultBackground)
  const gpsAutoStart = useSettingsStore(state => state.gpsAutoStart)
  const startTracking = useGPSStore(state => state.startTracking)

  useEffect(() => {
    if (!map) return

    console.log('Initializing map layers...')

    // Base layers
    const osmLayer = new TileLayer({
      properties: { title: 'OpenStreetMap', type: 'base' },
      visible: true,
      source: new OSM()
    })

    const satelliteLayer = new TileLayer({
      properties: { title: 'Luchtfoto', type: 'base' },
      visible: false,
      source: new XYZ({
        url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.jpeg',
        attributions: '© Kadaster / PDOK Luchtfoto',
        maxZoom: 19
      })
    })

    // Labels overlay for satellite view
    const labelsOverlay = new TileLayer({
      properties: { title: 'Labels Overlay', type: 'overlay' },
      visible: false,
      source: new XYZ({
        url: 'https://{a-d}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',
        attributions: '© OpenStreetMap contributors © CARTO'
      })
    })

    map.addLayer(osmLayer)
    map.addLayer(satelliteLayer)
    map.addLayer(labelsOverlay)

    registerLayer('OpenStreetMap', osmLayer)
    registerLayer('Luchtfoto', satelliteLayer)
    registerLayer('Labels Overlay', labelsOverlay)

    map.updateSize()

    // Load immediate layers
    loadImmediateLayers()

    async function loadImmediateLayers() {
      const immediateLoadLayers = getImmediateLoadLayers()
      console.log(`Loading ${immediateLoadLayers.length} immediate layers...`)

      const results = await Promise.allSettled(
        immediateLoadLayers.map(async (layerDef) => {
          try {
            const layer = await layerDef.factory()
            if (layer) return { name: layerDef.name, layer }
            return null
          } catch (error) {
            console.warn(`Failed to create ${layerDef.name}:`, error)
            return null
          }
        })
      )

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const { name, layer } = result.value
          map.addLayer(layer)
          registerLayer(name, layer)
        }
      })
    }
  }, [map, registerLayer])

  // Apply default background
  useEffect(() => {
    if (!map || initialBgApplied.current) return

    const timer = setTimeout(() => {
      const bgToApply = defaultBackground || 'OpenStreetMap'
      BASE_LAYERS.forEach(layer => setLayerVisibility(layer, false))
      setLayerVisibility(bgToApply, true)
      initialBgApplied.current = true
    }, 100)

    return () => clearTimeout(timer)
  }, [map, defaultBackground, setLayerVisibility])

  // GPS autostart
  useEffect(() => {
    if (!map || !gpsAutoStart) return
    const timer = setTimeout(() => startTracking(), 500)
    return () => clearTimeout(timer)
  }, [map, gpsAutoStart, startTracking])

  return (
    <div
      id="map"
      ref={containerRef}
      style={{ width: '100%', height: '100vh' }}
    />
  )
}
