import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

// Mock all dependencies
vi.mock('../services/api')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    BrowserRouter: ({ children }) => <div>{children}</div>,
    Routes: ({ children }) => <div>{children}</div>,
    Route: () => null,
    Navigate: () => null,
  }
})
vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
}))

describe('App - Authentication Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      loading: true,
      error: null,
    })
  })

  it('should call initAuth on mount', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'user',
    }

    api.get.mockResolvedValueOnce({ user: mockUser })

    render(<App />)

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Wait for initAuth to complete
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/auth/me')
    })

    // After successful init, loading should be false
    await waitFor(() => {
      const store = useAuthStore.getState()
      expect(store.loading).toBe(false)
      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(mockUser)
    })
  })

  it('should handle failed authentication on mount', async () => {
    api.get.mockRejectedValueOnce(new Error('Unauthorized'))

    render(<App />)

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Wait for initAuth to complete
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/auth/me')
    })

    // After failed init, user should not be authenticated
    await waitFor(() => {
      const store = useAuthStore.getState()
      expect(store.loading).toBe(false)
      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBe(null)
    })
  })

  it('should persist authentication after page refresh', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'user',
    }

    // Simulate that the backend still has valid cookie
    api.get.mockResolvedValueOnce({ user: mockUser })

    // First render (simulating page load)
    const { unmount } = render(<App />)

    await waitFor(() => {
      const store = useAuthStore.getState()
      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(mockUser)
    })

    unmount()

    // Reset store (simulating page refresh)
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      loading: true,
      error: null,
    })

    // Mock successful auth check again
    api.get.mockResolvedValueOnce({ user: mockUser })

    // Second render (simulating refresh)
    render(<App />)

    // initAuth should be called again
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2)
    })

    // User should be authenticated again
    await waitFor(() => {
      const store = useAuthStore.getState()
      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(mockUser)
    })
  })
})
