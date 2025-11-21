import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const { login, loading, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  // Auto-redirect if already authenticated (with role-based destination)
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard'
      navigate(redirectPath)
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setDebugInfo('')
    try {
      await login(email, password)
      // If we reach here, login was successful
      // Note: The useEffect will handle redirection based on user role
      // No need to manually navigate here as the auth state change will trigger it
    } catch (err) {
      setDebugInfo(
        JSON.stringify({
          message: err.message,
          status: err.response?.status,
        })
      )

      let errorMessage = 'Login failed'

      // Try to extract error from various response formats
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error - Backend server may be down or unreachable'
        setDebugInfo(`Check if backend is running on http://localhost:3000`)
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    }
  }

  // DEV: Quick login functions
  const quickLoginAsAdmin = async () => {
    setEmail('admin@masstock.com')
    setPassword('Admin123123')
    setError('')
    setDebugInfo('')
    try {
      await login('admin@masstock.com', 'Admin123123')
    } catch (err) {
      setError(err.response?.data?.message || 'Admin login failed')
    }
  }

  const quickLoginAsEstee = async () => {
    setEmail('estee@masstock.com')
    setPassword('EsteePassword123!')
    setError('')
    setDebugInfo('')
    try {
      await login('estee@masstock.com', 'EsteePassword123!')
    } catch (err) {
      setError(err.response?.data?.message || 'Estee login failed')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--canvas-base)' }}
    >
      <div className="card card-glass w-full max-w-md" style={{ padding: '48px' }}>
        {/* Logo - Centered */}
        <div className="text-center mb-8">
          <img
            src="/logo-full-color.svg"
            alt="MasStock"
            className="mx-auto mb-4"
            style={{ height: '60px', width: 'auto' }}
          />
          <p className="text-body text-secondary">Sign in to your account</p>
        </div>

        {error && (
          <div
            className="mb-6 p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--error-light)',
              color: 'var(--error-dark)',
              borderLeft: '4px solid var(--error-main)'
            }}
          >
            <div className="font-semibold">{error}</div>
            {debugInfo && <div className="text-sm mt-2 opacity-75">{debugInfo}</div>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            name="email"
            id="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
          />
          <Button
            type="submit"
            size="lg"
            loading={loading}
            className="btn btn-primary w-full"
          >
            Sign In
          </Button>
        </form>

        {/* DEV ONLY: Quick Login Buttons */}
        {import.meta.env.VITE_ENV === 'development' && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <p className="text-xs text-neutral-500 text-center mb-3">DEV ONLY - Quick Login</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={quickLoginAsAdmin}
                disabled={loading}
                className="btn btn-secondary btn-sm flex-1"
              >
                🔑 Admin
              </button>
              <button
                type="button"
                onClick={quickLoginAsEstee}
                disabled={loading}
                className="btn btn-secondary btn-sm flex-1"
              >
                🎨 Estee
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
