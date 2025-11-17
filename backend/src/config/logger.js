/**
 * Logging Configuration
 * Winston logger setup for structured logging
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'masstock-backend' },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Write errors to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * Log API request
 */
function logRequest(req, responseTime, statusCode) {
  logger.info('API Request', {
    method: req.method,
    endpoint: req.originalUrl,
    status_code: statusCode,
    response_time_ms: responseTime,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    client_id: req.client?.id,
    user_id: req.user?.id
  });
}

/**
 * Log workflow execution
 */
function logWorkflowExecution(executionId, workflowId, clientId, status, metadata = {}) {
  logger.info('Workflow Execution', {
    execution_id: executionId,
    workflow_id: workflowId,
    client_id: clientId,
    status,
    ...metadata
  });
}

/**
 * Log error with context
 */
function logError(error, context = {}) {
  logger.error(error.message, {
    error: error.message,
    stack: error.stack,
    ...context
  });
}

/**
 * Log authentication event
 */
function logAuth(event, userId, metadata = {}) {
  logger.info('Authentication Event', {
    event,
    user_id: userId,
    ...metadata
  });
}

/**
 * Log audit event
 */
function logAudit(action, resourceType, resourceId, userId, clientId, changes = {}) {
  logger.info('Audit Event', {
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    user_id: userId,
    client_id: clientId,
    changes
  });
}

module.exports = {
  logger,
  logRequest,
  logWorkflowExecution,
  logError,
  logAuth,
  logAudit
};
