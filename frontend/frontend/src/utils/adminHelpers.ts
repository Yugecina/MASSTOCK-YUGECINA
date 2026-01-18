/**
 * Admin utility helpers
 * Shared utilities for admin pages and components
 */

/**
 * Badge configuration for status displays
 */
export interface BadgeConfig {
  class: string;
  label: string;
  gradient: string;
  icon: string;
  glow: boolean;
  pulse?: boolean;
}

/**
 * User status configuration for admin user management
 */
export const userStatusConfig: Record<string, BadgeConfig> = {
  active: {
    class: 'user-status-active',
    label: 'Active',
    gradient: 'success',
    icon: '✓',
    glow: true
  },
  inactive: {
    class: 'user-status-inactive',
    label: 'Inactive',
    gradient: 'muted',
    icon: '⏸',
    glow: false
  },
  suspended: {
    class: 'user-status-suspended',
    label: 'Suspended',
    gradient: 'error',
    icon: '🚫',
    glow: true
  }
};

/**
 * Execution status configuration for workflow executions
 */
export const executionStatusConfig: Record<string, BadgeConfig> = {
  completed: {
    class: 'execution-status-completed',
    label: 'Completed',
    gradient: 'success',
    icon: '✓',
    glow: true
  },
  failed: {
    class: 'execution-status-failed',
    label: 'Failed',
    gradient: 'error',
    icon: '✗',
    glow: true
  },
  processing: {
    class: 'execution-status-processing',
    label: 'Processing',
    gradient: 'cyan',
    icon: '⚡',
    glow: true,
    pulse: true
  },
  pending: {
    class: 'execution-status-pending',
    label: 'Pending',
    gradient: 'muted',
    icon: '⏱',
    glow: false
  }
};

/**
 * Get badge configuration for a user status
 * @param status - User status string
 * @returns Badge configuration object
 */
export const getUserStatusBadge = (status: string): BadgeConfig => {
  return userStatusConfig[status] || userStatusConfig.inactive;
};

/**
 * Get badge configuration for an execution status
 * @param status - Execution status string
 * @returns Badge configuration object
 */
export const getExecutionStatusBadge = (status: string): BadgeConfig => {
  return executionStatusConfig[status] || executionStatusConfig.pending;
};

/**
 * Format user role for display
 * @param role - User role string
 * @returns Formatted role name
 */
export const formatUserRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    admin: 'Administrator',
    user: 'User',
    client: 'Client',
    viewer: 'Viewer'
  };

  return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
};

/**
 * Check if a user has admin privileges
 * @param role - User role string
 * @returns True if user is admin
 */
export const isAdmin = (role: string): boolean => {
  return role === 'admin';
};

/**
 * Calculate percentage
 * @param value - Current value
 * @param total - Total value
 * @returns Percentage rounded to 2 decimals
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
};
