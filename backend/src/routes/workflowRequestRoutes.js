/**
 * Workflow Request Routes
 */

const express = require('express');
const { body, param } = require('express-validator');
const { asyncHandler, validate } = require('../middleware/errorHandler');
const { authenticate, requireClient } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');
const workflowRequestsController = require('../controllers/workflowRequestsController');

const router = express.Router();

// Apply rate limiting to all workflow request routes
router.use(apiLimiter);

/**
 * POST /api/workflow-requests
 * Create new workflow request
 */
router.post('/',
  authenticate,
  requireClient,
  body('title').trim().isLength({ min: 3, max: 255 }),
  body('description').trim().isLength({ min: 10 }),
  body('use_case').optional().trim(),
  body('frequency').optional().isIn(['daily', 'weekly', 'monthly', 'sporadic']),
  body('budget').optional().isNumeric(),
  validate,
  asyncHandler(workflowRequestsController.createWorkflowRequest)
);

/**
 * GET /api/workflow-requests
 * Get all workflow requests
 */
router.get('/',
  authenticate,
  requireClient,
  asyncHandler(workflowRequestsController.getWorkflowRequests)
);

/**
 * GET /api/workflow-requests/:request_id
 * Get workflow request details
 */
router.get('/:request_id',
  authenticate,
  requireClient,
  param('request_id').isUUID(),
  validate,
  asyncHandler(workflowRequestsController.getWorkflowRequest)
);

/**
 * PUT /api/workflow-requests/:request_id
 * Update workflow request
 */
router.put('/:request_id',
  authenticate,
  param('request_id').isUUID(),
  body('status').optional().isIn([
    'draft', 'submitted', 'reviewing', 'negotiation',
    'contract_signed', 'development', 'deployed', 'rejected'
  ]),
  body('notes').optional().trim(),
  body('estimated_cost').optional().isNumeric(),
  body('estimated_dev_days').optional().isInt({ min: 0 }),
  validate,
  asyncHandler(workflowRequestsController.updateWorkflowRequest)
);

module.exports = router;
