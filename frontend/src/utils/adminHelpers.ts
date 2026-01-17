/**
 * Admin Helpers
 * Shared utility functions for admin pages
 */

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format date to French locale
 * @example "15 nov. 2024"
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date to relative time (French)
 * @example "Il y a 3j", "Hier", "Aujourd'hui"
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Aujourd'hui";
  if (diffInDays === 1) return 'Hier';
  if (diffInDays < 7) return `Il y a ${diffInDays}j`;
  if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)}sem`;
  if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)}mois`;
  return `Il y a ${Math.floor(diffInDays / 365)}ans`;
};

// ============================================
// USER INITIALS
// ============================================

/**
 * Get user initials from name or email
 * @example "John Doe" → "JD", "test@example.com" → "te"
 */
export const getUserInitials = (name?: string, email?: string): string => {
  if (name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
};

// ============================================
// STATUS BADGES
// ============================================

export interface BadgeConfig {
  class: string;
  label: string;
}

export const statusConfig: Record<string, BadgeConfig> = {
  active: {
    class: 'admin-users-badge--active',
    label: 'Actif',
  },
  suspended: {
    class: 'admin-users-badge--suspended',
    label: 'Suspendu',
  },
  pending: {
    class: 'admin-users-badge--pending',
    label: 'En attente',
  },
  deployed: {
    class: 'badge-success',
    label: 'Déployé',
  },
  draft: {
    class: 'badge-warning',
    label: 'Brouillon',
  },
};

export const getStatusBadge = (status: string): BadgeConfig => {
  return statusConfig[status] || { class: '', label: status };
};

// ============================================
// PLAN BADGES
// ============================================

export const planConfig: Record<string, BadgeConfig> = {
  starter: {
    class: 'admin-users-badge--starter',
    label: 'Starter',
  },
  pro: {
    class: 'admin-users-badge--pro',
    label: 'Pro',
  },
  enterprise: {
    class: 'admin-users-badge--enterprise',
    label: 'Enterprise',
  },
};

export const getPlanBadge = (plan?: string): BadgeConfig => {
  return planConfig[plan || 'starter'] || planConfig.starter;
};

// ============================================
// ROLE BADGES
// ============================================

export const roleConfig: Record<string, BadgeConfig> = {
  admin: {
    class: 'admin-users-badge--admin',
    label: 'Admin',
  },
  user: {
    class: 'admin-users-badge--user',
    label: 'User',
  },
  owner: {
    class: 'admin-users-badge--owner',
    label: 'Owner',
  },
  collaborator: {
    class: 'admin-users-badge--collaborator',
    label: 'Collaborateur',
  },
};

export const getRoleBadge = (role: string): BadgeConfig => {
  return roleConfig[role] || { class: '', label: role };
};

// ============================================
// EXECUTION STATUS BADGES
// ============================================

export interface ExecutionBadgeConfig extends BadgeConfig {
  gradient: string;
  icon: string;
  glow: boolean;
  pulse?: boolean;
}

export const executionStatusConfig: Record<string, ExecutionBadgeConfig> = {
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

export const getExecutionStatusBadge = (status: string): ExecutionBadgeConfig => {
  return executionStatusConfig[status] || executionStatusConfig.pending;
};

// ============================================
// USER STATUS BADGES
// ============================================

export const userStatusConfig: Record<string, BadgeConfig> = {
  active: {
    class: 'user-status-active',
    label: 'Active'
  },
  inactive: {
    class: 'user-status-inactive',
    label: 'Inactive'
  },
  suspended: {
    class: 'user-status-suspended',
    label: 'Suspended'
  }
};

export const getUserStatusBadge = (status: string): BadgeConfig => {
  return userStatusConfig[status] || userStatusConfig.inactive;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format user role for display
 */
export const formatUserRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    admin: 'Administrator',
    user: 'User',
    client: 'Client',
    viewer: 'Viewer',
    owner: 'Owner',
    collaborator: 'Collaborator'
  };

  return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
};

/**
 * Check if a user has admin privileges
 */
export const isAdmin = (role: string): boolean => {
  return role === 'admin' || role === 'owner';
};

/**
 * Calculate percentage rounded to 2 decimals
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
};
