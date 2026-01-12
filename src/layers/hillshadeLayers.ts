import ImageLayer from 'ol/layer/Image'
import ImageArcGISRest from 'ol/source/ImageArcGISRest'

// AHN4 Multidirectional Hillshade - Better for subtle relief
// Uses Esri Nederland AHN4 DTM 5m ImageServer
export function createAHN4MultiHillshadeLayer() {
  const layer = new ImageLayer({
    properties: { title: 'AHN4 Hillshade', type: 'arcgis' },
    visible: false,
    opacity: 0.5,
    source: new ImageArcGISRest({
      url: 'https://ahn.arcgisonline.nl/arcgis/rest/services/Hoogtebestand/AHN4_DTM_5m/ImageServer',
      params: {
        renderingRule: JSON.stringify({
          rasterFunction: 'AHN - Hillshade (Multidirectionaal)'
        })
      },
      crossOrigin: 'anonymous',
      attributions: '© Esri Nederland, AHN4'
    })
  })

  return layer
}
