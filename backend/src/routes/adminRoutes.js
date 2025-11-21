/**
 * Admin Routes
 * Combined admin functionality including user management, analytics, and monitoring
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const { asyncHandler, validationErrorHandler } = require('../middleware/errorHandler');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimit');
const adminController = require('../controllers/adminController');
const adminUserController = require('../controllers/adminUserController');
const adminWorkflowController = require('../controllers/adminWorkflowController');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

/**
 * POST /api/v1/admin/create-admin
 * Create the first admin user (bootstrap endpoint)
 * NO AUTHENTICATION REQUIRED - but only works if no admin exists
 */
router.post('/create-admin',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').optional().trim(),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminController.createAdminUser(req, res);
  })
);

// Apply admin authentication and rate limiting to all routes below
router.use(authenticate);
router.use(requireAdmin);
router.use(adminLimiter);

/**
 * USER MANAGEMENT ENDPOINTS (Enhanced with search and pagination)
 */

/**
 * POST /api/v1/admin/users
 * Create new user (admin or regular user with client)
 */
router.post('/users',
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').optional().trim(),
  body('company_name').optional().trim(),
  body('plan').optional().isIn(['premium_custom', 'starter', 'pro']).withMessage('Invalid plan'),
  body('subscription_amount').optional().isNumeric().withMessage('Subscription amount must be numeric'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminUserController.createUser(req, res);
  })
);

/**
 * GET /api/v1/admin/users
 * List all users with their client information
 */
router.get('/users',
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be >= 0'),
  query('role').optional().isIn(['admin', 'user']).withMessage('Invalid role'),
  query('client_role').optional().isIn(['owner', 'collaborator']).withMessage('Invalid client role'),
  query('status').optional().isIn(['active', 'pending', 'suspended', 'deleted']).withMessage('Invalid status'),
  query('search').optional().trim(),
  query('sort').optional().isIn(['created_at', 'email', 'last_login']).withMessage('Invalid sort field'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminUserController.getUsers(req, res);
  })
);

/**
 * GET /api/v1/admin/clients
 * List all clients with pagination, filtering, and search
 */
router.get('/clients',
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be >= 0'),
  query('status').optional().isIn(['active', 'pending', 'suspended', 'deleted']).withMessage('Invalid status'),
  query('plan').optional().isIn(['premium_custom', 'starter', 'pro']).withMessage('Invalid plan'),
  query('search').optional().trim(),
  query('sort').optional().isIn(['created_at', 'name', 'email', 'subscription_amount']).withMessage('Invalid sort field'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminUserController.getClients(req, res);
  })
);

/**
 * GET /api/v1/admin/clients/:client_id
 * Get client details with stats
 */
router.get('/clients/:client_id',
  param('client_id').isUUID().withMessage('Invalid client ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminUserController.getClient(req, res);
  })
);

/**
 * POST /api/v1/admin/clients
 * Create new client (legacy endpoint - kept for backward compatibility)
 */
router.post('/clients',
  body('name').trim().isLength({ min: 2, max: 255 }),
  body('email').isEmail().normalizeEmail(),
  body('company_name').optional().trim(),
  body('plan').optional().isIn(['premium_custom', 'starter', 'pro']),
  body('subscription_amount').optional().isNumeric(),
  asyncHandler(adminController.createClient)
);

/**
 * PUT /api/v1/admin/clients/:client_id
 * Update client details
 */
router.put('/clients/:client_id',
  param('client_id').isUUID().withMessage('Invalid client ID'),
  body('status').optional().isIn(['active', 'pending', 'suspended', 'deleted']).withMessage('Invalid status'),
  body('subscription_amount').optional().isNumeric().withMessage('Subscription amount must be numeric'),
  body('plan').optional().isIn(['premium_custom', 'starter', 'pro']).withMessage('Invalid plan'),
  body('name').optional().trim(),
  body('company_name').optional().trim(),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminUserController.updateClient(req, res);
  })
);

/**
 * DELETE /api/v1/admin/clients/:client_id
 * Soft delete client (set status to suspended)
 */
router.delete('/clients/:client_id',
  param('client_id').isUUID().withMessage('Invalid client ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminUserController.deleteClient(req, res);
  })
);

/**
 * WORKFLOW MANAGEMENT ENDPOINTS (Phase 2)
 */

/**
 * GET /api/v1/admin/workflows
 * List all workflows with stats
 */
router.get('/workflows',
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be >= 0'),
  query('status').optional().isIn(['draft', 'deployed', 'archived']).withMessage('Invalid status'),
  query('client_id').optional().isUUID().withMessage('Invalid client ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminWorkflowController.getWorkflows(req, res);
  })
);

