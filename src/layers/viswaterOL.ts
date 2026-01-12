import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Fill, Stroke } from 'ol/style'

// Overpass API query for water bodies with fishing allowed
const OVERPASS_QUERY = `
[out:json][timeout:90];
area["name"="Nederland"]->.nl;
(
  way["natural"="water"]["fishing"="yes"](area.nl);
  relation["natural"="water"]["fishing"="yes"](area.nl);
  way["water"="lake"]["fishing"="yes"](area.nl);
  way["water"="pond"]["fishing"="yes"](area.nl);
);
out geom;
`

export async function createViswaterLayer(): Promise<VectorLayer<VectorSource>> {
  const source = new VectorSource()

  const layer = new VectorLayer({
    source,
    style: new Style({
      fill: new Fill({
        color: 'rgba(33, 150, 243, 0.2)'
      }),
      stroke: new Stroke({
        color: '#2196F3',
        width: 2
      })
    }),
    properties: {
      title: 'Viswater',
      name: 'Viswater'
    }
  })

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(OVERPASS_QUERY)}`
    })

    const data = await response.json()

    // Convert Overpass response to GeoJSON
    const features: any[] = []

    data.elements.forEach((el: any) => {
      if (el.type === 'way' && el.geometry) {
        const tags = el.tags || {}
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [el.geometry.map((p: any) => [p.lon, p.lat])]
          },
          properties: {
            layerType: 'viswater',
            id: el.id,
            name: tags.name || null,
            fishing: tags.fishing,
            access: tags.access,
            operator: tags.operator || null
          }
        })
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

    console.log(`Loaded ${features.length} viswateren`)
  } catch (error) {
    console.error('Failed to load viswater:', error)
  }

  return layer
}
