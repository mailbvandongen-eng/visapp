import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
  getAuthUrl,
  parseAccessTokenFromUrl,
  createSession,
  openPicker,
  pollSession,
  getPollInterval,
  getSelectedMediaItems,
  deleteSession,
  getDownloadUrl,
  calculateUrlExpiration,
  isUrlExpired,
  getPhotoUrl,
  type PickerMediaItem
} from '../services/googlePhotosService'
import { extractMetadataFromPhoto } from '../lib/exifUtils'
import { fetchHistoricalWeather, type HistoricalWeather } from '../services/historicalWeatherService'
import { storePhotoFromUrl, deleteStoredPhoto, clearAllPhotos } from '../services/photoStorageService'

export interface GooglePhoto {
  id: string                                    // Internal ID
  googleId: string                              // Google Photos item ID
  baseUrl: string                               // Temporary URL (60 min)
  urlExpiresAt: number                          // Timestamp when URL expires
  filename: string
  mimeType: string

  // Extracted metadata
  location: { lat: number; lng: number } | null
  dateTime: Date | null

  // Fetched weather (optional)
  weather: HistoricalWeather | null
  weatherFetchedAt: string | null

  // Display state
  isOnMap: boolean
  isRegisteredAsCatch: boolean

  // Local storage
  isStoredLocally: boolean
}

interface GooglePhotosState {
  // Auth
  accessToken: string | null
  tokenExpiresAt: number | null

  // Session
  currentSessionId: string | null
  isPickerOpen: boolean
  isLoading: boolean
  error: string | null

  // Photos
  photos: GooglePhoto[]
  selectedPhotoId: string | null

  // Dialog state
  photoActionDialogOpen: boolean

  // Actions
  startAuth: () => void
  handleAuthCallback: () => boolean
  checkAndRefreshAuth: () => boolean
  openPhotoPicker: () => Promise<void>
  addPhoto: (photo: GooglePhoto) => void
  updatePhoto: (id: string, updates: Partial<GooglePhoto>) => void
  removePhoto: (id: string) => void
  selectPhoto: (id: string | null) => void
  fetchWeatherForPhoto: (id: string) => Promise<void>
  openPhotoActionDialog: (photoId: string) => void
  closePhotoActionDialog: () => void
  clearAll: () => void
  setError: (error: string | null) => void
  logout: () => void
}

