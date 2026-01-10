import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Fish, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface PasswordGateProps {
  children: React.ReactNode
}

export function PasswordGate({ children }: PasswordGateProps) {
  const { isAuthenticated, checkPassword } = useAuthStore()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (isAuthenticated) {
    return <>{children}</>
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isValid = checkPassword(password)
    if (!isValid) {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Fish size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">VisApp</h1>
          <p className="text-gray-500 text-sm mt-1">Voor jou en je vismaat</p>
        </div>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock size={20} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wachtwoord"
              className={`w-full pl-10 pr-12 py-3 rounded-lg border-2 transition-colors outline-none ${
                error
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-200 focus:border-blue-400'
              }`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm text-center"
            >
              Onjuist wachtwoord
            </motion.p>
          )}

          <motion.button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-shadow"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Inloggen
          </motion.button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-6">
          Beschermd voor persoonlijk gebruik
        </p>
      </motion.div>
    </div>
  )
}
