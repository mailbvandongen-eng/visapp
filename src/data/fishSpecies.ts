export interface FishSpecies {
  name: string
  category: 'roofvis' | 'karperachtig' | 'forel' | 'aal' | 'zout' | 'overig'
}

export const FISH_SPECIES: FishSpecies[] = [
  // Roofvissen
  { name: 'Snoek', category: 'roofvis' },
  { name: 'Snoekbaars', category: 'roofvis' },
  { name: 'Baars', category: 'roofvis' },
  { name: 'Meerval', category: 'roofvis' },

  // Karperachtigen
  { name: 'Karper', category: 'karperachtig' },
  { name: 'Brasem', category: 'karperachtig' },
  { name: 'Voorn', category: 'karperachtig' },
  { name: 'Zeelt', category: 'karperachtig' },
  { name: 'Kolblei', category: 'karperachtig' },
  { name: 'Winde', category: 'karperachtig' },
  { name: 'Blankvoorn', category: 'karperachtig' },
  { name: 'Ruisvoorn', category: 'karperachtig' },

  // Forellen
  { name: 'Forel', category: 'forel' },
  { name: 'Regenboogforel', category: 'forel' },
  { name: 'Beekforel', category: 'forel' },

  // Aal
  { name: 'Paling', category: 'aal' },

  // Zoutwater
  { name: 'Zeebaars', category: 'zout' },
  { name: 'Harder', category: 'zout' },
  { name: 'Makreel', category: 'zout' },
  { name: 'Horsmakreel', category: 'zout' },
  { name: 'Bot', category: 'zout' },
  { name: 'Tong', category: 'zout' },

  // Overig
  { name: 'Pos', category: 'overig' },
  { name: 'Spiering', category: 'overig' },
  { name: 'Anders', category: 'overig' }
]

export const FISHING_METHODS = [
  'Spinfissen',
  'Feedervissen',
  'Karpervissen',
  'Vliegvissen',
  'Dropshot',
  'Streetfishing',
  'Sleepvissen',
  'Kunstaas',
  'Levend aas',
  'Match vissen',
  'Anders'
]

export const BAIT_TYPES = [
  // Kunstaas
  'Wobbler',
  'Twister',
  'Shad',
  'Spinner',
  'Lepel',
  'Jerkbait',
  'Crankbait',

  // Natuurlijk aas
  'Worm',
  'Made',
  'Mais',
  'Brood',
  'Boilie',
  'Pellet',
  'Witvis',
  'Garnaal',

  // Vliegvissen
  'Droge vlieg',
  'Natte vlieg',
  'Nymf',
  'Streamer',

  'Anders'
]

export function getCategoryLabel(category: FishSpecies['category']): string {
  const labels: Record<FishSpecies['category'], string> = {
    roofvis: 'Roofvissen',
    karperachtig: 'Karperachtigen',
    forel: 'Forellen',
    aal: 'Aal',
    zout: 'Zoutwater',
    overig: 'Overig'
  }
  return labels[category]
}
