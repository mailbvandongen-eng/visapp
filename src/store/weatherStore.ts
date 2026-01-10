import { create } from 'zustand'

interface CurrentWeather {
  temperature: number
  windSpeed: number
  windDirection: number
  pressure: number
  humidity: number
  weatherCode: number
}

interface WeatherState {
  current: CurrentWeather | null
  loading: boolean
  lastUpdate: number | null
  error: string | null

  fetchWeather: (lat: number, lon: number) => Promise<void>
  getFishingCondition: () => 'excellent' | 'good' | 'moderate' | 'poor'
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  current: null,
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
        timezone: 'Europe/Amsterdam'
      })

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
      const data = await response.json()

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
  }
}))
