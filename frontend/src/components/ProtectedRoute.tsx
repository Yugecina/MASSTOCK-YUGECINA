import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/index';

/**
 * Props for the ProtectedRoute component
 */
interface ProtectedRouteProps {
  /** Child components to render if user is authorized */
  children: ReactNode;

  /** Required role to access this route */
  requiredRole?: UserRole | UserRole[];

  /** Path to redirect to if user is not authorized */
  redirectPath?: string;

  /** Require admin role (shorthand for requiredRole="admin") */
  requireAdmin?: boolean;
}

/**
 * Route guard component that protects routes based on authentication and authorization
 *
 * Features:
 * - Redirects to login if user is not authenticated
 * - Redirects to redirectPath if user lacks required role
 * - Supports single role or multiple roles
 *
 * @example
 * // Basic usage - requires authentication only
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 *
 * @example
 * // Admin-only route
 * <ProtectedRoute requiredRole="admin">
 *   <AdminPanel />
 * </ProtectedRoute>
 *
 * @example
 * // Multiple allowed roles
 * <ProtectedRoute requiredRole={['admin', 'member']}>
 *   <ReportsPage />
 * </ProtectedRoute>
 *
 * @example
 * // Custom redirect path
 * <ProtectedRoute requiredRole="admin" redirectPath="/access-denied">
 *   <AdminPage />
 * </ProtectedRoute>
 *
 * @example
 * // Using requireAdmin shorthand
 * <ProtectedRoute requireAdmin>
 *   <AdminPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredRole,
  redirectPath = '/login',
  requireAdmin = false,
}: ProtectedRouteProps): ReactNode {
  const { isAuthenticated, user } = useAuth();

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    console.log('🔍 ProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Determine required roles
  const effectiveRequiredRole = requireAdmin ? 'admin' : requiredRole;

  // Role validation
  if (effectiveRequiredRole) {
    const allowedRoles = Array.isArray(effectiveRequiredRole)
      ? effectiveRequiredRole
      : [effectiveRequiredRole];

    if (!user || !allowedRoles.includes(user.role)) {
      console.log('⚠️ ProtectedRoute: User lacks required role', {
        userRole: user?.role,
        requiredRoles: allowedRoles,
        redirectPath,
      });
      return <Navigate to={redirectPath} replace />;
    }
  }

  // User is authorized - render children
  console.log('✅ ProtectedRoute: User authorized, rendering component', {
    userId: user?.id,
    userRole: user?.role,
  });
  return children;
}
