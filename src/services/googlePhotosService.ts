/**
 * Google Photos Picker API Service
 *
 * Uses the new Picker API (not the deprecated Library API).
 * Scope: https://www.googleapis.com/auth/photospicker.mediaitems.readonly
 *
 * Flow: OAuth → Create Session → Open Picker → Poll → Get Items → Delete Session
 */

const PICKER_API_BASE = 'https://photospicker.googleapis.com/v1'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const SCOPES = 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly'

// Interfaces
export interface PickerSession {
  id: string
  pickerUri: string
  pollingConfig?: {
    pollInterval: string  // e.g. "3s"
    timeoutIn: string     // e.g. "300s"
  }
  mediaItemsSet?: boolean
}

export interface PickerMediaItem {
  id: string
  baseUrl: string
  mimeType: string
  mediaFile: {
    filename: string
    mimeType: string
    baseUrl: string
  }
}

export interface MediaItemsResponse {
  mediaItems?: PickerMediaItem[]
  nextPageToken?: string
}

/**
 * Generate OAuth URL for Google Photos Picker authorization
 */
export function getAuthUrl(): string {
  const redirectUri = window.location.origin + window.location.pathname

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: SCOPES,
    include_granted_scopes: 'true',
    prompt: 'consent',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Parse access token from URL hash after OAuth redirect
 */
export function parseAccessTokenFromUrl(): { token: string; expiresIn: number } | null {
  const hash = window.location.hash.substring(1)
  if (!hash) return null

  const params = new URLSearchParams(hash)
  const accessToken = params.get('access_token')
  const expiresIn = params.get('expires_in')

  if (!accessToken) return null

  // Clean URL hash
  window.history.replaceState(null, '', window.location.pathname + window.location.search)

  return {
    token: accessToken,
    expiresIn: expiresIn ? parseInt(expiresIn) : 3600
  }
}

/**
 * Create a new picker session
 */
export async function createSession(accessToken: string): Promise<PickerSession> {
  const response = await fetch(`${PICKER_API_BASE}/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create session: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * Open the Google Photos Picker in a new window
 * @returns The window reference or null if blocked
 */
export function openPicker(pickerUri: string): Window | null {
  // /autoclose makes the window close automatically after selection
  const url = pickerUri + '/autoclose'
  return window.open(url, 'google-photos-picker', 'width=900,height=700,scrollbars=yes')
}

/**
 * Poll the session to check if user has finished selecting photos
 */
export async function pollSession(accessToken: string, sessionId: string): Promise<PickerSession> {
  const response = await fetch(`${PICKER_API_BASE}/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to poll session: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * Get the poll interval from session config (default 5 seconds)
 */
export function getPollInterval(session: PickerSession): number {
  if (session.pollingConfig?.pollInterval) {
    // Parse "3s" format
    const match = session.pollingConfig.pollInterval.match(/(\d+)/)
    if (match) {
      return parseInt(match[1]) * 1000
    }
  }
  return 5000 // Default 5 seconds
}

/**
 * Get all selected media items from the session
 */
export async function getSelectedMediaItems(
  accessToken: string,
  sessionId: string
): Promise<PickerMediaItem[]> {
  const items: PickerMediaItem[] = []
  let pageToken = ''

  do {
    const url = new URL(`${PICKER_API_BASE}/mediaItems`)
    url.searchParams.set('sessionId', sessionId)
    url.searchParams.set('pageSize', '100')
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken)
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get media items: ${response.status} - ${error}`)
    }

    const data: MediaItemsResponse = await response.json()
    if (data.mediaItems) {
      items.push(...data.mediaItems)
    }
    pageToken = data.nextPageToken || ''
  } while (pageToken)

  return items
}

/**
 * Delete the picker session (cleanup)
 */
export async function deleteSession(accessToken: string, sessionId: string): Promise<void> {
  await fetch(`${PICKER_API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

/**
 * Get a thumbnail URL from a base URL
 * @param baseUrl The base URL from Google Photos
 * @param size Thumbnail size in pixels (default 300)
 */
export function getThumbnailUrl(baseUrl: string, size = 300): string {
  return `${baseUrl}=w${size}-h${size}-c`
}

/**
 * Get a photo URL with specific dimensions
 */
export function getPhotoUrl(baseUrl: string, width = 800, height = 600): string {
  return `${baseUrl}=w${width}-h${height}`
}

/**
 * Get the download URL for the original photo
 * This URL can be used to fetch the photo with EXIF data
 */
export function getDownloadUrl(baseUrl: string): string {
  return `${baseUrl}=d`
}

/**
 * Check if a base URL has expired (60 minute lifetime)
 */
export function isUrlExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt
}

/**
 * Calculate the expiration timestamp for a base URL (60 minutes from now)
 */
export function calculateUrlExpiration(): number {
  return Date.now() + 60 * 60 * 1000 // 60 minutes
}
