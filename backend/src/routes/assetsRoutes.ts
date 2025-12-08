/**
 * Assets Routes
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, requireClient } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimit';
import { getAssets } from '../controllers/assetsController';

const router: Router = Router();

/**
 * GET /api/v1/assets
 * Get all assets for the authenticated client with cursor-based pagination
 *
 * Query params:
 * - cursor: UUID of last item for pagination
 * - limit: Items per page (1-100, default 50)
 * - asset_type: Filter by type ('all', 'image', 'video', 'lipsync', 'upscaled')
 * - sort: Sort order ('newest' or 'oldest')
 *
 * Note: Input validation handled by Zod in controller
 */
router.get('/',
  authenticate,
  requireClient,
  apiLimiter,
  asyncHandler(getAssets)
);

export default router;
