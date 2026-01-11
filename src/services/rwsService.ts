// Rijkswaterstaat Waterinfo API Service
// Fetches water data from Dutch government water monitoring stations

const RWS_API_URL = 'https://waterwebservices.rijkswaterstaat.nl/ONLINEWAARNEMINGENSERVICES_DBO'

export interface RWSStation {
  id: string
  name: string
  lat: number
  lng: number
  x: number // RD coordinates
  y: number
}

export interface WaterData {
  temperature?: number // °C
  waveHeight?: number // cm
  currentSpeed?: number // cm/s
  currentDirection?: number // degrees
  waterLevel?: number // cm NAP
  salinity?: number // g/kg
  timestamp: Date
  station: RWSStation
}

// Major Dutch coastal/water stations with RD coordinates
export const RWS_STATIONS: RWSStation[] = [
  { id: 'IJMDMNTHVN', name: 'IJmuiden', lat: 52.4639, lng: 4.5556, x: 97580, y: 497920 },
  { id: 'SCHEVNGN', name: 'Scheveningen', lat: 52.1033, lng: 4.2664, x: 75580, y: 458220 },
  { id: 'HOEKVHLD', name: 'Hoek van Holland', lat: 51.9775, lng: 4.1200, x: 65150, y: 444150 },
  { id: 'VLISSGN', name: 'Vlissingen', lat: 51.4428, lng: 3.5961, x: 30410, y: 385360 },
  { id: 'DENHDR', name: 'Den Helder', lat: 52.9647, lng: 4.7456, x: 109200, y: 553200 },
  { id: 'HARVLGTHVN', name: 'Harlingen', lat: 53.1747, lng: 5.4083, x: 158000, y: 576500 },
  { id: 'TERSLNZE', name: 'Terschelling', lat: 53.4397, lng: 5.3281, x: 155000, y: 606000 },
  { id: 'TEXLHORS', name: 'Texel Hors', lat: 52.9983, lng: 4.6981, x: 106000, y: 557000 },
  { id: 'EEMHVN', name: 'Eemhaven', lat: 51.9000, lng: 4.4833, x: 90000, y: 436000 },
  { id: 'KATSVR', name: 'Kats', lat: 51.5694, lng: 3.9389, x: 53000, y: 399000 },
]

// Find nearest station to a position
export function findNearestRWSStation(lat: number, lng: number): RWSStation {
  let nearest = RWS_STATIONS[0]
  let minDist = Infinity

  for (const station of RWS_STATIONS) {
    const dist = Math.sqrt(Math.pow(station.lat - lat, 2) + Math.pow(station.lng - lng, 2))
    if (dist < minDist) {
      minDist = dist
      nearest = station
    }
  }

  return nearest
}

// Fetch water temperature from RWS API
export async function fetchWaterTemperature(station: RWSStation): Promise<number | null> {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const request = {
    AquoPlusWaarnemingMetadata: {
      AquoMetadata: {
        Compartiment: { Code: 'OW' },
        Grootheid: { Code: 'T' }
      }
    },
    Locatie: {
      X: station.x,
      Y: station.y,
      Code: station.id
    },
    Periode: {
      Begindatumtijd: oneHourAgo.toISOString(),
      Einddatumtijd: now.toISOString()
    }
  }

  try {
    const response = await fetch(`${RWS_API_URL}/OphalenLaatsteWaarnemingen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })

    const data = await response.json()

    if (data.Succesvol && data.WaarnemingenLijst?.length > 0) {
      const latest = data.WaarnemingenLijst[0]
      if (latest.MetingenLijst?.length > 0) {
        return latest.MetingenLijst[0].Meetwaarde?.Waarde_Numeriek ?? null
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching water temperature:', error)
    return null
  }
}

// Fetch wave height from RWS API
export async function fetchWaveHeight(station: RWSStation): Promise<number | null> {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const request = {
    AquoPlusWaarnemingMetadata: {
      AquoMetadata: {
        Compartiment: { Code: 'OW' },
        Grootheid: { Code: 'GOLFHTE' }
      }
    },
    Locatie: {
      X: station.x,
      Y: station.y,
      Code: station.id
    },
    Periode: {
      Begindatumtijd: oneHourAgo.toISOString(),
      Einddatumtijd: now.toISOString()
    }
  }

  try {
    const response = await fetch(`${RWS_API_URL}/OphalenLaatsteWaarnemingen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })

    const data = await response.json()

    if (data.Succesvol && data.WaarnemingenLijst?.length > 0) {
      const latest = data.WaarnemingenLijst[0]
      if (latest.MetingenLijst?.length > 0) {
        return latest.MetingenLijst[0].Meetwaarde?.Waarde_Numeriek ?? null
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching wave height:', error)
    return null
  }
}

// Fetch current speed from RWS API
export async function fetchCurrentSpeed(station: RWSStation): Promise<{ speed: number; direction: number } | null> {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const request = {
    AquoPlusWaarnemingMetadata: {
      AquoMetadata: {
        Compartiment: { Code: 'OW' },
        Grootheid: { Code: 'STROOMSHD' }
      }
    },
    Locatie: {
      X: station.x,
      Y: station.y,
      Code: station.id
    },
    Periode: {
      Begindatumtijd: oneHourAgo.toISOString(),
      Einddatumtijd: now.toISOString()
    }
  }

  try {
    const response = await fetch(`${RWS_API_URL}/OphalenLaatsteWaarnemingen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })

    const data = await response.json()

    if (data.Succesvol && data.WaarnemingenLijst?.length > 0) {
      const latest = data.WaarnemingenLijst[0]
      if (latest.MetingenLijst?.length > 0) {
        const speed = latest.MetingenLijst[0].Meetwaarde?.Waarde_Numeriek ?? null
        // Direction might be in a different field or need a separate request
        return speed !== null ? { speed, direction: 0 } : null
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching current speed:', error)
    return null
  }
}

// Fetch all available water data for a station
export async function fetchAllWaterData(station: RWSStation): Promise<WaterData> {
  const [temperature, waveHeight, current] = await Promise.all([
    fetchWaterTemperature(station),
    fetchWaveHeight(station),
    fetchCurrentSpeed(station)
  ])

  return {
    temperature: temperature ?? undefined,
    waveHeight: waveHeight ?? undefined,
    currentSpeed: current?.speed ?? undefined,
    currentDirection: current?.direction ?? undefined,
    timestamp: new Date(),
    station
  }
}

// Simulated data for development/fallback when API is unavailable
export function getSimulatedWaterData(station: RWSStation): WaterData {
  // Simulate realistic Dutch water data
  const month = new Date().getMonth()

  // Water temperature varies by season (3-20°C in Netherlands)
  const baseTemp = [5, 4, 5, 8, 12, 16, 18, 19, 17, 13, 9, 6][month]
  const temperature = baseTemp + (Math.random() * 2 - 1)

  // Wave height (typically 20-150cm on Dutch coast)
  const waveHeight = 30 + Math.random() * 80

  // Current speed (typically 0-100 cm/s)
  const currentSpeed = Math.random() * 60

  // Current direction (random for simulation)
  const currentDirection = Math.random() * 360

  return {
    temperature: Math.round(temperature * 10) / 10,
    waveHeight: Math.round(waveHeight),
    currentSpeed: Math.round(currentSpeed),
    currentDirection: Math.round(currentDirection),
    timestamp: new Date(),
    station
  }
}
