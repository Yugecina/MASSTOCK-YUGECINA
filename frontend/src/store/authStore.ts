/**
 * Auth Store
 * Zustand store for authentication state management
 */

import { create } from 'zustand';
import api from '../services/api';
import logger from '@/utils/logger';
import { useExecutionsStore } from './executionsStore';
import { useActiveExecutionsStore } from './activeExecutionsStore';
import { User } from '../types/index';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ user: User }>;
  logout: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  // State
  user: null,
  isAuthenticated: false,
  loading: true, // Start with loading true to prevent flicker
  error: null,

  // Actions
  initAuth: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/auth/me');
      set({
        user: response.user,
        isAuthenticated: true,
      });
    } catch (err) {
      logger.error('Auth check failed:', err);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      // Backend now sets httpOnly cookies automatically
      const response = await api.post('/auth/login', { email, password });
      const { user } = response;

      // Validate that we received the expected data
      if (!user) {
        throw new Error('Invalid response from server');
      }

      // No need to store tokens - they're in httpOnly cookies
      set({
        user: user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      // Call backend to clear cookies
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if backend call fails
      logger.error('Logout error:', error);
    }

    // Clear auth state
    set({
      user: null,
      isAuthenticated: false,
    });

    // Clear executions cache on logout for security
    logger.debug('🔄 authStore.logout: Clearing executions cache');
    useExecutionsStore.getState().reset();

    // Clear active executions on logout
    logger.debug('🔄 authStore.logout: Clearing active executions');
    useActiveExecutionsStore.getState().reset();
  },
}));
