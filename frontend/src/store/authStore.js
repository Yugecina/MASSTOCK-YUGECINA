import { create } from 'zustand'
import api from '../services/api'
import logger from '@/utils/logger';
import { useExecutionsStore } from './executionsStore';


export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true, // Start with loading true to prevent flicker
  error: null,

  // Initialize auth state from server
  initAuth: async () => {
    set({ loading: true })
    try {
      const response = await api.get('/v1/auth/me')
      set({
        user: response.user,
        isAuthenticated: true,
      })
    } catch (err) {
      logger.error('Auth check failed:', err)
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ loading: false })
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      // Backend now sets httpOnly cookies automatically
      const response = await api.post('/v1/auth/login', { email, password })
      const { user } = response

      // Validate that we received the expected data
      if (!user) {
        throw new Error('Invalid response from server')
      }

      // No need to store tokens - they're in httpOnly cookies
      set({
        user: user,
        isAuthenticated: true,
        loading: false,
        error: null,
      })
      return response
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed'
      set({ error: errorMessage, loading: false })
      throw error
    }
  },

  logout: async () => {
    try {
      // Call backend to clear cookies
      await api.post('/v1/auth/logout')
    } catch (error) {
      // Continue with logout even if backend call fails
      logger.error('Logout error:', error)
    }

    // Clear auth state
    set({
      user: null,
      isAuthenticated: false,
    })

    // Clear executions cache on logout for security
    logger.debug('🔄 authStore.logout: Clearing executions cache')
    useExecutionsStore.getState().reset()
  },
}))
