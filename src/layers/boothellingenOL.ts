import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { VIS_LAYER_STYLES } from './iconStyles'

// Overpass API query for slipways (trailer ramps) in Netherlands
const OVERPASS_QUERY = `
[out:json][timeout:60];
area["name"="Nederland"]->.nl;
(
  node["leisure"="slipway"](area.nl);
  way["leisure"="slipway"](area.nl);
);
out center tags;
`

export async function createBoothellingenLayer(): Promise<VectorLayer<VectorSource>> {
  const source = new VectorSource()

  const layer = new VectorLayer({
    source,
    style: VIS_LAYER_STYLES.trailerhellingen,
    properties: {
      title: 'Trailerhellingen',
      name: 'Trailerhellingen'
    }
  })

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(OVERPASS_QUERY)}`
    })

    const data = await response.json()

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
            layerType: 'trailerhelling',
            id: el.id,
            name: tags.name || null,
            access: tags.access || null,
            fee: tags.fee || null,
            surface: tags.surface || null,
            operator: tags.operator || null,
            website: tags.website || tags['contact:website'] || null,
            description: tags.description || null,
            opening_hours: tags.opening_hours || null,
            capacity: tags.capacity || null,
            boat: tags.boat || tags['seamark:small_craft_facility:category'] || null
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

    console.log(`Loaded ${features.length} trailerhellingen`)
  } catch (error) {
    console.error('Failed to load trailerhellingen:', error)
  }

  return layer
}
