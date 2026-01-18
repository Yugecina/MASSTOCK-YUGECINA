/**
 * Smart Resizer Queue Configuration
 *
 * Bull queue for processing Smart Resizer jobs asynchronously.
 * Handles master image analysis and multi-format generation.
 */

import Queue from 'bull';
import { redisClient } from '../config/redis';

/**
 * Smart Resizer Queue
 *
 * Configuration:
 * - Concurrency: 2 (process 2 master images simultaneously)
 * - Each master can generate 20+ formats concurrently
 * - Retries: 2 attempts with exponential backoff
 * - Timeout: 10 minutes per job (conservative for 20+ format generation)
 */
const smartResizerQueue = new Queue('smart-resizer-queue', {
  redis: {
    port: redisClient.options.port,
    host: redisClient.options.host,
    password: redisClient.options.password,
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000, // 3 seconds initial delay
    },
    timeout: 600000, // 10 minutes
    removeOnComplete: false, // Keep completed jobs for history
    removeOnFail: false, // Keep failed jobs for debugging
  },
});

export default smartResizerQueue;
