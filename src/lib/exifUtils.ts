/**
 * EXIF GPS extraction utilities
 * Extracts GPS coordinates from photo EXIF data
 */

interface GPSCoordinates {
  lat: number
  lng: number
}

/**
 * Extract GPS coordinates from an image file's EXIF data
 * Returns null if no GPS data is found
 */
export async function extractGPSFromPhoto(file: File): Promise<GPSCoordinates | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer)

      // Check for JPEG
      if (view.getUint16(0) !== 0xFFD8) {
        resolve(null)
        return
      }

      let offset = 2
      const length = view.byteLength

      while (offset < length) {
        const marker = view.getUint16(offset)
        offset += 2

        // APP1 marker (EXIF)
        if (marker === 0xFFE1) {
          const exifLength = view.getUint16(offset)

          // Check for "Exif" header
          const exifHeader = view.getUint32(offset + 2)
          if (exifHeader !== 0x45786966) { // "Exif"
            offset += exifLength
            continue
          }

          // Parse TIFF header
          const tiffOffset = offset + 8
          const littleEndian = view.getUint16(tiffOffset) === 0x4949

          const gps = parseExifGPS(view, tiffOffset, littleEndian)
          resolve(gps)
          return
        }

        // Skip other markers
        if ((marker & 0xFF00) === 0xFF00) {
          offset += view.getUint16(offset)
        } else {
          break
        }
      }

      resolve(null)
    }

    reader.onerror = () => resolve(null)
    reader.readAsArrayBuffer(file)
  })
}

function parseExifGPS(view: DataView, tiffOffset: number, littleEndian: boolean): GPSCoordinates | null {
  try {
    const ifdOffset = tiffOffset + view.getUint32(tiffOffset + 4, littleEndian)
    const numEntries = view.getUint16(ifdOffset, littleEndian)

    let gpsIFDOffset: number | null = null

    // Find GPS IFD pointer in IFD0
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 2 + i * 12
      const tag = view.getUint16(entryOffset, littleEndian)

      if (tag === 0x8825) { // GPS IFD Pointer
        gpsIFDOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian)
        break
      }
    }

    if (!gpsIFDOffset) return null

    // Parse GPS IFD
    const gpsEntries = view.getUint16(gpsIFDOffset, littleEndian)

    let latRef: string | null = null
    let lat: number[] | null = null
    let lngRef: string | null = null
    let lng: number[] | null = null

    for (let i = 0; i < gpsEntries; i++) {
      const entryOffset = gpsIFDOffset + 2 + i * 12
      const tag = view.getUint16(entryOffset, littleEndian)
      const type = view.getUint16(entryOffset + 2, littleEndian)
      const count = view.getUint32(entryOffset + 4, littleEndian)
      const valueOffset = entryOffset + 8

      switch (tag) {
        case 0x0001: // GPSLatitudeRef
          latRef = String.fromCharCode(view.getUint8(valueOffset))
          break
        case 0x0002: // GPSLatitude
          lat = readRationalArray(view, tiffOffset + view.getUint32(valueOffset, littleEndian), 3, littleEndian)
          break
        case 0x0003: // GPSLongitudeRef
          lngRef = String.fromCharCode(view.getUint8(valueOffset))
          break
        case 0x0004: // GPSLongitude
          lng = readRationalArray(view, tiffOffset + view.getUint32(valueOffset, littleEndian), 3, littleEndian)
          break
      }
    }

    if (lat && lng && latRef && lngRef) {
      const latitude = convertDMSToDD(lat[0], lat[1], lat[2], latRef)
      const longitude = convertDMSToDD(lng[0], lng[1], lng[2], lngRef)

      if (!isNaN(latitude) && !isNaN(longitude)) {
        return { lat: latitude, lng: longitude }
      }
    }

    return null
  } catch {
    return null
  }
}

function readRationalArray(view: DataView, offset: number, count: number, littleEndian: boolean): number[] {
  const values: number[] = []
  for (let i = 0; i < count; i++) {
    const numerator = view.getUint32(offset + i * 8, littleEndian)
    const denominator = view.getUint32(offset + i * 8 + 4, littleEndian)
    values.push(denominator === 0 ? 0 : numerator / denominator)
  }
  return values
}

function convertDMSToDD(degrees: number, minutes: number, seconds: number, ref: string): number {
  let dd = degrees + minutes / 60 + seconds / 3600
  if (ref === 'S' || ref === 'W') {
    dd = -dd
  }
  return dd
}

/**
 * Check if coordinates are valid (within Netherlands area roughly)
 */
export function isValidDutchCoordinate(lat: number, lng: number): boolean {
  // Netherlands bounding box (roughly)
  return lat >= 50.5 && lat <= 53.7 && lng >= 3.3 && lng <= 7.3
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}
