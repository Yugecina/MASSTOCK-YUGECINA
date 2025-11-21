/**
 * Settings Routes
 * User profile and collaborator management
 */

const express = require('express');
const { body, param } = require('express-validator');
const { asyncHandler, validationErrorHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

// Apply authentication to all settings routes
router.use(authenticate);
router.use(authLimiter);

/**
 * GET /api/v1/settings/profile
 * Get current user profile with client information
 */
router.get('/profile',
  asyncHandler(settingsController.getProfile)
);

/**
 * PUT /api/v1/settings/profile
 * Update user profile
 */
router.put('/profile',
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await settingsController.updateProfile(req, res);
  })
);

/**
 * GET /api/v1/settings/collaborators
 * Get all collaborators for the user's client
 */
router.get('/collaborators',
  asyncHandler(settingsController.getCollaborators)
);

/**
 * POST /api/v1/settings/collaborators/invite
 * Invite a new collaborator (owner only)
 */
router.post('/collaborators/invite',
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await settingsController.inviteCollaborator(req, res);
  })
);

/**
 * DELETE /api/v1/settings/collaborators/:collaborator_id
 * Remove a collaborator (owner only)
 */
router.delete('/collaborators/:collaborator_id',
  param('collaborator_id').isUUID().withMessage('Invalid collaborator ID'),
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await settingsController.removeCollaborator(req, res);
  })
);

module.exports = router;
