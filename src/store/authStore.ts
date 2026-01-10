import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
  initAuth: () => void
}

const googleProvider = new GoogleAuthProvider()

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
          throw error
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
        onAuthStateChanged(auth, (user) => {
          if (user) {
            set({ user, isAuthenticated: true, loading: false })
          } else {
            set({ user: null, loading: false })
          }
        })
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
