/**
 * Request Logger Middleware
 * Logs all API requests to database and file
 */

const { supabaseAdmin } = require('../config/database');
const { logRequest, logError } = require('../config/logger');

/**
 * Log API requests
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Capture original res.json to intercept response
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log to file
    logRequest(req, responseTime, statusCode);

    // Log to database (async, don't block response)
    logToDatabase(req, body, statusCode, responseTime).catch(error => {
      logError(error, { middleware: 'requestLogger' });
    });

    return originalJson(body);
  };

  next();
}

/**
 * Log request to api_logs table
 */
async function logToDatabase(req, responseBody, statusCode, responseTime) {
  try {
    const logEntry = {
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
    logError(error, { context: 'logToDatabase' });
  }
}

/**
 * Sanitize request body (remove sensitive data)
 */
function sanitizeRequestBody(body) {
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
function sanitizeResponseBody(body) {
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

module.exports = requestLogger;
