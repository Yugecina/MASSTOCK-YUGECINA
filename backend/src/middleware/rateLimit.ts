/**
 * Rate Limiting Middleware
 * Prevent API abuse and DDoS attacks
 */

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';
import { logError } from '../config/logger';

// Type definitions
interface AuthRequest extends Request {
  user?: any;
  client?: any;
  rateLimit?: {
    resetTime: Date;
  };
}

/**
 * General API rate limiter
 */
const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req: AuthRequest, res: Response) => {
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
      retry_after: req.rateLimit?.resetTime
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    error: 'Too many login attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  handler: (req: Request, res: Response) => {
    logError(new Error('Auth rate limit exceeded'), {
      ip: req.ip,
      email: (req.body as any)?.email
    });

    res.status(429).json({
      success: false,
      error: 'Too many login attempts, please try again after 15 minutes',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retry_after: (req as AuthRequest).rateLimit?.resetTime
    });
  }
});

/**
 * Rate limiter for workflow executions
 */
const executionLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 executions per minute per client
  keyGenerator: (req: AuthRequest): string => {
    // Rate limit per client
    return req.client?.id || req.ip || 'unknown';
  },
  message: {
    success: false,
    error: 'Execution rate limit exceeded',
    code: 'EXECUTION_RATE_LIMIT_EXCEEDED'
  },
  handler: (req: AuthRequest, res: Response) => {
    logError(new Error('Execution rate limit exceeded'), {
      client_id: req.client?.id,
      workflow_id: req.params.workflow_id
    });

    res.status(429).json({
      success: false,
      error: 'Too many workflow executions, please wait before trying again',
      code: 'EXECUTION_RATE_LIMIT_EXCEEDED',
      retry_after: req.rateLimit?.resetTime
    });
  }
});

/**
 * Rate limiter for admin endpoints
 */
const adminLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute for admin
  message: {
    success: false,
    error: 'Admin rate limit exceeded',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Strict rate limiter for public contact form
 */
const contactLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 submissions per window per IP
  message: {
    success: false,
    error: 'Too many submissions, please try again later',
    code: 'CONTACT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logError(new Error('Contact rate limit exceeded'), {
      ip: req.ip,
      email: (req.body as any)?.email
    });

    res.status(429).json({
      success: false,
      error: 'Too many contact form submissions. Please try again after 15 minutes.',
      code: 'CONTACT_RATE_LIMIT_EXCEEDED',
      retry_after: (req as AuthRequest).rateLimit?.resetTime
    });
  }
});

export {
  apiLimiter,
  authLimiter,
  executionLimiter,
  adminLimiter,
  contactLimiter
};
