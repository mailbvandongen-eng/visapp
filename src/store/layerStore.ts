import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Layer } from 'ol/layer'
import { layerRegistry } from '../layers/layerRegistry'
import { useMapStore } from './mapStore'

export type LoadingState = 'idle' | 'loading' | 'loaded' | 'error'

interface LayerState {
  visible: Record<string, boolean>
  opacity: Record<string, number>
  loadingState: Record<string, LoadingState>
  layers: Record<string, Layer>

  toggleLayer: (name: string) => void
  setLayerVisibility: (name: string, visible: boolean) => void
  setLayerOpacity: (name: string, opacity: number) => void
  registerLayer: (name: string, layer: Layer) => void
  loadLayer: (name: string) => Promise<void>
}

export const useLayerStore = create<LayerState>()(
  immer((set, get) => ({
    // Initial visibility - vis layers
    visible: {
      'OpenStreetMap': true,
      'Luchtfoto': false,
      'Labels Overlay': false,
      'Aanlegsteigers': false,
      'Boothellingen': false,
      'Dieptekaart': false,
      'Viswater': false,
      'Mijn Vangsten': true,
      'Favoriete Plekken': true
    },

    opacity: {
      'Dieptekaart': 0.7,
      'Viswater': 0.5
    },

    loadingState: {},
    layers: {},

    toggleLayer: (name) => {
      const state = get()
      const newVisible = !state.visible[name]

      set(state => {
        state.visible[name] = newVisible
      })

      if (newVisible && !state.layers[name]) {
        get().loadLayer(name)
      } else if (state.layers[name]) {
        state.layers[name].setVisible(newVisible)
      }
    },

    setLayerVisibility: (name, visible) => {
      const state = get()

      set(s => {
        s.visible[name] = visible
        const layer = s.layers[name]
        if (layer) {
          layer.setVisible(visible)
        }
      })

      if (visible && !state.layers[name]) {
        get().loadLayer(name)
      }
    },

    setLayerOpacity: (name, opacity) => {
      set(state => {
        state.opacity[name] = opacity
        const layer = state.layers[name]
        if (layer) {
          layer.setOpacity(opacity)
        }
      })
    },

    registerLayer: (name, layer) => {
      set(state => {
        state.layers[name] = layer
        state.loadingState[name] = 'loaded'
        if (state.visible[name] !== undefined) {
          layer.setVisible(state.visible[name])
        }
        if (state.opacity[name] !== undefined) {
          layer.setOpacity(state.opacity[name])
        }
      })
    },

    loadLayer: async (name) => {
      const state = get()

      if (state.loadingState[name] === 'loading' || state.layers[name]) {
        return
      }

      const layerDef = layerRegistry[name]
      if (!layerDef) {
        console.warn(`Layer "${name}" not found in registry`)
        return
      }

      const map = useMapStore.getState().map
      if (!map) {
        console.warn(`Cannot load layer "${name}": map not initialized`)
        return
      }

      set(state => {
        state.loadingState[name] = 'loading'
      })

      console.log(`Loading layer: ${name}...`)

      try {
        const layer = await layerDef.factory()

        if (!layer) {
          throw new Error('Factory returned null')
        }

        const currentState = get()
        layer.setVisible(currentState.visible[name] ?? false)
        if (currentState.opacity[name] !== undefined) {
          layer.setOpacity(currentState.opacity[name])
        }

        map.addLayer(layer)

        set(state => {
          state.layers[name] = layer
          state.loadingState[name] = 'loaded'
        })

        console.log(`Layer loaded: ${name}`)
      } catch (error) {
        console.error(`Failed to load layer "${name}":`, error)
        set(state => {
          state.loadingState[name] = 'error'
        })
      }
    }
  }))
)
