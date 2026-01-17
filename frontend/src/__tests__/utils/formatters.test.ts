import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatDateTime,
  formatDateShort,
  formatDateTimeFR,
  formatDateSmart
} from '../../utils/formatters';

describe('formatters utility', () => {
  beforeEach(() => {
    // Reset Date mock before each test
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDateTime', () => {
    it('should format date with time in en-US locale', () => {
      const date = '2025-01-10T14:30:00Z';
      const result = formatDateTime(date);

      // Note: Output may vary by timezone, we check the format pattern
      expect(result).toMatch(/Jan \d+, 2025/);
    });

    it('should handle Date objects', () => {
      const date = new Date('2025-01-10T14:30:00Z');
      const result = formatDateTime(date);

      expect(result).toMatch(/Jan \d+, 2025/);
    });

    it('should respect custom locale', () => {
      const date = '2025-01-10T14:30:00Z';
      const result = formatDateTime(date, 'fr-FR');

      // French format should use different month abbreviation
      expect(result).toMatch(/janv\./);
    });
  });

  describe('formatDateShort', () => {
    it('should format date without time', () => {
      const date = '2025-01-10T14:30:00Z';
      const result = formatDateShort(date);

      // Should not contain time
      expect(result).toMatch(/Jan \d+, 2025/);
      expect(result).not.toMatch(/:/);
    });

    it('should handle Date objects', () => {
      const date = new Date('2025-01-10T14:30:00Z');
      const result = formatDateShort(date);

      expect(result).toMatch(/Jan \d+, 2025/);
    });
  });

  describe('formatDateTimeFR', () => {
    it('should format date in French locale', () => {
      const date = '2025-01-10T14:30:00Z';
      const result = formatDateTimeFR(date);

      expect(result).toMatch(/janv\./);
    });
  });

  describe('formatDateSmart', () => {
    it('should show "Just now" for dates within 1 minute', () => {
      const now = new Date('2025-01-15T12:00:00Z');
      const date = new Date('2025-01-15T11:59:30Z'); // 30 seconds ago

      const result = formatDateSmart(date);
      expect(result).toBe('Just now');
    });

    it('should show minutes for dates within 1 hour', () => {
      const date = new Date('2025-01-15T11:30:00Z'); // 30 minutes ago

      const result = formatDateSmart(date);
      expect(result).toBe('30m ago');
    });

    it('should show hours for dates within 24 hours', () => {
      const date = new Date('2025-01-15T08:00:00Z'); // 4 hours ago

      const result = formatDateSmart(date);
      expect(result).toBe('4h ago');
    });

    it('should show days for dates within 7 days', () => {
      const date = new Date('2025-01-12T12:00:00Z'); // 3 days ago

      const result = formatDateSmart(date);
      expect(result).toBe('3d ago');
    });

    it('should show full date for dates older than 7 days', () => {
      const date = new Date('2025-01-01T12:00:00Z'); // 14 days ago

      const result = formatDateSmart(date);
      expect(result).toMatch(/Jan \d+, 2025/);
    });

    it('should handle Date objects', () => {
      const date = new Date('2025-01-15T11:00:00Z'); // 1 hour ago

      const result = formatDateSmart(date);
      expect(result).toBe('1h ago');
    });

    it('should handle date strings', () => {
      const date = '2025-01-15T11:00:00Z'; // 1 hour ago

      const result = formatDateSmart(date);
      expect(result).toBe('1h ago');
    });
  });
});
