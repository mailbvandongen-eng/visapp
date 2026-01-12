import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'

// Esri Hydro Reference Overlay
// Shows water features: rivers, streams, lakes
// Source: https://www.arcgis.com/home/item.html?id=9f86716d941c4410b0b406d911754b2c
export function createHydroOverlayLayer() {
  const layer = new TileLayer({
    properties: { title: 'Hydro Overlay', type: 'overlay' },
    visible: false,
    opacity: 0.8,
    source: new XYZ({
      url: 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Esri_Hydro_Reference_Overlay/MapServer/tile/{z}/{y}/{x}',
      attributions: '© Esri - Hydro Reference Overlay',
      maxZoom: 19
    })
  })

  return layer
}
