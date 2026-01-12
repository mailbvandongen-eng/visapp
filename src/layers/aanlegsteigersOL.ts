import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { VIS_LAYER_STYLES } from './iconStyles'

// Overpass API query for marinas and moorings in Netherlands
const OVERPASS_QUERY = `
[out:json][timeout:60];
area["name"="Nederland"]->.nl;
(
  node["leisure"="marina"](area.nl);
  node["mooring"="yes"](area.nl);
  way["leisure"="marina"](area.nl);
);
out center tags;
`

export async function createAanlegsteigersLayer(): Promise<VectorLayer<VectorSource>> {
  const source = new VectorSource()

  const layer = new VectorLayer({
    source,
    style: VIS_LAYER_STYLES.aanlegsteigers,
    properties: {
      title: 'Aanlegsteigers',
      name: 'Aanlegsteigers'
    }
  })

  // Fetch data from Overpass API
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(OVERPASS_QUERY)}`
    })

    const data = await response.json()

    // Convert to GeoJSON
    const features = data.elements
      .filter((el: any) => el.lat && el.lon || el.center)
      .map((el: any) => {
        const tags = el.tags || {}
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [
              el.lon || el.center?.lon,
              el.lat || el.center?.lat
            ]
          },
          properties: {
            layerType: 'aanlegsteiger',
            id: el.id,
            name: tags.name || null,
            type: tags.leisure || tags.mooring || 'marina',
            operator: tags.operator || null,
            access: tags.access || null,
            fee: tags.fee || null,
            capacity: tags.capacity || null,
            website: tags.website || tags['contact:website'] || null,
            phone: tags.phone || tags['contact:phone'] || null
          }
        }
      })

    const geojson = {
      type: 'FeatureCollection',
      features
    }

    source.addFeatures(
      new GeoJSON().readFeatures(geojson, {
        featureProjection: 'EPSG:3857'
      })
    )

    console.log(`Loaded ${features.length} aanlegsteigers`)
  } catch (error) {
    console.error('Failed to load aanlegsteigers:', error)
  }

  return layer
}
