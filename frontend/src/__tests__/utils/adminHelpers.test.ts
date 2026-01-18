import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  userStatusConfig,
  executionStatusConfig,
  getUserStatusBadge,
  getExecutionStatusBadge,
  formatUserRole,
  isAdmin,
  calculatePercentage,
  formatDate,
  formatRelativeTime,
  getUserInitials,
  getStatusBadge,
  getPlanBadge,
  getRoleBadge
} from '../../utils/adminHelpers';

describe('adminHelpers utility', () => {
  describe('userStatusConfig', () => {
    it('should have active, inactive, and suspended statuses', () => {
      expect(userStatusConfig).toHaveProperty('active');
      expect(userStatusConfig).toHaveProperty('inactive');
      expect(userStatusConfig).toHaveProperty('suspended');
    });

    it('should have proper structure for each status', () => {
      expect(userStatusConfig.active).toHaveProperty('class');
      expect(userStatusConfig.active).toHaveProperty('label');
      expect(userStatusConfig.active.class).toBe('user-status-active');
      expect(userStatusConfig.active.label).toBe('Active');
    });
  });

  describe('executionStatusConfig', () => {
    it('should have all execution statuses', () => {
      expect(executionStatusConfig).toHaveProperty('completed');
      expect(executionStatusConfig).toHaveProperty('failed');
      expect(executionStatusConfig).toHaveProperty('processing');
      expect(executionStatusConfig).toHaveProperty('pending');
    });

    it('should have pulse property for processing status', () => {
      expect(executionStatusConfig.processing.pulse).toBe(true);
    });

    it('should have glow enabled for completed and failed', () => {
      expect(executionStatusConfig.completed.glow).toBe(true);
      expect(executionStatusConfig.failed.glow).toBe(true);
    });
  });

  describe('getUserStatusBadge', () => {
    it('should return correct badge for active status', () => {
      const badge = getUserStatusBadge('active');
      expect(badge.label).toBe('Active');
      expect(badge.class).toBe('user-status-active');
    });

    it('should return correct badge for inactive status', () => {
      const badge = getUserStatusBadge('inactive');
      expect(badge.label).toBe('Inactive');
      expect(badge.class).toBe('user-status-inactive');
    });

    it('should return inactive badge for unknown status', () => {
      const badge = getUserStatusBadge('unknown');
      expect(badge).toEqual(userStatusConfig.inactive);
    });
  });

  describe('getExecutionStatusBadge', () => {
    it('should return correct badge for completed status', () => {
      const badge = getExecutionStatusBadge('completed');
      expect(badge.label).toBe('Completed');
      expect(badge.icon).toBe('✓');
    });

    it('should return correct badge for failed status', () => {
      const badge = getExecutionStatusBadge('failed');
      expect(badge.label).toBe('Failed');
      expect(badge.icon).toBe('✗');
    });

    it('should return correct badge for processing status', () => {
      const badge = getExecutionStatusBadge('processing');
      expect(badge.label).toBe('Processing');
      expect(badge.pulse).toBe(true);
    });

    it('should return pending badge for unknown status', () => {
      const badge = getExecutionStatusBadge('unknown');
      expect(badge).toEqual(executionStatusConfig.pending);
    });
  });

  describe('formatUserRole', () => {
    it('should format admin role', () => {
      expect(formatUserRole('admin')).toBe('Administrator');
    });

    it('should format user role', () => {
      expect(formatUserRole('user')).toBe('User');
    });

    it('should format client role', () => {
      expect(formatUserRole('client')).toBe('Client');
    });

    it('should format viewer role', () => {
      expect(formatUserRole('viewer')).toBe('Viewer');
    });

    it('should capitalize unknown roles', () => {
      expect(formatUserRole('moderator')).toBe('Moderator');
      expect(formatUserRole('guest')).toBe('Guest');
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      expect(isAdmin('admin')).toBe(true);
    });

    it('should return false for non-admin roles', () => {
      expect(isAdmin('user')).toBe(false);
      expect(isAdmin('client')).toBe(false);
      expect(isAdmin('viewer')).toBe(false);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(75, 100)).toBe(75);
    });

    it('should round to 2 decimal places', () => {
      expect(calculatePercentage(1, 3)).toBe(33.33);
      expect(calculatePercentage(2, 3)).toBe(66.67);
    });

    it('should return 0 when total is 0', () => {
      expect(calculatePercentage(50, 0)).toBe(0);
    });

    it('should handle decimal inputs', () => {
      expect(calculatePercentage(12.5, 50)).toBe(25);
    });

    it('should handle percentage > 100', () => {
      expect(calculatePercentage(150, 100)).toBe(150);
    });
  });

  describe('formatDate', () => {
    it('should format date to French locale', () => {
      const result = formatDate('2025-01-15T12:00:00Z');
      expect(result).toMatch(/15 janv\. 2025/);
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "Aujourd\'hui" for today', () => {
      expect(formatRelativeTime('2025-01-15T10:00:00Z')).toBe("Aujourd'hui");
    });

    it('should return "Hier" for yesterday', () => {
      expect(formatRelativeTime('2025-01-14T12:00:00Z')).toBe('Hier');
    });

    it('should return days for dates within 7 days', () => {
      expect(formatRelativeTime('2025-01-12T12:00:00Z')).toBe('Il y a 3j');
    });

    it('should return weeks for dates within 30 days', () => {
      expect(formatRelativeTime('2025-01-01T12:00:00Z')).toBe('Il y a 2sem');
    });

    it('should return months for dates within 365 days', () => {
      expect(formatRelativeTime('2024-11-15T12:00:00Z')).toBe('Il y a 2mois');
    });

    it('should return years for dates older than 365 days', () => {
      expect(formatRelativeTime('2023-01-15T12:00:00Z')).toBe('Il y a 2ans');
    });
  });

  describe('getUserInitials', () => {
    it('should return initials from full name', () => {
      expect(getUserInitials('John Doe')).toBe('JD');
      expect(getUserInitials('Alice Bob Charlie')).toBe('AB');
    });

    it('should return first 2 chars from email if no name', () => {
      expect(getUserInitials(undefined, 'test@example.com')).toBe('TE');
    });

    it('should return "??" if no name or email', () => {
      expect(getUserInitials()).toBe('??');
    });
  });

  describe('getStatusBadge', () => {
    it('should return correct badge for active status', () => {
      const badge = getStatusBadge('active');
      expect(badge.class).toBe('admin-users-badge--active');
      expect(badge.label).toBe('Actif');
    });

    it('should return correct badge for deployed status', () => {
      const badge = getStatusBadge('deployed');
      expect(badge.class).toBe('badge-success');
      expect(badge.label).toBe('Déployé');
    });

    it('should return default badge for unknown status', () => {
      const badge = getStatusBadge('unknown');
      expect(badge.label).toBe('unknown');
    });
  });

  describe('getPlanBadge', () => {
    it('should return correct badge for pro plan', () => {
      const badge = getPlanBadge('pro');
      expect(badge.class).toBe('admin-users-badge--pro');
      expect(badge.label).toBe('Pro');
    });

    it('should return starter badge for undefined plan', () => {
      const badge = getPlanBadge();
      expect(badge.class).toBe('admin-users-badge--starter');
    });
  });

  describe('getRoleBadge', () => {
    it('should return correct badge for admin role', () => {
      const badge = getRoleBadge('admin');
      expect(badge.class).toBe('admin-users-badge--admin');
      expect(badge.label).toBe('Admin');
    });

    it('should return correct badge for collaborator role', () => {
      const badge = getRoleBadge('collaborator');
      expect(badge.class).toBe('admin-users-badge--collaborator');
      expect(badge.label).toBe('Collaborateur');
    });

    it('should return default badge for unknown role', () => {
      const badge = getRoleBadge('unknown');
      expect(badge.label).toBe('unknown');
    });
  });
});
