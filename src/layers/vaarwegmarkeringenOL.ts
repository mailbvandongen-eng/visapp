import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { createIconStyle, LUCIDE_ICONS } from './iconStyles'
import proj4 from 'proj4'
import { register } from 'ol/proj/proj4'

// Register RD New projection (EPSG:28992)
proj4.defs('EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs')
register(proj4)

// WFS endpoint for vaarwegmarkeringen
const WFS_BASE = 'https://service.pdok.nl/rws/vaarwegmarkeringennld/wfs/v1_0'

// Custom buoy icon (simplified lateral mark)
LUCIDE_ICONS['buoy'] = 'M12 2v4M12 22v-4M12 6a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0v-4a4 4 0 0 1 4-4zM4 12h2M18 12h2'

// Custom beacon icon (tower/lighthouse)
LUCIDE_ICONS['beacon'] = 'M12 2L8 8h8l-4-6zM8 8v12h8V8M6 20h12M10 12h4M10 16h4'

// Styles for different marker types
const boeiStyle = createIconStyle({
  icon: 'buoy',
  color: 'white',
  bgColor: '#E91E63', // Pink/magenta for buoys
  baseSize: 24
})

const bakenStyle = createIconStyle({
  icon: 'beacon',
  color: 'white',
  bgColor: '#FF5722', // Deep orange for beacons
  baseSize: 24
})

export async function createVaarwegmarkeringenLayer(type: 'drijvend' | 'vast'): Promise<VectorLayer<VectorSource>> {
  const source = new VectorSource()

  const isDrijvend = type === 'drijvend'
  const typeName = isDrijvend
    ? 'vaarwegmarkeringennld:vaarweg_markeringen_drijvend_rd'
    : 'vaarwegmarkeringennld:vaarweg_markeringen_vast_rd'

  const layer = new VectorLayer({
    source,
    style: isDrijvend ? boeiStyle : bakenStyle,
    properties: {
      title: isDrijvend ? 'Boeien' : 'Bakens',
      name: isDrijvend ? 'Boeien' : 'Bakens'
    },
    minZoom: 10 // Only show at higher zoom levels
  })

  try {
    // Fetch with BBOX for Netherlands (in RD coordinates)
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: typeName,
      outputFormat: 'json',
      srsName: 'EPSG:4326', // Request in WGS84 for easier handling
      count: '5000' // Limit to prevent overload
    })

    const response = await fetch(`${WFS_BASE}?${params}`)

    if (!response.ok) {
      throw new Error(`WFS request failed: ${response.status}`)
    }

    const data = await response.json()

    // Transform features to include layerType
    const features = data.features.map((f: any) => ({
      ...f,
      properties: {
        ...f.properties,
        layerType: isDrijvend ? 'boei' : 'baken'
      }
    }))

    const geojson = {
      type: 'FeatureCollection',
      features
    }

    source.addFeatures(
      new GeoJSON().readFeatures(geojson, {
        featureProjection: 'EPSG:3857'
      })
    )

    console.log(`Loaded ${features.length} ${isDrijvend ? 'boeien' : 'bakens'}`)
  } catch (error) {
    console.error(`Failed to load ${type} markeringen:`, error)
  }

  return layer
}

// Combined layer loader
export async function createAllVaarwegmarkeringenLayers(): Promise<{
  boeien: VectorLayer<VectorSource>
  bakens: VectorLayer<VectorSource>
}> {
  const [boeien, bakens] = await Promise.all([
    createVaarwegmarkeringenLayer('drijvend'),
    createVaarwegmarkeringenLayer('vast')
  ])

  return { boeien, bakens }
}
