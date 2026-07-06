import { create } from 'zustand'
import type { FirebaseError } from 'firebase/app'
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { auth } from '../lib/firebase'

interface AuthState {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  initAuth: () => () => void
}

const googleProvider = new GoogleAuthProvider()

function getGoogleAuthErrorMessage(error: unknown): string {
  const firebaseError = error as FirebaseError | undefined
  const code = firebaseError?.code

  if (code === 'auth/unauthorized-domain') {
    return 'Google login faalt: domein niet geautoriseerd in Firebase Auth (gebruik lokaal bij voorkeur localhost).'
  }
  if (code === 'auth/popup-blocked') {
    return 'Google login faalt: popup geblokkeerd door de browser.'
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google login geannuleerd: popup is gesloten.'
  }

  return firebaseError?.message || 'Google login mislukt'
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,

  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      set({ user: result.user })
    } catch (error) {
      console.error('Google sign-in error:', error)
      throw new Error(getGoogleAuthErrorMessage(error))
    }
  },

  logout: async () => {
    try {
      await signOut(auth)
      set({ user: null })
    } catch (error) {
      console.error('Logout error:', error)
    }
  },

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, loading: false })
    })

    return unsubscribe
  }
}))
