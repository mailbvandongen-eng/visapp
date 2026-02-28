import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'

// OpenSeaMap nautical chart overlay
// Shows depth contours, buoys, beacons, and other nautical features
// Source: https://openseamap.org
export function createDieptekaartLayer(): TileLayer<XYZ> {
  return new TileLayer({
    zIndex: 30,
    source: new XYZ({
      url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
      attributions: '© OpenSeaMap contributors',
      crossOrigin: 'anonymous',
      maxZoom: 18
    }),
    opacity: 0.9,
    properties: {
      title: 'Dieptekaart',
      name: 'Dieptekaart'
    }
  })
}
