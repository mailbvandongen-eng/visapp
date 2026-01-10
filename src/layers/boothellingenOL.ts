import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Circle, Fill, Stroke } from 'ol/style'

// Overpass API query for slipways (boat ramps) in Netherlands
const OVERPASS_QUERY = `
[out:json][timeout:60];
area["name"="Nederland"]->.nl;
(
  node["leisure"="slipway"](area.nl);
  way["leisure"="slipway"](area.nl);
);
out center;
`

export async function createBoothellingenLayer(): Promise<VectorLayer<VectorSource>> {
  const source = new VectorSource()

  const layer = new VectorLayer({
    source,
    style: new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({ color: '#4CAF50' }),
        stroke: new Stroke({ color: '#fff', width: 2 })
      })
    }),
    properties: {
      name: 'Boothellingen'
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
          name: el.tags?.name || 'Boothelling',
          access: el.tags?.access || 'unknown',
          fee: el.tags?.fee || 'unknown',
          surface: el.tags?.surface
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

    console.log(`Loaded ${features.length} boothellingen`)
  } catch (error) {
    console.error('Failed to load boothellingen:', error)
  }

  return layer
}
