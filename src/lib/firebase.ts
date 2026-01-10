import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDsC3MhJwjLu-2Gq3rRNP6cfgAQc2sLF88",
  authDomain: "visapp-nl.firebaseapp.com",
  projectId: "visapp-nl",
  storageBucket: "visapp-nl.firebasestorage.app",
  messagingSenderId: "1095904118758",
  appId: "1:1095904118758:web:38f8be80439bcd788a7827"
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Offline persistence failed: Multiple tabs open')
  } else if (err.code === 'unimplemented') {
    console.warn('Offline persistence not available in this browser')
  }
})

// ============================================
// Photo Storage Helpers
// ============================================

/**
 * Upload a catch photo to Firebase Storage
 */
export async function uploadCatchPhoto(
  oderId: string,
  catchId: string,
  photoId: string,
  imageBlob: Blob
): Promise<string> {
  const path = `users/${oderId}/catches/${catchId}/${photoId}.jpg`
  const ref = storageRef(storage, path)
  await uploadBytes(ref, imageBlob, { contentType: 'image/jpeg' })
  return getDownloadURL(ref)
}

/**
 * Delete a photo from Firebase Storage
 */
export async function deletePhotoFromStorage(path: string): Promise<void> {
  const ref = storageRef(storage, path)
  try {
    await deleteObject(ref)
  } catch (error: any) {
    if (error.code !== 'storage/object-not-found') {
      throw error
    }
  }
}

/**
 * Convert base64 data URL to Blob
 */
export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,')
  const contentType = parts[0].split(':')[1]
  const raw = window.atob(parts[1])
  const rawLength = raw.length
  const uInt8Array = new Uint8Array(rawLength)

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i)
  }

  return new Blob([uInt8Array], { type: contentType })
}
