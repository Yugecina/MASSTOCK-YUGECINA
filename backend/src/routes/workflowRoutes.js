/**
 * Workflow Routes
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, requireClient } = require('../middleware/auth');
const { executionLimiter } = require('../middleware/rateLimit');
const workflowsController = require('../controllers/workflowsController');

const router = express.Router();

/**
 * GET /api/workflows
 * Get all workflows for client
 */
router.get('/',
  authenticate,
  requireClient,
  asyncHandler(workflowsController.getWorkflows)
);

/**
 * GET /api/workflows/:workflow_id
 * Get workflow details
 */
router.get('/:workflow_id',
  authenticate,
  requireClient,
  param('workflow_id').isUUID(),
  asyncHandler(workflowsController.getWorkflow)
);

/**
 * POST /api/workflows/:workflow_id/execute
 * Execute workflow
 */
router.post('/:workflow_id/execute',
  authenticate,
  requireClient,
  executionLimiter,
  param('workflow_id').isUUID(),
  body('input_data').isObject(),
  asyncHandler(workflowsController.executeWorkflow)
);

/**
 * GET /api/workflows/:workflow_id/executions
 * Get workflow execution history
 */
router.get('/:workflow_id/executions',
  authenticate,
  requireClient,
  param('workflow_id').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  asyncHandler(workflowsController.getWorkflowExecutions)
);

/**
 * GET /api/workflows/:workflow_id/stats
 * Get workflow statistics
 */
router.get('/:workflow_id/stats',
  authenticate,
  requireClient,
  param('workflow_id').isUUID(),
  asyncHandler(workflowsController.getWorkflowStats)
);

/**
 * GET /api/executions/:execution_id
 * Get execution status
 */
router.get('/executions/:execution_id',
  authenticate,
  requireClient,
  param('execution_id').isUUID(),
  asyncHandler(workflowsController.getExecution)
);

module.exports = router;
