/**
 * Execution Routes
 * Separate routes for workflow executions
 */

import { Router } from 'express';
import { param } from 'express-validator';
import { asyncHandler, validate } from '../middleware/errorHandler';
import { authenticate, requireClient } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimit';
import * as workflowsController from '../controllers/workflowsController';

const router: Router = Router();

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

export default router;
