import Redis from 'ioredis';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  maxRetriesPerRequest: null;
  enableReadyCheck: boolean;
}

const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};

const redisClient = new Redis(redisConfig);

/**
 * Test Redis connection by sending a PING command
 * @returns {Promise<boolean>} True if connection successful, false otherwise
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
}

/**
 * Gracefully close Redis connection
 * @returns {Promise<void>}
 */
export async function closeRedisConnection(): Promise<void> {
  try {
    await redisClient.quit();
  } catch (error) {
    console.error('Error closing Redis connection:', error);
    // Don't throw - we want graceful shutdown
  }
}

export { redisClient, redisConfig };
