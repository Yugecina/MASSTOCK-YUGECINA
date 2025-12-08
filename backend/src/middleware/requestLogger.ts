/**
 * Request Logger Middleware
 * Logs all API requests to database and file
 */

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/database';
import { logRequest, logError } from '../config/logger';

// Type definitions
interface AuthRequest extends Request {
  user?: any;
  client?: any;
}

interface LogEntry {
  client_id: string | null;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  error_message: string | null;
  request_body: any;
  response_body: any;
  ip_address: string | undefined;
}

interface SanitizedResponse {
  truncated?: boolean;
  preview?: string;
  [key: string]: any;
}

/**
 * Log API requests
 */
function requestLogger(req: AuthRequest, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Capture original res.json to intercept response
  const originalJson = res.json.bind(res);

  res.json = function (body: any): Response {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log to file
    logRequest(req, responseTime, statusCode);

    // Log to database (async, don't block response)
    logToDatabase(req, body, statusCode, responseTime).catch((error: Error) => {
      logError(error, { middleware: 'requestLogger' });
    });

    return originalJson(body);
  };

  next();
}

/**
 * Log request to api_logs table
 */
async function logToDatabase(req: AuthRequest, responseBody: any, statusCode: number, responseTime: number): Promise<void> {
  try {
    const logEntry: LogEntry = {
      client_id: req.client?.id || null,
      endpoint: req.originalUrl,
      method: req.method,
      status_code: statusCode,
      response_time_ms: responseTime,
      error_message: responseBody?.error || null,
      request_body: sanitizeRequestBody(req.body),
      response_body: sanitizeResponseBody(responseBody),
      ip_address: req.ip
    };

    await supabaseAdmin
      .from('api_logs')
      .insert([logEntry]);
  } catch (error) {
    // Don't throw, just log the error
    logError(error as Error, { context: 'logToDatabase' });
  }
}

/**
 * Sanitize request body (remove sensitive data)
 */
function sanitizeRequestBody(body: any): any {
  if (!body) return null;

  const sanitized = { ...body };

  // Remove sensitive fields
  const sensitiveFields = ['password', 'password_hash', 'token', 'api_key', 'secret'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Sanitize response body (limit size and remove sensitive data)
 */
function sanitizeResponseBody(body: any): any {
  if (!body) return null;

  const sanitized = { ...body };

  // Remove sensitive fields
  const sensitiveFields = ['password_hash', 'api_keys', 'secret'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  // Limit size to prevent huge logs
  const jsonString = JSON.stringify(sanitized);
  if (jsonString.length > 5000) {
    return { truncated: true, preview: jsonString.substring(0, 5000) };
  }

  return sanitized;
}

export default requestLogger;
