import TileLayer from 'ol/layer/Tile'
import TileWMS from 'ol/source/TileWMS'

// PDOK TOP10NL Water WMS - Dutch water bodies
// Shows rivers, lakes, canals and other water bodies
// Source: https://service.pdok.nl/brt/top10nl/wms/v1_0
export function createPDOKWaterLayer() {
  const layer = new TileLayer({
    properties: { title: 'PDOK Water NL', type: 'wms' },
    visible: true, // Default visible for water overlay
    opacity: 0.6,
    source: new TileWMS({
      url: 'https://service.pdok.nl/brt/top10nl/wms/v1_0',
      params: {
        LAYERS: 'waterdeel',
        TILED: true,
        FORMAT: 'image/png',
        TRANSPARENT: true,
        STYLES: ''
      },
      attributions: '© Kadaster / PDOK TOP10NL',
      crossOrigin: 'anonymous'
    })
  })

  return layer
}
