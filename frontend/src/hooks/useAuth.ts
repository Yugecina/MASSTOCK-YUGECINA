import { useAuthStore } from '../store/authStore';
import type { User } from '../types/index';

/**
 * Hook for accessing authentication state and methods
 * Returns user, authentication status, and auth actions
 *
 * @returns {UseAuthReturn} Authentication state and methods
 *
 * @example
 * const { user, isAuthenticated, login, logout, loading, error } = useAuth();
 */
export function useAuth(): UseAuthReturn {
  const { user, isAuthenticated, login, logout, loading, error } = useAuthStore();

  return {
    user,
    isAuthenticated,
    login,
    logout,
    loading,
    error,
  };
}

/**
 * Return type for the useAuth hook
 * Represents all authentication-related state and actions
 */
export interface UseAuthReturn {
  /** Currently authenticated user object or null if not authenticated */
  user: User | null;

  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;

  /** Whether auth state is currently loading */
  loading: boolean;

  /** Error message from the last auth operation or null */
  error: string | null;

  /**
   * Login with email and password
   * Sets authentication state and user on success
   *
   * @param email - User email address
   * @param password - User password
   * @throws {Error} If login fails
   */
  login: (email: string, password: string) => Promise<{ user: User }>;

  /**
   * Logout the current user
   * Clears authentication state and cookies
   *
   * @returns {Promise<void>}
   */
  logout: () => Promise<void>;
}
