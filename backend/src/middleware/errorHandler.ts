/**
 * Error Handler Middleware
 * Centralized error handling and formatting
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logError } from '../config/logger';

// Type definitions
interface AuthRequest extends Request {
  user?: any;
  client?: any;
}

interface ErrorResponse {
  success: boolean;
  error: string;
  code: string;
  stack?: string;
  details?: any;
}

interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

/**
 * Error response format
 */
export class ApiError extends Error {
  statusCode: number;
  code: string | null;
  details: any;

  constructor(statusCode: number, message: string, code: string | null = null, details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Not Found Handler (404)
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND'
  });
}

/**
 * Global Error Handler
 */
export function errorHandler(err: Error | ApiError, req: AuthRequest, res: Response, next: NextFunction): void {
  // Log error
  logError(err, {
    method: req.method,
    endpoint: req.originalUrl,
    user_id: req.user?.id,
    client_id: req.client?.id
  });

  // Default to 500 server error
  const statusCode = (err as ApiError).statusCode || 500;
  const code = (err as ApiError).code || 'INTERNAL_ERROR';

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: err.message || 'An unexpected error occurred',
    code
  };

  // Add details in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
    if ((err as ApiError).details) {
      errorResponse.details = (err as ApiError).details;
    }
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Async route handler wrapper
 * Catches async errors and passes to error handler
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error handler
 */
export function validationErrorHandler(errors: any[]): ApiError {
  const formattedErrors: ValidationErrorDetail[] = errors.map(err => ({
    field: err.param,
    message: err.msg,
    value: err.value
  }));

  return new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', formattedErrors);
}

/**
 * Validation middleware
 * Checks express-validator results and returns 400 if validation failed
 */
export function validate(req: Request, res: Response, next: NextFunction): void {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array().map((err: any) => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
    return;
  }

  next();
}

/**
 * Zod error handler helper
 * Checks if error is a ZodError and formats it appropriately
 * Returns null if not a Zod error (caller should handle other error types)
 */
export function handleZodError(error: unknown, res: Response): Response | null {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      errors: error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }
  return null; // Not a Zod error
}
