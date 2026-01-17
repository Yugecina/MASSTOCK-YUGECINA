import { describe, it, expect } from 'vitest';
import {
  userStatusConfig,
  executionStatusConfig,
  getUserStatusBadge,
  getExecutionStatusBadge,
  formatUserRole,
  isAdmin,
  calculatePercentage
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
      expect(userStatusConfig.active).toHaveProperty('gradient');
      expect(userStatusConfig.active).toHaveProperty('icon');
      expect(userStatusConfig.active).toHaveProperty('glow');
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
      expect(badge.gradient).toBe('success');
    });

    it('should return correct badge for inactive status', () => {
      const badge = getUserStatusBadge('inactive');
      expect(badge.label).toBe('Inactive');
      expect(badge.glow).toBe(false);
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
});
