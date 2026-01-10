import TileLayer from 'ol/layer/Tile'
import TileWMS from 'ol/source/TileWMS'

export function createDieptekaartLayer(): TileLayer<TileWMS> {
  return new TileLayer({
    source: new TileWMS({
      url: 'https://service.pdok.nl/rws/ahn/wms/v1_0',
      params: {
        'LAYERS': 'dtm_05m',
        'TILED': true,
        'FORMAT': 'image/png'
      },
      serverType: 'geoserver',
      crossOrigin: 'anonymous'
    }),
    opacity: 0.7,
    properties: {
      name: 'Dieptekaart'
    }
  })
}
