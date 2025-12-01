/**
 * Assets Routes
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, requireClient } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');
const { getAssets } = require('../controllers/assetsController');

const router = express.Router();

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

module.exports = router;
