/**
 * Workflow Routes
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler, validate } from '../middleware/errorHandler';
import { authenticate, requireClient } from '../middleware/auth';
import { executionLimiter } from '../middleware/rateLimit';
import { upload, handleUploadError } from '../middleware/upload';
import * as workflowsController from '../controllers/workflowsController';

const router: Router = Router();

/**
 * GET /api/workflows/client/members
 * Get all members of the current client (for filtering executions by collaborator)
 */
router.get('/client/members',
  authenticate,
  requireClient,
  asyncHandler(workflowsController.getClientMembers)
);

/**
 * GET /api/workflows/stats/dashboard
 * Get dashboard stats
 */
router.get('/stats/dashboard',
  authenticate,
  requireClient,
  asyncHandler(workflowsController.getDashboardStats)
);

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
 * GET /api/workflows/executions/all
 * Get all executions for client with pagination and filters
 * Supports lazy loading
 */
router.get('/executions/all',
  authenticate,
  requireClient,
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('status').optional().isString(),
  query('workflow_id').optional(),
  query('user_id').optional(),
  query('fields').optional().isString(),
  validate,
  asyncHandler(workflowsController.getAllClientExecutions)
);

/**
 * GET /api/workflows/:workflow_id
 * Get workflow details
 */
router.get('/:workflow_id',
  authenticate,
  requireClient,
  param('workflow_id').isUUID(),
  validate,
  asyncHandler(workflowsController.getWorkflow)
);

/**
 * POST /api/workflows/:workflow_id/execute
 * Execute workflow
 * Supports both JSON and multipart/form-data (for workflows with file uploads like nano_banana and smart_resizer)
 */
router.post('/:workflow_id/execute',
  authenticate,
  requireClient,
  executionLimiter,
  upload.fields([
    { name: 'reference_images', maxCount: 14 }, // For nano_banana workflow
    { name: 'master_image', maxCount: 1 }, // For smart_resizer workflow (single)
    { name: 'images', maxCount: 20 } // For smart_resizer workflow (batch)
  ]),
  handleUploadError,
  param('workflow_id').isUUID(),
  // Note: input_data validation removed to support both JSON and FormData
  validate,
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
  validate,
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
  validate,
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
  validate,
  asyncHandler(workflowsController.getExecution)
);

/**
 * GET /api/executions/:execution_id/batch-results
 * Get batch results for workflows with batch processing (e.g., nano_banana)
 */
router.get('/executions/:execution_id/batch-results',
  authenticate,
  requireClient,
  param('execution_id').isUUID(),
  validate,
  asyncHandler(workflowsController.getExecutionBatchResults)
);

export default router;
