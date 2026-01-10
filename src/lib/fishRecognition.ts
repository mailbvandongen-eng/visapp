import { FISH_SPECIES } from '../data/fishSpecies'

interface RecognitionResult {
  species: string
  confidence: number
  estimatedWeight?: number
  estimatedLength?: number
  suggestions: string[]
}

// Color profiles for common Dutch fish species (RGB ranges)
const FISH_COLOR_PROFILES: Record<string, { colors: string[]; pattern: string }> = {
  'Snoek': { colors: ['green', 'yellow', 'spotted'], pattern: 'elongated with spots' },
  'Snoekbaars': { colors: ['gray', 'silver', 'striped'], pattern: 'elongated with stripes' },
  'Baars': { colors: ['green', 'black', 'striped', 'red-fins'], pattern: 'oval with stripes' },
  'Karper': { colors: ['brown', 'gold', 'orange'], pattern: 'large oval' },
  'Brasem': { colors: ['silver', 'bronze'], pattern: 'flat oval' },
  'Voorn': { colors: ['silver', 'red-fins'], pattern: 'small oval' },
  'Zeelt': { colors: ['green', 'brown', 'slimy'], pattern: 'elongated' },
  'Meerval': { colors: ['dark', 'brown', 'black'], pattern: 'large with whiskers' },
  'Aal': { colors: ['dark', 'silver-belly'], pattern: 'snake-like' },
  'Forel': { colors: ['spotted', 'pink', 'silver'], pattern: 'streamlined with spots' },
}

// Analyze image colors (basic implementation)
async function analyzeImageColors(imageData: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve([])
        return
      }

      // Sample center area of image (where fish likely is)
      const sampleSize = 100
      canvas.width = sampleSize
      canvas.height = sampleSize

      // Draw center portion
      const sx = (img.width - sampleSize) / 2
      const sy = (img.height - sampleSize) / 2
      ctx.drawImage(img, sx, sy, sampleSize, sampleSize, 0, 0, sampleSize, sampleSize)

      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
      const data = imageData.data

      // Analyze color distribution
      let totalR = 0, totalG = 0, totalB = 0
      let greenCount = 0, brownCount = 0, silverCount = 0, darkCount = 0
      const pixelCount = data.length / 4

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        totalR += r
        totalG += g
        totalB += b

        // Classify pixel color
        if (g > r && g > b) greenCount++
        if (r > 100 && g > 80 && g < 150 && b < 100) brownCount++
        if (r > 150 && g > 150 && b > 150) silverCount++
        if (r < 80 && g < 80 && b < 80) darkCount++
      }

      const colors: string[] = []
      if (greenCount / pixelCount > 0.2) colors.push('green')
      if (brownCount / pixelCount > 0.2) colors.push('brown')
      if (silverCount / pixelCount > 0.2) colors.push('silver')
      if (darkCount / pixelCount > 0.3) colors.push('dark')

      // Check for orange/gold (karper)
      const avgR = totalR / pixelCount
      const avgG = totalG / pixelCount
      if (avgR > 150 && avgG > 100 && avgG < 180) colors.push('gold')

      resolve(colors)
    }
    img.src = imageData
  })
}

// Match colors to fish species
function matchColorsToSpecies(colors: string[]): { species: string; score: number }[] {
  const matches: { species: string; score: number }[] = []

  for (const [species, profile] of Object.entries(FISH_COLOR_PROFILES)) {
    let score = 0
    for (const color of colors) {
      if (profile.colors.some(c => c.includes(color) || color.includes(c))) {
        score++
      }
    }
    if (score > 0) {
      matches.push({ species, score: score / profile.colors.length })
    }
  }

  return matches.sort((a, b) => b.score - a.score)
}

// Estimate fish size from image (very basic - would need reference object)
function estimateFishSize(width: number, height: number): { weight?: number; length?: number } {
  // This is a placeholder - real size estimation would need:
  // 1. A reference object in the image (ruler, hand, etc.)
  // 2. Distance from camera
  // 3. Lens focal length

  // For now, return undefined as we can't accurately estimate
  return {}
}

// Main recognition function
export async function recognizeFish(imageDataUrl: string): Promise<RecognitionResult> {
  try {
    // Analyze image colors
    const colors = await analyzeImageColors(imageDataUrl)

    // Match to species
    const matches = matchColorsToSpecies(colors)

    if (matches.length === 0) {
      return {
        species: '',
        confidence: 0,
        suggestions: FISH_SPECIES.slice(0, 5).map(f => f.name)
      }
    }

    const topMatch = matches[0]
    const suggestions = matches.slice(0, 5).map(m => m.species)

    // Add common species if not in suggestions
    const commonSpecies = ['Snoek', 'Baars', 'Karper', 'Snoekbaars', 'Brasem']
    for (const species of commonSpecies) {
      if (!suggestions.includes(species) && suggestions.length < 5) {
        suggestions.push(species)
      }
    }

    return {
      species: topMatch.score > 0.3 ? topMatch.species : '',
      confidence: topMatch.score,
      suggestions: suggestions.slice(0, 5)
    }
  } catch (error) {
    console.error('Fish recognition error:', error)
    return {
      species: '',
      confidence: 0,
      suggestions: FISH_SPECIES.slice(0, 5).map(f => f.name)
    }
  }
}

// Enhanced recognition using external API (placeholder for future integration)
export async function recognizeFishWithAI(imageDataUrl: string, apiKey?: string): Promise<RecognitionResult> {
  // This function can be extended to use:
  // 1. Google Cloud Vision API
  // 2. Custom TensorFlow.js model
  // 3. OpenAI Vision API
  // 4. Custom fish recognition API

  // For now, fall back to basic recognition
  if (!apiKey) {
    return recognizeFish(imageDataUrl)
  }

  // Placeholder for API integration
  // const response = await fetch('https://api.example.com/fish-recognition', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${apiKey}` },
  //   body: JSON.stringify({ image: imageDataUrl })
  // })
  // const data = await response.json()
  // return data

  return recognizeFish(imageDataUrl)
}

// Get fish info from species name
export function getFishInfo(species: string): { avgWeight: number; avgLength: number } | null {
  const fishData: Record<string, { avgWeight: number; avgLength: number }> = {
    'Snoek': { avgWeight: 3000, avgLength: 70 },
    'Snoekbaars': { avgWeight: 2500, avgLength: 60 },
    'Baars': { avgWeight: 500, avgLength: 30 },
    'Karper': { avgWeight: 8000, avgLength: 60 },
    'Brasem': { avgWeight: 2000, avgLength: 45 },
    'Voorn': { avgWeight: 300, avgLength: 25 },
    'Zeelt': { avgWeight: 1500, avgLength: 40 },
    'Meerval': { avgWeight: 15000, avgLength: 120 },
    'Aal': { avgWeight: 800, avgLength: 60 },
    'Forel': { avgWeight: 1000, avgLength: 40 },
    'Kolblei': { avgWeight: 500, avgLength: 30 },
    'Winde': { avgWeight: 1000, avgLength: 40 },
    'Kopvoorn': { avgWeight: 800, avgLength: 35 },
    'Ruisvoorn': { avgWeight: 400, avgLength: 25 },
    'Blankvoorn': { avgWeight: 300, avgLength: 25 },
  }

  return fishData[species] || null
}
