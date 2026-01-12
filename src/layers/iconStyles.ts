import { Style, Icon } from 'ol/style'
import type { FeatureLike } from 'ol/Feature'

// Lucide icon SVG paths (24x24 viewBox)
export const LUCIDE_ICONS = {
  // Fishing / Water related
  anchor: 'M12 22V8M5 12H2a10 10 0 0 0 20 0h-3M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  ship: 'M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6M12 10v4',
  fish: 'M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-3.44 6-7 6-3.56 0-7.56-2.54-8.5-6ZM18 12v.5M2 12c.94-3.46 4.94-6 8.5-6',
  waves: 'M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.4 2 5 2c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.4 2 5 2c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
  mapPin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',

  // Boat ramp / Slipway - custom triangle pointing down into water
  slipway: 'M4 8h16l-8 12L4 8zM4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2M2 20h20',

  // Default
  circle: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
}

// Create filled circle with icon overlay
function createFilledIconSvg(iconPath: string, bgColor: string, iconColor: string, size: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="${bgColor}" stroke="white" stroke-width="2"/>
    <g transform="translate(4, 4) scale(1)">
      <path d="${iconPath}" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

// Get zoom-responsive scale factor
function getScaleForResolution(resolution: number): number {
  if (resolution > 300) return 0.5
  if (resolution > 150) return 0.6
  if (resolution > 75) return 0.7
  if (resolution > 40) return 0.8
  if (resolution > 20) return 0.9
  if (resolution > 10) return 1.0
  return 1.1
}

// Style cache to avoid recreating styles
const styleCache = new Map<string, Style>()

export interface IconStyleOptions {
  icon: keyof typeof LUCIDE_ICONS
  color: string
  bgColor: string
  baseSize?: number
}

// Create a zoom-responsive icon style function
export function createIconStyle(options: IconStyleOptions) {
  const { icon, color, bgColor, baseSize = 28 } = options
  const iconPath = LUCIDE_ICONS[icon] || LUCIDE_ICONS.circle

  return function(_feature: FeatureLike, resolution: number): Style {
    const scale = getScaleForResolution(resolution)
    const cacheKey = `${icon}-${bgColor}-${scale.toFixed(2)}`

    let style = styleCache.get(cacheKey)
    if (!style) {
      const svgSrc = createFilledIconSvg(iconPath, bgColor, color, baseSize)
      style = new Style({
        image: new Icon({
          src: svgSrc,
          scale: scale,
          anchor: [0.5, 0.5],
        })
      })
      styleCache.set(cacheKey, style)
    }

    return style
  }
}

// Predefined styles for VisApp layers
export const VIS_LAYER_STYLES = {
  trailerhellingen: createIconStyle({
    icon: 'ship',
    color: 'white',
    bgColor: '#4CAF50',  // Green
    baseSize: 28
  }),

  aanlegsteigers: createIconStyle({
    icon: 'anchor',
    color: 'white',
    bgColor: '#2196F3',  // Blue
    baseSize: 28
  }),

  viswater: createIconStyle({
    icon: 'fish',
    color: 'white',
    bgColor: '#9C27B0',  // Purple
    baseSize: 26
  }),

  favoriteSpot: createIconStyle({
    icon: 'star',
    color: 'white',
    bgColor: '#FF9800',  // Orange
    baseSize: 26
  }),

  catch: createIconStyle({
    icon: 'fish',
    color: 'white',
    bgColor: '#00BCD4',  // Cyan
    baseSize: 26
  }),
}
