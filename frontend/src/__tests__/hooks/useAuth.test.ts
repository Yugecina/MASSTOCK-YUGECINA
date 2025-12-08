/**
 * Tests for the useAuth hook
 * @file useAuth.test.ts
 *
 * Tests the useAuth custom hook for returning authentication state
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types/index';

// Mock the auth store
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('useAuth Hook', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'client',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockLogin = vi.fn().mockResolvedValue({ user: mockUser });
  const mockLogout = vi.fn().mockResolvedValue(undefined);

  const createMockStoreState = (overrides = {}) => ({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
    login: mockLogin,
    logout: mockLogout,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return authenticated state when user is logged in', () => {
    // Arrange
    (useAuthStore as any).mockReturnValue(
      createMockStoreState({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
      })
    );

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(null);
  });

  it('should return unauthenticated state when user is not logged in', () => {
    // Arrange
    (useAuthStore as any).mockReturnValue(
      createMockStoreState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      })
    );

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(null);
  });

  it('should return loading state during initialization', () => {
    // Arrange
    (useAuthStore as any).mockReturnValue(
      createMockStoreState({
        user: null,
        isAuthenticated: false,
        loading: true,
        error: null,
      })
    );

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert
    expect(result.current.loading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return error message when auth operation fails', () => {
    // Arrange
    const errorMessage = 'Invalid credentials';
    (useAuthStore as any).mockReturnValue(
      createMockStoreState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: errorMessage,
      })
    );

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert
    expect(result.current.error).toEqual(errorMessage);
  });

  it('should provide login method from store', () => {
    // Arrange
    (useAuthStore as any).mockReturnValue(createMockStoreState());

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert
    expect(result.current.login).toBeDefined();
    expect(result.current.login).toBe(mockLogin);
  });

  it('should provide logout method from store', () => {
    // Arrange
    (useAuthStore as any).mockReturnValue(createMockStoreState());

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert
    expect(result.current.logout).toBeDefined();
    expect(result.current.logout).toBe(mockLogout);
  });

  it('should return proper TypeScript types', () => {
    // Arrange
    (useAuthStore as any).mockReturnValue(
      createMockStoreState({
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
      })
    );

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert - TypeScript will verify types at compile time
    const authReturn = result.current;
    expect(authReturn).toHaveProperty('user');
    expect(authReturn).toHaveProperty('isAuthenticated');
    expect(authReturn).toHaveProperty('loading');
    expect(authReturn).toHaveProperty('error');
    expect(authReturn).toHaveProperty('login');
    expect(authReturn).toHaveProperty('logout');
  });
});
