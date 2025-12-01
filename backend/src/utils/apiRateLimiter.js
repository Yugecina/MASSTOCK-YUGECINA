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

/**
 * Model-aware rate limiter manager
 * Maintains separate rate limiters for different Gemini models
 * to maximize throughput while respecting API tier limits
 */
class ModelRateLimiters {
  constructor() {
    // Create separate rate limiters for each model type
    this.limiters = {
      flash: new ApiRateLimiter(
        parseInt(process.env.GEMINI_RATE_LIMIT_FLASH || '500', 10),
        parseInt(process.env.GEMINI_RATE_WINDOW || '60000', 10)
      ),
      pro: new ApiRateLimiter(
        parseInt(process.env.GEMINI_RATE_LIMIT_PRO || '100', 10),
        parseInt(process.env.GEMINI_RATE_WINDOW || '60000', 10)
      )
    };

    logger.info(`🚦 Model Rate Limiters initialized:`);
    logger.info(`   Flash models: ${process.env.GEMINI_RATE_LIMIT_FLASH || 500} RPM`);
    logger.info(`   Pro models: ${process.env.GEMINI_RATE_LIMIT_PRO || 100} RPM`);
  }

  /**
   * Get the appropriate rate limiter for a given model
   * @param {string} model - Model name (e.g., 'gemini-2.5-flash', 'gemini-3-pro')
   * @returns {ApiRateLimiter} The appropriate rate limiter instance
   */
  getLimiter(model) {
    if (!model || typeof model !== 'string') {
      logger.warn('⚠️  No model specified, using Flash limiter as default');
      return this.limiters.flash;
    }

    if (model.includes('flash')) {
      logger.debug(`🔵 Using Flash rate limiter for model: ${model}`);
      return this.limiters.flash;
    }

    if (model.includes('pro')) {
      logger.debug(`🟣 Using Pro rate limiter for model: ${model}`);
      return this.limiters.pro;
    }

    logger.warn(`⚠️  Unknown model type: ${model}, using Flash limiter as default`);
    return this.limiters.flash;
  }

  /**
   * Acquire a slot for API request
   * @param {string} model - Model name
   * @returns {Promise<void>} Resolves when slot is available
   */
  async acquire(model) {
    return this.getLimiter(model).acquire();
  }

  /**
   * Get statistics for a specific model's rate limiter
   * @param {string} model - Model name
   * @returns {Object} Rate limiter statistics
   */
  getStats(model) {
    if (!model) {
      // Return combined stats if no model specified
      return {
        flash: this.limiters.flash.getStats(),
        pro: this.limiters.pro.getStats()
      };
    }
    return this.getLimiter(model).getStats();
  }

  /**
   * Reset all rate limiters (useful for testing)
   */
  resetAll() {
    this.limiters.flash.reset();
    this.limiters.pro.reset();
  }
}

// Export singleton instance
const modelRateLimiters = new ModelRateLimiters();

module.exports = modelRateLimiters;
