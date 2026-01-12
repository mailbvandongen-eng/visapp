import { useEffect, useRef } from 'react'
import 'ol/ol.css'
import { Tile as TileLayer } from 'ol/layer'
import { OSM, XYZ } from 'ol/source'
import { useMap } from '../../hooks/useMap'
import { useLayerStore, useMapStore, useSettingsStore, useGPSStore } from '../../store'
import { getImmediateLoadLayers } from '../../layers/layerRegistry'

const BASE_LAYERS = ['OpenStreetMap', 'Luchtfoto', 'Terrein']

export function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const initialBgApplied = useRef(false)
  useMap({ target: 'map' })
  const map = useMapStore(state => state.map)
  const registerLayer = useLayerStore(state => state.registerLayer)
  const setLayerVisibility = useLayerStore(state => state.setLayerVisibility)
  const setLayerOpacity = useLayerStore(state => state.setLayerOpacity)
  const defaultBackground = useSettingsStore(state => state.defaultBackground)
  const gpsAutoStart = useSettingsStore(state => state.gpsAutoStart)
  const startTracking = useGPSStore(state => state.startTracking)

  useEffect(() => {
    if (!map) return

    console.log('Initializing map layers...')

    // Get the saved background preference - default to Terrein (hillshade + light)
    const bgSetting = useSettingsStore.getState().defaultBackground || 'Terrein'
    const showOSM = bgSetting === 'OpenStreetMap'
    const showSatellite = bgSetting === 'Luchtfoto'
    const showTerrein = bgSetting === 'Terrein'

    console.log('Background setting:', bgSetting)

    // Hillshade layer (bottom, subtle terrain relief)
    const hillshadeLayer = new TileLayer({
      properties: { title: 'Hillshade', type: 'base' },
      visible: showTerrein,
      opacity: 0.15,
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
        attributions: '© Esri',
        maxZoom: 18
      })
    })

    // OSM Light (CartoDB Positron) - clean with visible water
    const osmLightLayer = new TileLayer({
      properties: { title: 'Terrein', type: 'base' },
      visible: showTerrein,
      source: new XYZ({
        url: 'https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        attributions: '© OpenStreetMap contributors © CARTO'
      })
    })

    // Regular OSM
    const osmLayer = new TileLayer({
      properties: { title: 'OpenStreetMap', type: 'base' },
      visible: showOSM,
      source: new OSM()
    })

    // Satellite
    const satelliteLayer = new TileLayer({
      properties: { title: 'Luchtfoto', type: 'base' },
      visible: showSatellite,
      source: new XYZ({
        url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.jpeg',
        attributions: '© Kadaster / PDOK Luchtfoto',
        maxZoom: 19
      })
    })

    // Labels overlay for satellite view
    const labelsOverlay = new TileLayer({
      properties: { title: 'Labels Overlay', type: 'overlay' },
      visible: showSatellite,
      source: new XYZ({
        url: 'https://{a-d}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',
        attributions: '© OpenStreetMap contributors © CARTO'
      })
    })

    // Add layers in correct order (hillshade first, then the rest)
    map.addLayer(hillshadeLayer)
    map.addLayer(osmLightLayer)
    map.addLayer(osmLayer)
    map.addLayer(satelliteLayer)
    map.addLayer(labelsOverlay)

    registerLayer('Hillshade', hillshadeLayer)
    registerLayer('Terrein', osmLightLayer)
    registerLayer('OpenStreetMap', osmLayer)
    registerLayer('Luchtfoto', satelliteLayer)
    registerLayer('Labels Overlay', labelsOverlay)

    // Also update the layer store visibility to match
    setLayerVisibility('Hillshade', showTerrein)
    setLayerVisibility('Terrein', showTerrein)
    setLayerVisibility('OpenStreetMap', showOSM)
    setLayerVisibility('Luchtfoto', showSatellite)
    setLayerVisibility('Labels Overlay', showSatellite)

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
