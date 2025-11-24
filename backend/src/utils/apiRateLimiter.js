/**
 * Global API Rate Limiter
 *
 * Manages rate limiting for external API calls (primarily Gemini API)
 * to prevent hitting API quotas. Implements a sliding window algorithm
 * with queue management.
 *
 * Free tier Gemini API: 15 requests/minute
 * This limiter is shared across ALL workers to enforce global limit.
 */

const { logger } = require('../config/logger');

class ApiRateLimiter {
  constructor(maxRequests = 15, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = []; // Timestamps of requests
    this.queue = []; // Pending requests waiting for slot
    this.isProcessingQueue = false;
  }

  /**
   * Acquire a slot to make an API request
   * Returns a promise that resolves when a slot is available
   */
  async acquire() {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this._processQueue();
    });
  }

  /**
   * Process queued requests when slots become available
   */
  _processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    const process = () => {
      // Clean old requests outside the window
      const now = Date.now();
      this.requests = this.requests.filter(
        timestamp => now - timestamp < this.windowMs
      );

      // Process as many requests as we have capacity for
      while (this.queue.length > 0 && this.requests.length < this.maxRequests) {
        this.requests.push(now);
        const resolve = this.queue.shift();
        resolve();
      }

      // If queue is empty, stop processing
      if (this.queue.length === 0) {
        this.isProcessingQueue = false;
        return;
      }

      // Calculate wait time until next slot becomes available
      const oldestRequest = this.requests[0];
      const waitTime = Math.max(0, this.windowMs - (now - oldestRequest) + 100);

      logger.debug(`🕐 Rate limiter: ${this.requests.length}/${this.maxRequests} slots used, ${this.queue.length} requests queued, waiting ${waitTime}ms`);

      // Schedule next processing
      setTimeout(process, waitTime);
    };

    process();
  }

  /**
   * Get current rate limiter statistics
   */
  getStats() {
    const now = Date.now();
    const activeRequests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    ).length;

    return {
      activeRequests,
      maxRequests: this.maxRequests,
      queuedRequests: this.queue.length,
      availableSlots: this.maxRequests - activeRequests,
      utilizationPercent: Math.round((activeRequests / this.maxRequests) * 100)
    };
  }

  /**
   * Reset the rate limiter (useful for testing)
   */
  reset() {
    this.requests = [];
    this.queue = [];
    this.isProcessingQueue = false;
  }
}

// Create global singleton instance
// These values come from environment or use safe defaults for free tier
const maxRequests = parseInt(process.env.GEMINI_RATE_LIMIT || '15', 10);
const windowMs = parseInt(process.env.GEMINI_RATE_WINDOW || '60000', 10);

const globalRateLimiter = new ApiRateLimiter(maxRequests, windowMs);

logger.info(`🚦 API Rate Limiter initialized: ${maxRequests} requests per ${windowMs}ms`);

module.exports = globalRateLimiter;
