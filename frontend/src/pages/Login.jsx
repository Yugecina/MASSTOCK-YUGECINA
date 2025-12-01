import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Login.css'

/**
 * Login Page - Dark Premium Style
 * Clean, minimal, professional authentication
 */
export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

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
    } catch (err) {
      setDebugInfo(
        JSON.stringify({
          message: err.message,
          status: err.response?.status,
        })
      )

      let errorMessage = 'Login failed'

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error - Backend server may be down'
        setDebugInfo('Check if backend is running on http://localhost:3000')
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    }
  }

  const quickLoginAsAdmin = async () => {
    const email = import.meta.env.VITE_DEV_ADMIN_EMAIL
    const password = import.meta.env.VITE_DEV_ADMIN_PASSWORD
    setEmail(email)
    setPassword(password)
    setError('')
    setDebugInfo('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.message || 'Admin login failed')
    }
  }

  const quickLoginAsEstee = async () => {
    const email = import.meta.env.VITE_DEV_ESTEE_EMAIL
    const password = import.meta.env.VITE_DEV_ESTEE_PASSWORD
    setEmail(email)
    setPassword(password)
    setError('')
    setDebugInfo('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.message || 'Estee login failed')
    }
  }

  const quickLoginAsDev = async () => {
    const email = import.meta.env.VITE_DEV_DEV_EMAIL
    const password = import.meta.env.VITE_DEV_DEV_PASSWORD
    setEmail(email)
    setPassword(password)
    setError('')
    setDebugInfo('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.message || 'Dev login failed')
    }
  }

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg-gradient" />

      <div className="login-container">
        {/* Card */}
        <div className="login-card">
          {/* Logo */}
          <div className="login-header">
            <div className="login-logo">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="var(--primary)" />
                <path d="M12 28V12h4.5l3.5 10.5L23.5 12H28v16h-3v-11l-3.5 11h-3L15 17v11h-3z" fill="white" />
              </svg>
            </div>
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Sign in to your MasStock account</p>
          </div>

          {/* Error */}
          {error && (
            <div className="login-error">
              <svg className="login-error-icon" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="login-error-content">
                <span className="login-error-message">{error}</span>
                {import.meta.env.VITE_ENV === 'development' && debugInfo && <span className="login-error-debug">{debugInfo}</span>}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <div className="login-field">
              <label htmlFor="email" className="login-label">Email</label>
              <div className="login-input-wrapper">
                <svg className="login-input-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="login-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="password" className="login-label">Password</label>
              <div className="login-input-wrapper">
                <svg className="login-input-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="login-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="login-submit">
              {loading ? (
                <>
                  <svg className="login-spinner" width="20" height="20" viewBox="0 0 24 24">
                    <circle className="login-spinner-track" cx="12" cy="12" r="10" fill="none" strokeWidth="3" />
                    <circle className="login-spinner-head" cx="12" cy="12" r="10" fill="none" strokeWidth="3" strokeDasharray="60" strokeDashoffset="45" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* DEV Quick Login */}
          {import.meta.env.VITE_ENV === 'development' && (
            <div className="login-dev">
              <div className="login-dev-divider">
                <span>Development Only</span>
              </div>
              <div className="login-dev-buttons">
                <button type="button" onClick={quickLoginAsAdmin} disabled={loading} className="login-dev-btn">
                  <span className="login-dev-btn-icon">🔑</span>
                  Admin
                </button>
                <button type="button" onClick={quickLoginAsEstee} disabled={loading} className="login-dev-btn">
                  <span className="login-dev-btn-icon">🎨</span>
                  Estee
                </button>
                <button type="button" onClick={quickLoginAsDev} disabled={loading} className="login-dev-btn">
                  <span className="login-dev-btn-icon">👨‍💻</span>
                  Dev
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="login-footer">
          MasStock — Workflow Automation Platform
        </p>
      </div>
    </div>
  )
}
