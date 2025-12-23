/**
 * Smart Resizer Routes
 *
 * API endpoints:
 * - POST /jobs - Create new resize job
 * - GET /jobs/:id - Get job status and results
 * - GET /formats - List available format presets
 * - POST /jobs/:id/retry - Retry failed formats
 */

import express from 'express';
import {
  createJob,
  getJobById,
  listFormats,
  retryJob,
} from '../controllers/smartResizerController';
import { authenticate } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';

const router = express.Router();

/**
 * All Smart Resizer routes require authentication
 */

/**
 * POST /api/v1/smart-resizer/jobs
 * Create new Smart Resizer job
 *
 * Body (multipart/form-data):
 * - masterImage: File (required) - The master creative image
 * - formats: string[] (required) - Array of format keys to generate
 * - quality: 'fast' | 'balanced' | 'quality' (optional) - Processing quality
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     jobId: string,
 *     bullJobId: string,
 *     status: 'pending',
 *     formatsRequested: string[],
 *     masterImageUrl: string,
 *     createdAt: string
 *   }
 * }
 */
router.post('/jobs', authenticate, uploadSingle('masterImage'), createJob);

/**
 * GET /api/v1/smart-resizer/jobs/:id
 * Get job status and results
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     job: { ... },
 *     progress: {
 *       total: number,
 *       completed: number,
 *       failed: number,
 *       pending: number,
 *       percent: number
 *     },
 *     results: [...]
 *   }
 * }
 */
router.get('/jobs/:id', authenticate, getJobById);

/**
 * GET /api/v1/smart-resizer/formats
 * List available format presets
 *
 * Query params:
 * - platform: 'meta' | 'google' | 'dooh' | 'programmatic' (optional)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     formats: [...],
 *     packs: { meta: [...], google: [...], ... },
 *     totalCount: number
 *   }
 * }
 */
router.get('/formats', authenticate, listFormats);

/**
 * POST /api/v1/smart-resizer/jobs/:id/retry
 * Retry failed formats for a job
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     retriedCount: number
 *   }
 * }
 */
router.post('/jobs/:id/retry', authenticate, retryJob);

export default router;
