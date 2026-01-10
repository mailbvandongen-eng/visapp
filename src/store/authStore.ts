import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Simple password for app access
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'visvriend2024'

interface AuthState {
  isAuthenticated: boolean
  checkPassword: (password: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,

      checkPassword: (password: string) => {
        const isValid = password === APP_PASSWORD
        if (isValid) {
          set({ isAuthenticated: true })
        }
        return isValid
      },

      logout: () => {
        set({ isAuthenticated: false })
      }
    }),
    {
      name: 'visapp-auth'
    }
  )
)
