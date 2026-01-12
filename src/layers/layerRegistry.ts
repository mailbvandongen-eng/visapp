import type { Layer } from 'ol/layer'

export interface LayerDefinition {
  name: string
  factory: () => Promise<Layer | null>
  immediateLoad: boolean
}

export const layerRegistry: Record<string, LayerDefinition> = {
  // Vis-specifieke lagen
  'Aanlegsteigers': {
    name: 'Aanlegsteigers',
    factory: async () => {
      const { createAanlegsteigersLayer } = await import('./aanlegsteigersOL')
      return createAanlegsteigersLayer()
    },
    immediateLoad: false
  },
  'Boothellingen': {
    name: 'Boothellingen',
    factory: async () => {
      const { createBoothellingenLayer } = await import('./boothellingenOL')
      return createBoothellingenLayer()
    },
    immediateLoad: false
  },
  'Dieptekaart': {
    name: 'Dieptekaart',
    factory: async () => {
      const { createDieptekaartLayer } = await import('./dieptekaartOL')
      return createDieptekaartLayer()
    },
    immediateLoad: true
  },
  'Viswater': {
    name: 'Viswater',
    factory: async () => {
      const { createViswaterLayer } = await import('./viswaterOL')
      return createViswaterLayer()
    },
    immediateLoad: false
  },
  'AHN4 Hillshade': {
    name: 'AHN4 Hillshade',
    factory: async () => {
      const { createAHN4MultiHillshadeLayer } = await import('./hillshadeLayers')
      return createAHN4MultiHillshadeLayer()
    },
    immediateLoad: true
  },
  'Hydro Overlay': {
    name: 'Hydro Overlay',
    factory: async () => {
      const { createHydroOverlayLayer } = await import('./hydroOverlayOL')
      return createHydroOverlayLayer()
    },
    immediateLoad: true
  },
  'PDOK Water NL': {
    name: 'PDOK Water NL',
    factory: async () => {
      const { createPDOKWaterLayer } = await import('./pdokWaterOL')
      return createPDOKWaterLayer()
    },
    immediateLoad: true
  }
}

export function getImmediateLoadLayers(): LayerDefinition[] {
  return Object.values(layerRegistry).filter(def => def.immediateLoad)
}

export function getLazyLoadLayers(): LayerDefinition[] {
  return Object.values(layerRegistry).filter(def => !def.immediateLoad)
}
