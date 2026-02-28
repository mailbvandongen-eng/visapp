import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FirebaseError } from 'firebase/app'
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { auth } from '../lib/firebase'

// Simple password for app access (backup)
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'visvriend2024'

interface AuthState {
  // Password auth
  isAuthenticated: boolean
  checkPassword: (password: string) => boolean

  // Google auth
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      loading: true,

      checkPassword: (password: string) => {
        const isValid = password === APP_PASSWORD
        if (isValid) {
          set({ isAuthenticated: true })
        }
        return isValid
      },

      signInWithGoogle: async () => {
        try {
          const result = await signInWithPopup(auth, googleProvider)
          set({ user: result.user, isAuthenticated: true })
        } catch (error) {
          console.error('Google sign-in error:', error)
          throw new Error(getGoogleAuthErrorMessage(error))
        }
      },

      logout: async () => {
        try {
          await signOut(auth)
          set({ user: null, isAuthenticated: false })
        } catch (error) {
          console.error('Logout error:', error)
        }
      },

      initAuth: () => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            set({ user, isAuthenticated: true, loading: false })
          } else {
            set({ user: null, isAuthenticated: false, loading: false })
          }
        })

        return unsubscribe
      }
    }),
    {
      name: 'visapp-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
