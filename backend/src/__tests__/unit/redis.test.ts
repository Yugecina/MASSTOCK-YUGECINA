/**
 * Tests for Redis Configuration
 */

// Mock ioredis with ioredis-mock for full functionality
jest.mock('ioredis', () => require('ioredis-mock'));

// Import once outside describe block since modules are cached
import Redis from 'ioredis';
import * as redisModule from '../../config/redis';

describe('Redis Configuration', () => {
  beforeEach(() => {
    // Don't clear all mocks to preserve initialization calls
  });

  describe('redisClient', () => {
    it('should export redis client instance', () => {
      expect(redisModule.redisClient).toBeDefined();
      expect(typeof redisModule.redisClient).toBe('object');
    });

    it('should export redis config', () => {
      expect(redisModule.redisConfig).toBeDefined();
      expect(redisModule.redisConfig).toMatchObject({
        host: expect.any(String),
        port: expect.any(Number),
        maxRetriesPerRequest: null,
        enableReadyCheck: false
      });
    });
  });

  describe('testRedisConnection', () => {
    it('should return true on successful ping', async () => {
      const result = await redisModule.testRedisConnection();

      expect(result).toBe(true);
    });

    it('should handle ping errors gracefully', async () => {
      // Temporarily break the connection
      const originalPing = redisModule.redisClient.ping;
      redisModule.redisClient.ping = jest.fn().mockRejectedValue(new Error('Connection failed'));

      const result = await redisModule.testRedisConnection();

      expect(result).toBe(false);

      // Restore original ping
      redisModule.redisClient.ping = originalPing;
    });
  });

  describe('closeRedisConnection', () => {
    it('should close connection gracefully', async () => {
      await expect(redisModule.closeRedisConnection()).resolves.not.toThrow();
    });

    it('should handle close errors gracefully', async () => {
      // Temporarily break the quit function
      const originalQuit = redisModule.redisClient.quit;
      redisModule.redisClient.quit = jest.fn().mockRejectedValue(new Error('Close failed'));

      // Should not throw error
      await expect(redisModule.closeRedisConnection()).resolves.not.toThrow();

      // Restore original quit
      redisModule.redisClient.quit = originalQuit;
    });
  });
});