/**
 * GET /api/v1/admin/workflows/:id
 * Get single workflow with details
 */
router.get('/workflows/:id',
  param('id').isUUID().withMessage('Invalid workflow ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminWorkflowController.getWorkflow(req, res);
  })
);

/**
 * DELETE /api/v1/admin/workflows/:id
 * Archive workflow (soft delete)
 */
router.delete('/workflows/:id',
  param('id').isUUID().withMessage('Invalid workflow ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminWorkflowController.deleteWorkflow(req, res);
  })
);

/**
 * GET /api/v1/admin/workflows/:id/stats
 * Get workflow performance metrics
 */
router.get('/workflows/:id/stats',
  param('id').isUUID().withMessage('Invalid workflow ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminWorkflowController.getWorkflowStats(req, res);
  })
);

/**
 * GET /api/v1/admin/workflow-requests
 * List all workflow requests with filtering
 */
router.get('/workflow-requests',
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be >= 0'),
  query('status').optional().isIn([
    'draft', 'submitted', 'reviewing', 'negotiation',
    'contract_signed', 'development', 'deployed', 'rejected'
  ]).withMessage('Invalid status'),
  query('client_id').optional().isUUID().withMessage('Invalid client ID'),
  query('search').optional().trim(),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminWorkflowController.getWorkflowRequests(req, res);
  })
);

/**
 * GET /api/v1/admin/workflow-requests/:id
 * Get single workflow request
 */
router.get('/workflow-requests/:id',
  param('id').isUUID().withMessage('Invalid request ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminWorkflowController.getWorkflowRequest(req, res);
  })
);

/**
 * PUT /api/v1/admin/workflow-requests/:id/stage
 * Update workflow request stage
 */
router.put('/workflow-requests/:id/stage',
  param('id').isUUID().withMessage('Invalid request ID'),
  body('stage').isIn([
    'draft', 'submitted', 'reviewing', 'negotiation',
    'contract_signed', 'development', 'deployed', 'rejected'
  ]).withMessage('Invalid stage'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminWorkflowController.updateWorkflowRequestStage(req, res);
  })
);

/**
 * DASHBOARD & ANALYTICS ENDPOINTS
 */

/**
 * GET /api/v1/admin/dashboard
 * Get admin dashboard statistics
 */
router.get('/dashboard',
  asyncHandler(adminController.getDashboard)
);

/**
 * GET /api/v1/admin/errors
 * Get error logs
 */
router.get('/errors',
  query('severity').optional().isIn(['high', 'medium', 'low']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  asyncHandler(adminController.getErrors)
);

/**
 * GET /api/v1/admin/audit-logs
 * Get audit logs
 */
router.get('/audit-logs',
  query('client_id').optional().isUUID(),
  query('action').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 500 }),
  query('offset').optional().isInt({ min: 0 }),
  asyncHandler(adminController.getAuditLogs)
);

/**
 * ANALYTICS ENDPOINTS (Phase 3)
 */

/**
 * GET /api/v1/admin/analytics/overview
 * Get analytics overview with KPIs
 */
router.get('/analytics/overview',
  asyncHandler(analyticsController.getOverview)
);

/**
 * GET /api/v1/admin/analytics/executions-trend
 * Get executions trend over time (7d, 30d, 90d)
 */
router.get('/analytics/executions-trend',
  query('period').optional().isIn(['7d', '30d', '90d']).withMessage('Period must be 7d, 30d, or 90d'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await analyticsController.getExecutionsTrend(req, res);
  })
);

/**
 * GET /api/v1/admin/analytics/workflow-performance
 * Get top workflows by performance
 */
router.get('/analytics/workflow-performance',
  query('period').optional().isIn(['7d', '30d', '90d']).withMessage('Period must be 7d, 30d, or 90d'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await analyticsController.getWorkflowPerformance(req, res);
  })
);

/**
 * GET /api/v1/admin/analytics/revenue-breakdown
 * Get revenue breakdown by client or workflow
 */
router.get('/analytics/revenue-breakdown',
  query('type').optional().isIn(['client', 'workflow']).withMessage('Type must be client or workflow'),
  query('period').optional().isIn(['7d', '30d', '90d']).withMessage('Period must be 7d, 30d, or 90d'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await analyticsController.getRevenueBreakdown(req, res);
  })
);

/**
 * GET /api/v1/admin/analytics/failures
 * Get recent failed executions with details
 */
router.get('/analytics/failures',
  query('period').optional().isIn(['7d', '30d', '90d']).withMessage('Period must be 7d, 30d, or 90d'),
  query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be 1-500'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await analyticsController.getFailures(req, res);
  })
);

module.exports = router;