// Generate unique ID for photos
function generatePhotoId(): string {
  return `gphoto_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export const useGooglePhotosStore = create<GooglePhotosState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      accessToken: null,
      tokenExpiresAt: null,
      currentSessionId: null,
      isPickerOpen: false,
      isLoading: false,
      error: null,
      photos: [],
      selectedPhotoId: null,
      photoActionDialogOpen: false,

      startAuth: () => {
        const authUrl = getAuthUrl()
        window.location.href = authUrl
      },

      handleAuthCallback: () => {
        const result = parseAccessTokenFromUrl()
        if (result) {
          set(state => {
            state.accessToken = result.token
            state.tokenExpiresAt = Date.now() + result.expiresIn * 1000
            state.error = null
          })
          return true
        }
        return false
      },

      checkAndRefreshAuth: () => {
        const { accessToken, tokenExpiresAt } = get()
        if (!accessToken || !tokenExpiresAt) return false
        // Token is expired if less than 5 minutes remaining
        if (Date.now() > tokenExpiresAt - 5 * 60 * 1000) {
          set(state => {
            state.accessToken = null
            state.tokenExpiresAt = null
          })
          return false
        }
        return true
      },

      openPhotoPicker: async () => {
        const { accessToken, checkAndRefreshAuth } = get()

        if (!checkAndRefreshAuth() || !accessToken) {
          get().startAuth()
          return
        }

        set(state => {
          state.isLoading = true
          state.error = null
        })

        try {
          // Create session
          console.log('[Google Photos] Creating session...')
          const session = await createSession(accessToken)
          console.log('[Google Photos] Session created:', session)
          set(state => {
            state.currentSessionId = session.id
          })

          // Open picker
          console.log('[Google Photos] Opening picker:', session.pickerUri)
          const pickerWindow = openPicker(session.pickerUri)
          if (!pickerWindow) {
            throw new Error('Popup geblokkeerd. Sta popups toe voor deze site.')
          }

          set(state => {
            state.isPickerOpen = true
          })

          // Poll for completion
          const pollInterval = getPollInterval(session)
          let attempts = 0
          const maxAttempts = 120 // 10 minutes max with 5 second intervals

          const poll = async (): Promise<void> => {
            attempts++
            console.log(`[Google Photos] Poll attempt ${attempts}/${maxAttempts}`)

            if (attempts > maxAttempts) {
              throw new Error('Timeout bij wachten op foto selectie')
            }

            // Poll session status (don't rely on window.closed due to COOP)
            const sessionStatus = await pollSession(accessToken, session.id)
            console.log('[Google Photos] Session status:', sessionStatus)

            if (sessionStatus.mediaItemsSet) {
              console.log('[Google Photos] User finished selecting, fetching items...')
              // Get selected items
              const items = await getSelectedMediaItems(accessToken, session.id)
              console.log('[Google Photos] Got items:', items.length, items)

              // Process each item
              for (const item of items) {
                await processMediaItem(item, set, get)
              }

              // Cleanup
              await deleteSession(accessToken, session.id)

              set(state => {
                state.isLoading = false
                state.isPickerOpen = false
                state.currentSessionId = null
              })
              return
            }

            // Continue polling
            await new Promise(resolve => setTimeout(resolve, pollInterval))
            await poll()
          }

          await poll()
        } catch (error) {
          console.error('Google Photos picker error:', error)
          set(state => {
            state.isLoading = false
            state.isPickerOpen = false
            state.error = error instanceof Error ? error.message : 'Onbekende fout'
          })

          // Cleanup session if exists
          const { currentSessionId } = get()
          if (currentSessionId && accessToken) {
            try {
              await deleteSession(accessToken, currentSessionId)
            } catch {
              // Ignore cleanup errors
            }
          }

          set(state => {
            state.currentSessionId = null
          })
        }
      },

      addPhoto: (photo) => {
        set(state => {
          state.photos.push(photo)
        })
      },

      updatePhoto: (id, updates) => {
        set(state => {
          const index = state.photos.findIndex(p => p.id === id)
          if (index !== -1) {
            Object.assign(state.photos[index], updates)
          }
        })
      },

      removePhoto: (id) => {
        // Delete from IndexedDB
        deleteStoredPhoto(id).catch(console.error)

        set(state => {
          state.photos = state.photos.filter(p => p.id !== id)
          if (state.selectedPhotoId === id) {
            state.selectedPhotoId = null
            state.photoActionDialogOpen = false
          }
        })
      },

      selectPhoto: (id) => {
        set(state => {
          state.selectedPhotoId = id
        })
      },

      fetchWeatherForPhoto: async (id) => {
        const photo = get().photos.find(p => p.id === id)
        if (!photo || !photo.location || !photo.dateTime) {
          console.warn('Cannot fetch weather: missing location or date')
          return
        }

        try {
          const weather = await fetchHistoricalWeather(
            photo.location.lat,
            photo.location.lng,
            photo.dateTime
          )

          if (weather) {
            set(state => {
              const index = state.photos.findIndex(p => p.id === id)
              if (index !== -1) {
                state.photos[index].weather = weather
                state.photos[index].weatherFetchedAt = new Date().toISOString()
              }
            })
          }
        } catch (error) {
          console.error('Failed to fetch historical weather:', error)
        }
      },

      openPhotoActionDialog: (photoId) => {
        set(state => {
          state.selectedPhotoId = photoId
          state.photoActionDialogOpen = true
        })
      },

      closePhotoActionDialog: () => {
        set(state => {
          state.photoActionDialogOpen = false
          // Keep selectedPhotoId for potential follow-up actions
        })
      },

      clearAll: () => {
        // Clear IndexedDB photos
        clearAllPhotos().catch(console.error)

        set(state => {
          state.photos = []
          state.selectedPhotoId = null
          state.photoActionDialogOpen = false
        })
      },

      setError: (error) => {
        set(state => {
          state.error = error
        })
      },

      logout: () => {
        // Clear IndexedDB photos on logout
        clearAllPhotos().catch(console.error)

        set(state => {
          state.accessToken = null
          state.tokenExpiresAt = null
          state.photos = []
          state.selectedPhotoId = null
          state.photoActionDialogOpen = false
          state.error = null
        })
      }
    })),
    {
      name: 'visapp-google-photos',
      partialize: (state) => ({
        accessToken: state.accessToken,
        tokenExpiresAt: state.tokenExpiresAt,
        // Store photos but they'll need URL refresh
        photos: state.photos.map(p => ({
          ...p,
          // Convert Date back to serializable format
          dateTime: p.dateTime ? p.dateTime.toISOString() : null
        }))
      }),
      onRehydrate: () => (state) => {
        if (state) {
          // Rehydrate Date objects
          state.photos = state.photos.map(p => ({
            ...p,
            dateTime: p.dateTime ? new Date(p.dateTime as unknown as string) : null
          }))
        }
      }
    }
  )
)

/**
 * Process a media item from Google Photos picker
 */
async function processMediaItem(
  item: PickerMediaItem,
  set: (fn: (state: GooglePhotosState) => void) => void,
  get: () => GooglePhotosState
): Promise<void> {
  const baseUrl = item.mediaFile.baseUrl
  const photoId = generatePhotoId()

  // Try to extract metadata from the photo
  let location: { lat: number; lng: number } | null = null
  let dateTime: Date | null = null

  try {
    // Fetch the photo to extract EXIF
    const downloadUrl = getDownloadUrl(baseUrl)
    const response = await fetch(downloadUrl)
    if (response.ok) {
      const blob = await response.blob()
      const file = new File([blob], item.mediaFile.filename, { type: item.mediaFile.mimeType })
      const metadata = await extractMetadataFromPhoto(file)
      location = metadata.gps
      dateTime = metadata.dateTime
    }
  } catch (error) {
    console.warn('Could not extract EXIF metadata:', error)
  }

  // Store photo locally in IndexedDB (800px version for display)
  let isStoredLocally = false
  try {
    const photoUrl = getPhotoUrl(baseUrl, 800, 800)
    const stored = await storePhotoFromUrl(photoId, photoUrl)
    isStoredLocally = stored !== null
  } catch (error) {
    console.warn('Could not store photo locally:', error)
  }

  const photo: GooglePhoto = {
    id: photoId,
    googleId: item.id,
    baseUrl: baseUrl,
    urlExpiresAt: calculateUrlExpiration(),
    filename: item.mediaFile.filename,
    mimeType: item.mediaFile.mimeType,
    location,
    dateTime,
    weather: null,
    weatherFetchedAt: null,
    isOnMap: false,
    isRegisteredAsCatch: false,
    isStoredLocally
  }

  console.log('[Google Photos] Adding photo to store:', photo)

  set(state => {
    state.photos.push(photo)
  })

  // Always show the photo action dialog so user can see the result
  set(state => {
    state.selectedPhotoId = photo.id
    state.photoActionDialogOpen = true
  })
}

/**
 * Get the selected photo from the store
 */
export function useSelectedGooglePhoto(): GooglePhoto | null {
  const photos = useGooglePhotosStore(state => state.photos)
  const selectedPhotoId = useGooglePhotosStore(state => state.selectedPhotoId)
  return photos.find(p => p.id === selectedPhotoId) || null
}

/**
 * Get photos that are displayed on the map
 */
export function useMapGooglePhotos(): GooglePhoto[] {
  const photos = useGooglePhotosStore(state => state.photos)
  return photos.filter(p => p.isOnMap && p.location !== null)
}

/**
 * Check if a photo URL needs refresh
 */
export function needsUrlRefresh(photo: GooglePhoto): boolean {
  return isUrlExpired(photo.urlExpiresAt)
}
