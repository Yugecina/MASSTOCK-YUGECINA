/**
 * Tests for Rate Limiting Middleware
 */

import {  apiLimiter, authLimiter, executionLimiter, adminLimiter  } from '../../middleware/rateLimit';

describe('RateLimit Middleware', () => {
  describe('apiLimiter', () => {
    it('should be configured correctly', () => {
      expect(apiLimiter).toBeDefined();
      expect(typeof apiLimiter).toBe('function');
    });
  });

  describe('authLimiter', () => {
    it('should be configured correctly', () => {
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe('function');
    });
  });

  describe('executionLimiter', () => {
    it('should be configured correctly', () => {
      expect(executionLimiter).toBeDefined();
      expect(typeof executionLimiter).toBe('function');
    });
  });

  describe('adminLimiter', () => {
    it('should be configured correctly', () => {
      expect(adminLimiter).toBeDefined();
      expect(typeof adminLimiter).toBe('function');
    });
  });
});
