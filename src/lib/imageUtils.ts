/**
 * Image utility functions for resizing, compressing and converting images
 */

const MAX_THUMBNAIL_SIZE = 200
const JPEG_QUALITY = 0.7

/**
 * Resize an image to fit within maxSize while maintaining aspect ratio
 */
export async function resizeImage(file: File, maxSize: number = MAX_THUMBNAIL_SIZE): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and export
      ctx?.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Convert a Blob to base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert blob to base64'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read blob'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Process an image file: resize to thumbnail and return both blob and base64
 */
export async function processImageForUpload(file: File): Promise<{
  thumbnailBlob: Blob
  thumbnailBase64: string
}> {
  const thumbnailBlob = await resizeImage(file, MAX_THUMBNAIL_SIZE)
  const thumbnailBase64 = await blobToBase64(thumbnailBlob)

  return {
    thumbnailBlob,
    thumbnailBase64
  }
}

/**
 * Generate a unique ID for photos
 */
export function generatePhotoId(): string {
  return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
