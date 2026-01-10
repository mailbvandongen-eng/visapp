import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useLayerStore } from './layerStore'

export interface Preset {
  id: string
  name: string
  icon: string
  layers: string[]
  isBuiltIn: boolean
}

const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'standaard',
    name: 'Standaard',
    icon: 'Map',
    layers: [],
    isBuiltIn: true
  },
  {
    id: 'vissen',
    name: 'Vissen',
    icon: 'Fish',
    layers: ['Dieptekaart', 'Viswater'],
    isBuiltIn: true
  },
  {
    id: 'boot',
    name: 'Boot',
    icon: 'Anchor',
    layers: ['Aanlegsteigers', 'Boothellingen', 'Dieptekaart'],
    isBuiltIn: true
  },
  {
    id: 'alles',
    name: 'Alles',
    icon: 'Layers',
    layers: ['Aanlegsteigers', 'Boothellingen', 'Dieptekaart', 'Viswater'],
    isBuiltIn: true
  }
]

// All overlay layers
const ALL_OVERLAYS = ['Aanlegsteigers', 'Boothellingen', 'Dieptekaart', 'Viswater']

interface PresetState {
  presets: Preset[]
  applyPreset: (id: string) => void
  updatePreset: (id: string, updates: Partial<Preset>) => void
  createPreset: (name: string) => void
  deletePreset: (id: string) => void
  resetToDefaults: () => void
}

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      presets: DEFAULT_PRESETS,

      applyPreset: (id) => {
        const preset = get().presets.find(p => p.id === id)
        if (!preset) return

        const setLayerVisibility = useLayerStore.getState().setLayerVisibility

        // Turn off all overlay layers first
        ALL_OVERLAYS.forEach(layer => {
          setLayerVisibility(layer, false)
        })

        // Turn on preset layers
        preset.layers.forEach(layer => {
          setLayerVisibility(layer, true)
        })
      },

      updatePreset: (id, updates) => {
        set(state => ({
          presets: state.presets.map(p =>
            p.id === id ? { ...p, ...updates } : p
          )
        }))
      },

      createPreset: (name) => {
        const visible = useLayerStore.getState().visible
        const currentLayers = ALL_OVERLAYS.filter(layer => visible[layer])

        const newPreset: Preset = {
          id: crypto.randomUUID(),
          name,
          icon: 'Star',
          layers: currentLayers,
          isBuiltIn: false
        }

        set(state => ({
          presets: [...state.presets, newPreset]
        }))
      },

      deletePreset: (id) => {
        set(state => ({
          presets: state.presets.filter(p => p.id !== id || p.isBuiltIn)
        }))
      },

      resetToDefaults: () => {
        set({ presets: DEFAULT_PRESETS })
      }
    }),
    {
      name: 'visapp-presets'
    }
  )
)
