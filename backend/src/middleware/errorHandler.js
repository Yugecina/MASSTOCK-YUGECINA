/**
 * Error Handler Middleware
 * Centralized error handling and formatting
 */

const { logError } = require('../config/logger');

/**
 * Error response format
 */
class ApiError extends Error {
  constructor(statusCode, message, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Not Found Handler (404)
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND'
  });
}

/**
 * Global Error Handler
 */
function errorHandler(err, req, res, next) {
  // Log error
  logError(err, {
    method: req.method,
    endpoint: req.originalUrl,
    user_id: req.user?.id,
    client_id: req.client?.id
  });

  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Build error response
  const errorResponse = {
    success: false,
    error: err.message || 'An unexpected error occurred',
    code
  };

  // Add details in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
    if (err.details) {
      errorResponse.details = err.details;
    }
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Async route handler wrapper
 * Catches async errors and passes to error handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error handler
 */
function validationErrorHandler(errors) {
  const formattedErrors = errors.map(err => ({
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
function validate(req, res, next) {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }

  next();
}

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler,
  asyncHandler,
  validationErrorHandler,
  validate
};
