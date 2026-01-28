import TileLayer from 'ol/layer/Tile'
import TileWMS from 'ol/source/TileWMS'

/**
 * Rijkswaterstaat Bathymetrie Nederland WMS Layer
 * Shows the latest measured water depth (bodemhoogte) in meters relative to NAP
 *
 * Source: https://geo.rijkswaterstaat.nl/services/ogc/gdr/bodemhoogte_1mtr/ows
 */

const WMS_URL = 'https://geo.rijkswaterstaat.nl/services/ogc/gdr/bodemhoogte_1mtr/ows'

// All available layers (NAP reference)
const BATHYMETRIE_LAYERS = [
  'MN_noord_NAP',
  'MN_zuid_NAP',
  'NN_lemmer_delfzijl_NAP',
  'NN_waddenzee_NAP',
  'ON_noord_NAP',
  'ON_oost_NAP',
  'ON_zuid_NAP',
  'WNN_n_NAP',
  'WNZ_noord_NAP',
  'WNZ_zuid_NAP',
  'ZD_noord_NAP',
  'ZD_noordzee_midden_NAP',
  'ZD_noordzee_noord_NAP',
  'ZD_noordzee_zuid_NAP',
  'ZD_zuid_NAP',
  'ZN_midden_NAP',
  'ZN_west_NAP',
  'ZN_zuid_oost_NAP'
]

export function createBathymetrieLayer(): TileLayer<TileWMS> {
  const layer = new TileLayer({
    properties: {
      title: 'Bathymetrie',
      name: 'Bathymetrie'
    },
    opacity: 0.7,
    source: new TileWMS({
      url: WMS_URL,
      params: {
        'LAYERS': BATHYMETRIE_LAYERS.join(','),
        'FORMAT': 'image/png',
        'TRANSPARENT': true,
        'VERSION': '1.3.0',
        'CRS': 'EPSG:3857'
      },
      serverType: 'geoserver',
      crossOrigin: 'anonymous'
    }),
    minZoom: 8 // Only show at higher zoom levels
  })

  console.log('Loaded Bathymetrie Nederland layer')
  return layer
}
