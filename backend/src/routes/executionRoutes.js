/**
 * Execution Routes
 * Separate routes for workflow executions
 */

const express = require('express');
const { param } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, requireClient } = require('../middleware/auth');
const workflowsController = require('../controllers/workflowsController');

const router = express.Router();

/**
 * GET /api/executions/:execution_id
 * Get execution status and results
 */
router.get('/:execution_id',
  authenticate,
  requireClient,
  param('execution_id').isUUID(),
  asyncHandler(workflowsController.getExecution)
);

module.exports = router;
