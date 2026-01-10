import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Icon, Circle, Fill, Stroke } from 'ol/style'

// Overpass API query for marinas and moorings in Netherlands
const OVERPASS_QUERY = `
[out:json][timeout:60];
area["name"="Nederland"]->.nl;
(
  node["leisure"="marina"](area.nl);
  node["mooring"="yes"](area.nl);
  way["leisure"="marina"](area.nl);
);
out center;
`

export async function createAanlegsteigersLayer(): Promise<VectorLayer<VectorSource>> {
  const source = new VectorSource()

  const layer = new VectorLayer({
    source,
    style: new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({ color: '#2196F3' }),
        stroke: new Stroke({ color: '#fff', width: 2 })
      })
    }),
    properties: {
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
      .map((el: any) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            el.lon || el.center?.lon,
            el.lat || el.center?.lat
          ]
        },
        properties: {
          id: el.id,
          name: el.tags?.name || 'Aanlegsteiger',
          type: el.tags?.leisure || el.tags?.mooring || 'marina',
          website: el.tags?.website,
          phone: el.tags?.phone
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

    console.log(`Loaded ${features.length} aanlegsteigers`)
  } catch (error) {
    console.error('Failed to load aanlegsteigers:', error)
  }

  return layer
}
