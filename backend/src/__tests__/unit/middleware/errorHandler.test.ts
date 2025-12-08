/**
 * Tests for Error Handler Middleware
 * Testing error handling and formatting
 */

// Mock the logger module properly for ES module exports
// MUST be at the top before any imports that use it
jest.mock('../../config/logger', () => ({
  logError: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  logRequest: jest.fn(),
  logWorkflowExecution: jest.fn(),
  logAuth: jest.fn(),
  logAudit: jest.fn()
}));

import { 
  ApiError,
  notFoundHandler,
  errorHandler,
  asyncHandler,
  validationErrorHandler
 } from '../../middleware/errorHandler';
import {  logError  } from '../../config/logger';

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      method: 'GET',
      originalUrl: '/api/test',
      user: { id: 'user-id' },
      client: { id: 'client-id' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('ApiError', () => {
    it('should create error with statusCode and message', () => {
      const error = new ApiError(404, 'Not found');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not found');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error with code', () => {
      const error = new ApiError(400, 'Bad request', 'INVALID_INPUT');

      expect(error.code).toBe('INVALID_INPUT');
    });

    it('should create error with details', () => {
      const details = { field: 'email', issue: 'invalid format' };
      const error = new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with route information', () => {
      req.method = 'POST';
      req.originalUrl = '/api/nonexistent';

      notFoundHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Route not found: POST /api/nonexistent',
        code: 'NOT_FOUND'
      });
    });
  });

  describe('errorHandler', () => {
    it('should handle ApiError correctly', () => {
      const error = new ApiError(400, 'Bad request', 'BAD_REQUEST');

      errorHandler(error, req, res, next);

      expect(logError).toHaveBeenCalledWith(error, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Bad request',
          code: 'BAD_REQUEST'
        })
      );
    });

    it('should default to 500 for unknown errors', () => {
      const error = new Error('Unknown error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'INTERNAL_ERROR'
        })
      );
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should include error details when available', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const details = { field: 'email' };
      const error = new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', details);

      errorHandler(error, req, res, next);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.details).toEqual(details);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async function', async () => {
      const asyncFn = async (req, res) => {
        res.json({ success: true });
      };

      const wrappedFn = asyncHandler(asyncFn);
      await wrappedFn(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true });
      expect(next).not.toHaveBeenCalled();
    });

    it('should catch async errors and pass to next', async () => {
      const error = new Error('Async error');
      const asyncFn = async () => {
        throw error;
      };

      const wrappedFn = asyncHandler(asyncFn);
      await wrappedFn(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle rejected promises', async () => {
      const error = new Error('Promise rejected');
      const asyncFn = () => Promise.reject(error); // Return promise directly without async

      const wrappedFn = asyncHandler(asyncFn);

      // Call the function and wait for the next tick for promise to resolve
      wrappedFn(req, res, next);

      // Wait for promise to settle
      await new Promise(resolve => setImmediate(resolve));

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('validationErrorHandler', () => {
    it('should format validation errors', () => {
      const errors = [
        { param: 'email', msg: 'Invalid email', value: 'invalid' },
        { param: 'password', msg: 'Too short', value: '123' }
      ];

      const error = validationErrorHandler(errors);

      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toHaveLength(2);
      expect(error.details[0]).toEqual({
        field: 'email',
        message: 'Invalid email',
        value: 'invalid'
      });
    });

    it('should return empty details for no errors', () => {
      const error = validationErrorHandler([]);

      expect(error.details).toHaveLength(0);
    });
  });
});
