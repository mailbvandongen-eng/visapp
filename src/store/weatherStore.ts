import { create } from 'zustand'

interface CurrentWeather {
  temperature: number
  windSpeed: number
  windDirection: number
  pressure: number
  humidity: number
  weatherCode: number
}

interface PressureDataPoint {
  time: string
  pressure: number
}

interface HourlyForecast {
  time: string
  temperature: number
  windSpeed: number
  windDirection: number
  pressure: number
  weatherCode: number
}

interface WeatherState {
  current: CurrentWeather | null
  pressureHistory: PressureDataPoint[]
  hourlyForecast: HourlyForecast[]
  loading: boolean
  lastUpdate: number | null
  error: string | null

  fetchWeather: (lat: number, lon: number) => Promise<void>
  getFishingCondition: () => 'excellent' | 'good' | 'moderate' | 'poor'
  getFishingScore: () => number
  getPressureTrend: () => 'rising' | 'falling' | 'stable'
  getWeatherAtTime: (time: Date) => HourlyForecast | null
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  current: null,
  pressureHistory: [],
  hourlyForecast: [],
  loading: false,
  lastUpdate: null,
  error: null,

  fetchWeather: async (lat, lon) => {
    set({ loading: true, error: null })

    try {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: 'temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code',
        hourly: 'temperature_2m,wind_speed_10m,wind_direction_10m,surface_pressure,weather_code',
        past_hours: '24',
        forecast_hours: '48',
        timezone: 'Europe/Amsterdam'
      })

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
      const data = await response.json()

      // Parse hourly pressure data
      let pressureHistory: PressureDataPoint[] = []
      let hourlyForecast: HourlyForecast[] = []

      if (data.hourly?.time && data.hourly?.surface_pressure) {
        pressureHistory = data.hourly.time.map((time: string, i: number) => ({
          time,
          pressure: data.hourly.surface_pressure[i]
        }))

        hourlyForecast = data.hourly.time.map((time: string, i: number) => ({
          time,
          temperature: data.hourly.temperature_2m[i],
          windSpeed: data.hourly.wind_speed_10m[i],
          windDirection: data.hourly.wind_direction_10m[i],
          pressure: data.hourly.surface_pressure[i],
          weatherCode: data.hourly.weather_code[i]
        }))
      }

      if (data.current) {
        set({
          current: {
            temperature: data.current.temperature_2m,
            windSpeed: data.current.wind_speed_10m,
            windDirection: data.current.wind_direction_10m,
            pressure: data.current.surface_pressure,
            humidity: data.current.relative_humidity_2m,
            weatherCode: data.current.weather_code
          },
          pressureHistory,
          hourlyForecast,
          loading: false,
          lastUpdate: Date.now()
        })
      }
    } catch (error) {
      set({
        error: 'Kon weer niet ophalen',
        loading: false
      })
    }
  },

  getFishingCondition: () => {
    const { current } = get()
    if (!current) return 'moderate'

    let score = 0

    // Wind: licht is goed voor vissen
    if (current.windSpeed < 15) score += 2
    else if (current.windSpeed < 25) score += 1
    else score -= 1

    // Druk: stabiele of stijgende druk is goed
    if (current.pressure > 1013) score += 1
    if (current.pressure > 1020) score += 1

    // Temperatuur: 10-20 graden is ideaal
    if (current.temperature >= 10 && current.temperature <= 20) score += 2
    else if (current.temperature >= 5 && current.temperature <= 25) score += 1

    // Bewolking/regen (weather code)
    if (current.weatherCode < 50) score += 1 // geen neerslag

    if (score >= 5) return 'excellent'
    if (score >= 3) return 'good'
    if (score >= 1) return 'moderate'
    return 'poor'
  },

  getFishingScore: () => {
    const { current } = get()
    if (!current) return 1

    let score = 0

    // Wind: licht is goed voor vissen
    if (current.windSpeed < 15) score += 2
    else if (current.windSpeed < 25) score += 1
    else score -= 1

    // Druk: stabiele of stijgende druk is goed
    if (current.pressure > 1013) score += 1
    if (current.pressure > 1020) score += 1

    // Temperatuur: 10-20 graden is ideaal
    if (current.temperature >= 10 && current.temperature <= 20) score += 2
    else if (current.temperature >= 5 && current.temperature <= 25) score += 1

    // Bewolking/regen (weather code)
    if (current.weatherCode < 50) score += 1 // geen neerslag

    // Normalize to 0-3 scale
    return Math.max(0, Math.min(3, score / 2))
  },

  getPressureTrend: () => {
    const { pressureHistory } = get()
    if (pressureHistory.length < 6) return 'stable'

    // Compare last 6 hours average with 6 hours before that
    const recent = pressureHistory.slice(-6)
    const earlier = pressureHistory.slice(-12, -6)

    if (earlier.length === 0) return 'stable'

    const recentAvg = recent.reduce((sum, p) => sum + p.pressure, 0) / recent.length
    const earlierAvg = earlier.reduce((sum, p) => sum + p.pressure, 0) / earlier.length
    const diff = recentAvg - earlierAvg

    if (diff > 2) return 'rising'
    if (diff < -2) return 'falling'
    return 'stable'
  },

  getWeatherAtTime: (time: Date) => {
    const { hourlyForecast } = get()
    if (hourlyForecast.length === 0) return null

    const targetTime = time.toISOString().slice(0, 13) + ':00'

    // Find closest forecast
    let closest = hourlyForecast[0]
    let minDiff = Infinity

    for (const forecast of hourlyForecast) {
      const forecastTime = new Date(forecast.time).getTime()
      const diff = Math.abs(forecastTime - time.getTime())
      if (diff < minDiff) {
        minDiff = diff
        closest = forecast
      }
    }

    return closest
  }
}))
