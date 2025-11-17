/**
 * MasStock Backend Server
 * Main application entry point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Import configurations
const { logger } = require('./config/logger');
const { testConnection } = require('./config/database');
const { testRedisConnection } = require('./config/redis');

// Import middleware
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

// Import routes
const authRoutes = require('./routes/authRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const executionRoutes = require('./routes/executionRoutes');
const workflowRequestRoutes = require('./routes/workflowRequestRoutes');
const supportTicketRoutes = require('./routes/supportTicketRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Trust proxy (required for Render, Railway, etc.)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Swagger UI
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: API_VERSION
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MasStock Backend API',
    version: API_VERSION,
    documentation: '/api-docs',
    endpoints: {
      health: '/health',
      auth: `/api/${API_VERSION}/auth`,
      workflows: `/api/${API_VERSION}/workflows`,
      executions: `/api/${API_VERSION}/executions`,
      workflow_requests: `/api/${API_VERSION}/workflow-requests`,
      support_tickets: `/api/${API_VERSION}/support-tickets`,
      admin: `/api/${API_VERSION}/admin`
    }
  });
});

// API Documentation (Swagger)
try {
  const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'MasStock API Documentation',
    customCss: '.swagger-ui .topbar { display: none }'
  }));
  logger.info('Swagger documentation loaded successfully');
} catch (error) {
  logger.warn('Swagger documentation not found or failed to load');
}

// Apply rate limiting to all API routes (MUST be before routes)
// Note: Auth routes have their own stricter rate limiting in authRoutes.js
app.use(`/api/${API_VERSION}`, apiLimiter);

// API Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/workflows`, workflowRoutes);
app.use(`/api/${API_VERSION}/executions`, executionRoutes);
app.use(`/api/${API_VERSION}/workflow-requests`, workflowRequestRoutes);
app.use(`/api/${API_VERSION}/support-tickets`, supportTicketRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

/**
 * Start server
 */
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    logger.info('Database connection successful');

    // Test Redis connection
    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
      logger.warn('Redis connection failed - job queue will not work');
    } else {
      logger.info('Redis connection successful');
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Server started successfully`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        api_version: API_VERSION
      });
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 MasStock Backend API Running                        ║
║                                                           ║
║   Port:          ${PORT}                                      ║
║   Environment:   ${process.env.NODE_ENV || 'development'}                            ║
║   API Version:   ${API_VERSION}                                      ║
║                                                           ║
║   Health:        http://localhost:${PORT}/health              ║
║   API Docs:      http://localhost:${PORT}/api-docs           ║
║   Base URL:      http://localhost:${PORT}/api/${API_VERSION}            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
