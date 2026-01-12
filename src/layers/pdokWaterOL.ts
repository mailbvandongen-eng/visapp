import TileLayer from 'ol/layer/Tile'
import TileWMS from 'ol/source/TileWMS'

// PDOK Waterschappen Hydrografie INSPIRE WMS
// Shows Dutch waterways, water bodies, and water infrastructure
// Source: https://service.pdok.nl/hwh/hydrografie/wms/v1_0
export function createPDOKWaterLayer() {
  const layer = new TileLayer({
    properties: { title: 'PDOK Water NL', type: 'wms' },
    visible: false,
    opacity: 0.7,
    source: new TileWMS({
      url: 'https://service.pdok.nl/hwh/hydrografie/wms/v1_0',
      params: {
        LAYERS: 'waterlopen,wateroppervlakken',
        TILED: true,
        FORMAT: 'image/png',
        TRANSPARENT: true
      },
      attributions: '© Het Waterschapshuis / PDOK'
    })
  })

  return layer
}
