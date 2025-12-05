/**
 * Execution Routes
 * Separate routes for workflow executions
 */

const express = require('express');
const { param } = require('express-validator');
const { asyncHandler, validate } = require('../middleware/errorHandler');
const { authenticate, requireClient } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');
const workflowsController = require('../controllers/workflowsController');

const router = express.Router();

/**
 * GET /api/executions/:execution_id
 * Get execution status and results
 */
router.get('/:execution_id',
  authenticate,
  requireClient,
  apiLimiter,
  param('execution_id').isUUID(),
  validate,
  asyncHandler(workflowsController.getExecution)
);

/**
 * GET /api/executions/:execution_id/batch-results
 * Get batch results for an execution (for workflows like nano_banana)
 */
router.get('/:execution_id/batch-results',
  authenticate,
  requireClient,
  apiLimiter,
  param('execution_id').isUUID(),
  validate,
  asyncHandler(workflowsController.getExecutionBatchResults)
);

module.exports = router;
