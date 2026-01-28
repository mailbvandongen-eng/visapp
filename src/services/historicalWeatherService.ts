/**
 * Historical Weather Service using Open-Meteo Archive API
 *
 * Fetches historical weather data for a specific date and location.
 * Data available from 1940 to 5 days ago.
 *
 * API: https://archive-api.open-meteo.com/v1/archive
 */

const ARCHIVE_API = 'https://archive-api.open-meteo.com/v1/archive'

export interface HistoricalWeather {
  // Core weather data
  temp: number              // Temperature in Celsius
  humidity: number          // Relative humidity percentage
  pressure: number          // Surface pressure in hPa
  windSpeed: number         // Wind speed in km/h
  windDirection: number     // Wind direction in degrees
  cloudCover: number        // Cloud cover percentage
  precipitation: number     // Precipitation in mm
  weatherCode: number       // WMO weather code

  // Metadata
  date: string              // ISO date string
  fetchedAt: string         // When this data was fetched
}

interface OpenMeteoArchiveResponse {
  latitude: number
  longitude: number
  generationtime_ms: number
  utc_offset_seconds: number
  timezone: string
  hourly: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
    surface_pressure: number[]
    wind_speed_10m: number[]
    wind_direction_10m: number[]
    cloud_cover: number[]
    precipitation: number[]
    weather_code: number[]
  }
}

/**
 * Format a date to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Check if a date is within the supported range for historical data
 * Open-Meteo Archive supports data from 1940 to 5 days ago
 */
export function isDateSupported(date: Date): { supported: boolean; reason?: string } {
  const now = new Date()
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  const minDate = new Date('1940-01-01')

  if (date < minDate) {
    return { supported: false, reason: 'Datum is voor 1940 - geen data beschikbaar' }
  }

  if (date > fiveDaysAgo) {
    return { supported: false, reason: 'Datum is te recent - gebruik huidige weerdata' }
  }

  return { supported: true }
}

/**
 * Fetch historical weather data for a specific date and location
 *
 * @param lat Latitude
 * @param lng Longitude
 * @param date The date to fetch weather for
 * @returns Historical weather data or null if unavailable
 */
export async function fetchHistoricalWeather(
  lat: number,
  lng: number,
  date: Date
): Promise<HistoricalWeather | null> {
  // Check if date is supported
  const dateCheck = isDateSupported(date)
  if (!dateCheck.supported) {
    console.warn('Historical weather not available:', dateCheck.reason)
    return null
  }

  const dateStr = formatDate(date)

  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    start_date: dateStr,
    end_date: dateStr,
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'cloud_cover',
      'precipitation',
      'weather_code'
    ].join(','),
    timezone: 'Europe/Amsterdam'
  })

  try {
    const response = await fetch(`${ARCHIVE_API}?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`Archive API error: ${response.status}`)
    }

    const data: OpenMeteoArchiveResponse = await response.json()

    // Get the hour closest to noon (12:00) for representative daily weather
    // Or use the photo's actual hour if we have it
    const targetHour = date.getHours() || 12
    const hourIndex = Math.min(targetHour, data.hourly.time.length - 1)

    const weather: HistoricalWeather = {
      temp: data.hourly.temperature_2m[hourIndex],
      humidity: data.hourly.relative_humidity_2m[hourIndex],
      pressure: data.hourly.surface_pressure[hourIndex],
      windSpeed: data.hourly.wind_speed_10m[hourIndex],
      windDirection: data.hourly.wind_direction_10m[hourIndex],
      cloudCover: data.hourly.cloud_cover[hourIndex],
      precipitation: data.hourly.precipitation[hourIndex],
      weatherCode: data.hourly.weather_code[hourIndex],
      date: dateStr,
      fetchedAt: new Date().toISOString()
    }

    return weather
  } catch (error) {
    console.error('Failed to fetch historical weather:', error)
    return null
  }
}

/**
 * Get weather description from WMO weather code
 */
export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Helder',
    1: 'Overwegend helder',
    2: 'Half bewolkt',
    3: 'Bewolkt',
    45: 'Mist',
    48: 'Aanvriezende mist',
    51: 'Lichte motregen',
    53: 'Motregen',
    55: 'Zware motregen',
    56: 'Lichte ijzel',
    57: 'Ijzel',
    61: 'Lichte regen',
    63: 'Regen',
    65: 'Zware regen',
    66: 'Lichte ijsregen',
    67: 'Ijsregen',
    71: 'Lichte sneeuw',
    73: 'Sneeuw',
    75: 'Zware sneeuw',
    77: 'Sneeuwkorrels',
    80: 'Lichte regenbuien',
    81: 'Regenbuien',
    82: 'Zware regenbuien',
    85: 'Lichte sneeuwbuien',
    86: 'Sneeuwbuien',
    95: 'Onweer',
    96: 'Onweer met lichte hagel',
    99: 'Onweer met zware hagel'
  }

  return descriptions[code] || 'Onbekend'
}

/**
 * Get wind direction as compass text
 */
export function getWindDirectionText(degrees: number): string {
  const directions = ['N', 'NNO', 'NO', 'ONO', 'O', 'OZO', 'ZO', 'ZZO', 'Z', 'ZZW', 'ZW', 'WZW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

/**
 * Calculate a simple fishing score based on weather conditions
 * Returns a score from 0-100
 */
export function calculateFishingScore(weather: HistoricalWeather): number {
  let score = 50 // Base score

  // Pressure: Stable or slightly falling pressure is best
  // Good range: 1010-1025 hPa
  if (weather.pressure >= 1010 && weather.pressure <= 1025) {
    score += 15
  } else if (weather.pressure < 1000 || weather.pressure > 1035) {
    score -= 10
  }

  // Wind: Light wind is better (under 20 km/h)
  if (weather.windSpeed < 10) {
    score += 10
  } else if (weather.windSpeed < 20) {
    score += 5
  } else if (weather.windSpeed > 30) {
    score -= 15
  }

  // Cloud cover: Overcast often good for fishing
  if (weather.cloudCover >= 50 && weather.cloudCover <= 80) {
    score += 10
  }

  // Precipitation: Light rain can be good, heavy rain is bad
  if (weather.precipitation > 0 && weather.precipitation < 2) {
    score += 5
  } else if (weather.precipitation > 5) {
    score -= 10
  }

  // Temperature: Moderate temps (10-20C) are ideal
  if (weather.temp >= 10 && weather.temp <= 20) {
    score += 10
  } else if (weather.temp < 5 || weather.temp > 25) {
    score -= 5
  }

  return Math.max(0, Math.min(100, score))
}
