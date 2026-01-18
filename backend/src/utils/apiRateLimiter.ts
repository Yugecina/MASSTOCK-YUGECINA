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

import { logger } from '../config/logger';

interface RateLimiterStats {
  activeRequests: number;
  maxRequests: number;
  queuedRequests: number;
  availableSlots: number;
  utilizationPercent: number;
}

interface ModelStats {
  flash: RateLimiterStats;
  pro: RateLimiterStats;
}

class ApiRateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private requests: number[];
  private queue: Array<() => void>;
  private isProcessingQueue: boolean;

  constructor(maxRequests: number = 15, windowMs: number = 60000) {
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
  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this._processQueue();
    });
  }

  /**
   * Process queued requests when slots become available
   */
  private _processQueue(): void {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    const process = (): void => {
      // Clean old requests outside the window
      const now = Date.now();
      this.requests = this.requests.filter(
        timestamp => now - timestamp < this.windowMs
      );

      // Process as many requests as we have capacity for
      while (this.queue.length > 0 && this.requests.length < this.maxRequests) {
        this.requests.push(now);
        const resolve = this.queue.shift();
        if (resolve) resolve();
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
  getStats(): RateLimiterStats {
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
  reset(): void {
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
  private limiters: {
    flash: ApiRateLimiter;
    pro: ApiRateLimiter;
  };

  constructor() {
    // Vertex AI rate limits
    const flashLimit = parseInt(process.env.VERTEX_RATE_LIMIT_FLASH || '1000', 10);
    const proLimit = parseInt(process.env.VERTEX_RATE_LIMIT_PRO || '500', 10);
    const window = 60000; // 1 minute window

    // Create separate rate limiters for each model type
    this.limiters = {
      flash: new ApiRateLimiter(flashLimit, window),
      pro: new ApiRateLimiter(proLimit, window)
    };

    logger.info(`🚦 Model Rate Limiters initialized (Vertex AI):`);
    logger.info(`   Flash models: ${flashLimit} RPM`);
    logger.info(`   Pro models: ${proLimit} RPM`);
  }

  /**
   * Get the appropriate rate limiter for a given model
   * @param model - Model name (e.g., 'gemini-2.5-flash', 'gemini-3-pro')
   * @returns The appropriate rate limiter instance
   */
  getLimiter(model?: string): ApiRateLimiter {
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
   * @param model - Model name
   * @returns Promise that resolves when slot is available
   */
  async acquire(model?: string): Promise<void> {
    return this.getLimiter(model).acquire();
  }

  /**
   * Get statistics for a specific model's rate limiter
   * @param model - Model name
   * @returns Rate limiter statistics
   */
  getStats(model?: string): RateLimiterStats | ModelStats {
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
  resetAll(): void {
    this.limiters.flash.reset();
    this.limiters.pro.reset();
  }
}

// Export singleton instance
const modelRateLimiters = new ModelRateLimiters();

export default modelRateLimiters;
export { ApiRateLimiter, ModelRateLimiters, RateLimiterStats, ModelStats };
