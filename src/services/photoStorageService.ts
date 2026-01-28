/**
 * IndexedDB Photo Storage Service
 *
 * Stores photos locally in the browser using IndexedDB.
 * This avoids the 60-minute URL expiration from Google Photos.
 *
 * Storage capacity: 50MB - 500MB+ depending on browser
 * Photo size: ~100KB each (800px, 70% JPEG quality)
 */

const DB_NAME = 'visapp-photos'
const DB_VERSION = 1
const STORE_NAME = 'photos'

// Target size for stored photos (good balance of quality vs size)
const MAX_PHOTO_WIDTH = 800
const MAX_PHOTO_HEIGHT = 800
const JPEG_QUALITY = 0.7

interface StoredPhoto {
  id: string           // Same as GooglePhoto.id
  dataUrl: string      // Base64 data URL of the image
  thumbnailUrl: string // Smaller thumbnail for list views
  storedAt: number     // Timestamp when stored
  originalSize: number // Original file size for stats
  storedSize: number   // Compressed size
}

let dbInstance: IDBDatabase | null = null

/**
 * Open/create the IndexedDB database
 */
async function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create photos store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('storedAt', 'storedAt', { unique: false })
      }
    }
  })
}

/**
 * Resize and compress an image to reduce storage size
 */
async function compressImage(
  blob: Blob,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<{ dataUrl: string; size: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Calculate new dimensions
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // Draw to canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', quality)

      resolve({
        dataUrl,
        size: Math.round(dataUrl.length * 0.75) // Approximate bytes from base64
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Create a small thumbnail for list views
 */
async function createThumbnail(blob: Blob): Promise<string> {
  const result = await compressImage(blob, 200, 200, 0.6)
  return result.dataUrl
}

/**
 * Store a photo from a URL (Google Photos baseUrl)
 * Uses img element to bypass CORS restrictions
 */
export async function storePhotoFromUrl(
  id: string,
  imageUrl: string
): Promise<StoredPhoto | null> {
  try {
    // Load image via img element (bypasses CORS for display)
    const img = new Image()
    img.crossOrigin = 'anonymous'

    const loadPromise = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image'))
    })

    img.src = imageUrl

    try {
      await loadPromise
    } catch {
      // If CORS fails, try without crossOrigin (won't be able to read pixels but can display)
      console.warn('CORS blocked, trying without crossOrigin...')
      img.crossOrigin = ''
      img.src = imageUrl
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image even without CORS'))
      })
    }

    // Draw to canvas to get data URL
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    // Scale down if needed
    let width = img.naturalWidth
    let height = img.naturalHeight

    if (width > MAX_PHOTO_WIDTH || height > MAX_PHOTO_HEIGHT) {
      const ratio = Math.min(MAX_PHOTO_WIDTH / width, MAX_PHOTO_HEIGHT / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    canvas.width = width
    canvas.height = height
    ctx.drawImage(img, 0, 0, width, height)

    let dataUrl: string
    let storedSize: number

    try {
      dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      storedSize = Math.round(dataUrl.length * 0.75) // Approximate size
    } catch {
      // Canvas tainted by CORS - can't extract data
      console.warn('Canvas tainted by CORS, photo will not be stored locally')
      return null
    }

    // Create thumbnail
    const thumbCanvas = document.createElement('canvas')
    const thumbCtx = thumbCanvas.getContext('2d')
    if (!thumbCtx) throw new Error('Could not get thumbnail canvas context')

    const thumbSize = 150
    thumbCanvas.width = thumbSize
    thumbCanvas.height = thumbSize

    const minDim = Math.min(img.naturalWidth, img.naturalHeight)
    const sx = (img.naturalWidth - minDim) / 2
    const sy = (img.naturalHeight - minDim) / 2

    thumbCtx.drawImage(img, sx, sy, minDim, minDim, 0, 0, thumbSize, thumbSize)

    let thumbnailUrl: string
    try {
      thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.7)
    } catch {
      thumbnailUrl = ''
    }

    const storedPhoto: StoredPhoto = {
      id,
      dataUrl,
      thumbnailUrl,
      storedAt: Date.now(),
      originalSize: img.naturalWidth * img.naturalHeight * 4, // Estimate
      storedSize
    }

    // Store in IndexedDB
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(storedPhoto)

      request.onsuccess = () => {
        console.log(`📸 Photo stored: ${id} (${(storedSize / 1024).toFixed(1)} KB)`)
        resolve(storedPhoto)
      }

      request.onerror = () => {
        console.error('Failed to store photo:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Failed to store photo from URL:', error)
    return null
  }
}

/**
 * Get a stored photo by ID
 */
export async function getStoredPhoto(id: string): Promise<StoredPhoto | null> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Failed to get stored photo:', error)
    return null
  }
}

/**
 * Delete a stored photo
 */
export async function deleteStoredPhoto(id: string): Promise<boolean> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => {
        console.log(`🗑️ Photo deleted: ${id}`)
        resolve(true)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Failed to delete stored photo:', error)
    return false
  }
}

/**
 * Get all stored photos
 */
export async function getAllStoredPhotos(): Promise<StoredPhoto[]> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Failed to get all stored photos:', error)
    return []
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  count: number
  totalSize: number
  totalSizeFormatted: string
}> {
  const photos = await getAllStoredPhotos()
  const totalSize = photos.reduce((sum, p) => sum + p.storedSize, 0)

  return {
    count: photos.length,
    totalSize,
    totalSizeFormatted: totalSize > 1024 * 1024
      ? `${(totalSize / (1024 * 1024)).toFixed(1)} MB`
      : `${(totalSize / 1024).toFixed(0)} KB`
  }
}

/**
 * Clear all stored photos
 */
export async function clearAllPhotos(): Promise<void> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        console.log('🗑️ All photos cleared')
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Failed to clear photos:', error)
  }
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}
