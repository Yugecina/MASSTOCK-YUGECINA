/**
 * Rate Limiting Middleware
 * Prevent API abuse and DDoS attacks
 */

const rateLimit = require('express-rate-limit');
const { logError } = require('../config/logger');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    logError(new Error('Rate limit exceeded'), {
      ip: req.ip,
      endpoint: req.originalUrl,
      user_id: req.user?.id,
      client_id: req.client?.id
    });

    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retry_after: req.rateLimit.resetTime
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    error: 'Too many login attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    logError(new Error('Auth rate limit exceeded'), {
      ip: req.ip,
      email: req.body?.email
    });

    res.status(429).json({
      success: false,
      error: 'Too many login attempts, please try again after 15 minutes',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retry_after: req.rateLimit.resetTime
    });
  }
});

/**
 * Rate limiter for workflow executions
 */
const executionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 executions per minute per client
  keyGenerator: (req) => {
    // Rate limit per client
    return req.client?.id || req.ip;
  },
  message: {
    success: false,
    error: 'Execution rate limit exceeded',
    code: 'EXECUTION_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    logError(new Error('Execution rate limit exceeded'), {
      client_id: req.client?.id,
      workflow_id: req.params.workflow_id
    });

    res.status(429).json({
      success: false,
      error: 'Too many workflow executions, please wait before trying again',
      code: 'EXECUTION_RATE_LIMIT_EXCEEDED',
      retry_after: req.rateLimit.resetTime
    });
  }
});

/**
 * Rate limiter for admin endpoints
 */
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute for admin
  message: {
    success: false,
    error: 'Admin rate limit exceeded',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  executionLimiter,
  adminLimiter
};
