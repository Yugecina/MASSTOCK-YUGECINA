/**
 * Redis Configuration
 * Connection setup for Bull job queue
 */

const Redis = require('ioredis');
require('dotenv').config();

// Redis connection options
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Create Redis client
const redisClient = new Redis(redisConfig);

// Event handlers
redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

/**
 * Test Redis connection
 */
async function testRedisConnection() {
  try {
    const result = await redisClient.ping();
    console.log('Redis connection test:', result === 'PONG' ? 'SUCCESS' : 'FAILED');
    return result === 'PONG';
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
}

/**
 * Graceful shutdown
 */
async function closeRedisConnection() {
  try {
    await redisClient.quit();
    console.log('Redis connection closed gracefully');
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
}

module.exports = {
  redisClient,
  redisConfig,
  testRedisConnection,
  closeRedisConnection
};
