/**
 * Admin Routes
 * Combined admin functionality including user management, analytics, and monitoring
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const { asyncHandler, validationErrorHandler } = require('../middleware/errorHandler');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { authLimiter, adminLimiter } = require('../middleware/rateLimit');
const adminController = require('../controllers/adminController');
const adminUserController = require('../controllers/adminUserController');
const adminWorkflowController = require('../controllers/adminWorkflowController');
const adminClientController = require('../controllers/adminClientController');
const workflowTemplatesController = require('../controllers/workflowTemplatesController');
const analyticsController = require('../controllers/analyticsController');
const supportTicketsController = require('../controllers/supportTicketsController');

const router = express.Router();

/**
 * POST /api/v1/admin/create-admin
 * Create the first admin user (bootstrap endpoint)
 * NO AUTHENTICATION REQUIRED - but only works if no admin exists
 */
router.post('/create-admin',
  authLimiter, // Protect against brute-force and enumeration attacks
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
 * Create new user
 * - For role='user': client_id is required, user is added to client_members
 * - For role='admin': no client association needed
 */
router.post('/users',
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').optional().trim(),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  body('client_id').optional().isUUID().withMessage('Invalid client ID'),
  body('member_role').optional().isIn(['owner', 'collaborator']).withMessage('Member role must be owner or collaborator'),
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
 * Create new client (company) - members added separately
 */
router.post('/clients',
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Company name must be 2-255 characters'),
  body('plan').optional().isIn(['premium_custom', 'starter', 'pro']).withMessage('Invalid plan'),
  body('subscription_amount').optional().isNumeric().withMessage('Subscription amount must be numeric'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminController.createClient(req, res);
  })
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
 * CLIENT MEMBERS ENDPOINTS
 */

/**
 * GET /api/v1/admin/clients/:client_id/members
 * List all members of a client
 */
router.get('/clients/:client_id/members',
  param('client_id').isUUID().withMessage('Invalid client ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminClientController.getClientMembers(req, res);
  })
);

/**
 * POST /api/v1/admin/clients/:client_id/members
 * Add a user to a client
 */
router.post('/clients/:client_id/members',
  param('client_id').isUUID().withMessage('Invalid client ID'),
  body('user_id').isUUID().withMessage('Invalid user ID'),
  body('role').isIn(['owner', 'collaborator']).withMessage('Role must be owner or collaborator'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminClientController.addClientMember(req, res);
  })
);

/**
 * PUT /api/v1/admin/clients/:client_id/members/:member_id
 * Update member role
 */
router.put('/clients/:client_id/members/:member_id',
  param('client_id').isUUID().withMessage('Invalid client ID'),
  param('member_id').isUUID().withMessage('Invalid member ID'),
  body('role').isIn(['owner', 'collaborator']).withMessage('Role must be owner or collaborator'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminClientController.updateClientMemberRole(req, res);
  })
);

/**
 * DELETE /api/v1/admin/clients/:client_id/members/:member_id
 * Remove member from client
 */
router.delete('/clients/:client_id/members/:member_id',
  param('client_id').isUUID().withMessage('Invalid client ID'),
  param('member_id').isUUID().withMessage('Invalid member ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminClientController.removeClientMember(req, res);
  })
);

/**
 * CLIENT WORKFLOWS ENDPOINTS
 */

/**
 * GET /api/v1/admin/clients/:client_id/workflows
 * List all workflows of a client
 */
router.get('/clients/:client_id/workflows',
  param('client_id').isUUID().withMessage('Invalid client ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminClientController.getClientWorkflows(req, res);
  })
);

/**
 * POST /api/v1/admin/clients/:client_id/workflows
 * Assign a workflow template to a client
 */
router.post('/clients/:client_id/workflows',
  param('client_id').isUUID().withMessage('Invalid client ID'),
  body('template_id').isUUID().withMessage('Invalid template ID'),
  body('name').optional().trim(),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminClientController.assignWorkflowToClient(req, res);
  })
);

/**
 * DELETE /api/v1/admin/clients/:client_id/workflows/:workflow_id
 * Remove workflow from client (archive)
 */
router.delete('/clients/:client_id/workflows/:workflow_id',
  param('client_id').isUUID().withMessage('Invalid client ID'),
  param('workflow_id').isUUID().withMessage('Invalid workflow ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminClientController.removeClientWorkflow(req, res);
  })
);

/**
 * CLIENT EXECUTIONS ENDPOINTS
 */

/**
 * GET /api/v1/admin/clients/:client_id/executions
 * List all executions of a client with filters
 */
router.get('/clients/:client_id/executions',
  param('client_id').isUUID().withMessage('Invalid client ID'),
  query('workflow_id').optional().isUUID().withMessage('Invalid workflow ID'),
  query('user_id').optional().isUUID().withMessage('Invalid user ID'),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed']).withMessage('Invalid status'),
  query('date_from').optional().isISO8601().withMessage('Invalid date format'),
  query('date_to').optional().isISO8601().withMessage('Invalid date format'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminClientController.getClientExecutions(req, res);
  })
);

/**
 * CLIENT ACTIVITY ENDPOINTS
 */

/**
 * GET /api/v1/admin/clients/:client_id/activity
 * Get audit logs for a client
 */
router.get('/clients/:client_id/activity',
  param('client_id').isUUID().withMessage('Invalid client ID'),
  query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be 1-500'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be >= 0'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminClientController.getClientActivity(req, res);
  })
);

/**
 * USER SEARCH ENDPOINT (for adding members)
 */

/**
 * GET /api/v1/admin/users/search
 * Search users for adding to clients
 */
router.get('/users/search',
  query('q')
    .notEmpty().withMessage('Search query is required')
    .trim()
    .isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('exclude_client_id').optional().isUUID().withMessage('Invalid client ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await adminClientController.searchUsersForMember(req, res);
  })
);


/**
 * WORKFLOW TEMPLATES ENDPOINTS
 */

/**
 * GET /api/v1/admin/workflow-templates
 * List all active workflow templates
 */
router.get('/workflow-templates',
  asyncHandler(workflowTemplatesController.getTemplates)
);

/**
 * GET /api/v1/admin/workflow-templates/:id
 * Get single workflow template
 */
router.get('/workflow-templates/:id',
  param('id').isUUID().withMessage('Invalid template ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await workflowTemplatesController.getTemplate(req, res);
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

/**
 * SUPPORT TICKETS ENDPOINTS
 */

/**
 * GET /api/v1/admin/tickets
 * Get all support tickets
 */
router.get('/tickets',
  asyncHandler(async (req, res, next) => {
    await supportTicketsController.getTickets(req, res);
  })
);

/**
 * GET /api/v1/admin/tickets/:ticket_id
 * Get single ticket details
 */
router.get('/tickets/:ticket_id',
  param('ticket_id').isUUID().withMessage('Invalid ticket ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await supportTicketsController.getTicket(req, res);
  })
);

/**
 * PUT /api/v1/admin/tickets/:ticket_id
 * Update ticket status (admin only)
 */
router.put('/tickets/:ticket_id',
  param('ticket_id').isUUID().withMessage('Invalid ticket ID'),
  body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await supportTicketsController.updateTicket(req, res);
  })
);

module.exports = router;
