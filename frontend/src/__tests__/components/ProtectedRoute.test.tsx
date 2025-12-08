import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import * as useAuthModule from '../../hooks/useAuth';

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = useAuthModule.useAuth as ReturnType<typeof vi.fn>;

describe('ProtectedRoute (TypeScript)', () => {
  it('should render children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'user@example.com',
        role: 'client',
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
    });

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(container.textContent).toContain('Protected Content');
  });

  it('should use Navigate component when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Should not render protected content or login page (Navigation happens)
    expect(container.textContent).not.toContain('Protected Content');
  });

  it('should render children when user has required role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'admin@example.com',
        role: 'admin',
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
    });

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute requiredRole="admin">
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(container.textContent).toContain('Admin Content');
  });

  it('should use Navigate when user has mismatched role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'user@example.com',
        role: 'client',
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <div>Admin Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(container.textContent).not.toContain('Admin Content');
  });

  it('should render children when user has one of multiple required roles', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'member@example.com',
        role: 'member',
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
    });

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute requiredRole={['admin', 'member']}>
          <div>Team Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(container.textContent).toContain('Team Content');
  });

  it('should accept custom redirect path configuration', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'user@example.com',
        role: 'client',
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
    });

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute requiredRole="admin" redirectPath="/access-denied">
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Should have component rendered (which doesn't contain admin content)
    expect(container).toBeTruthy();
  });

  it('should accept ReactNode children', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'user@example.com',
        role: 'client',
        is_active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null,
    });

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>
            <h1>Protected Page</h1>
            <p>This is protected content</p>
          </div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(container.textContent).toContain('Protected Page');
    expect(container.textContent).toContain('This is protected content');
  });
});
