import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/stores/authStore'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, user } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  // If already logged in, redirect
  if (user) {
    const redirectPath =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'supervisor'
          ? '/supervisor'
          : '/participant'
    navigate(redirectPath, { replace: true })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!username || !password) {
      setLocalError('Please enter username and password')
      return
    }

    try {
      await login({ username, password })
      // Redirect will happen automatically via App.tsx
    } catch {
      setLocalError('Invalid username or password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">FitonDuty</h1>
          <p className="text-gray-600 mt-2">Health Monitoring Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          {(localError || error) && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {localError || error}
            </div>
          )}

          <Button type="submit" className="w-full" loading={isLoading}>
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  )
}
