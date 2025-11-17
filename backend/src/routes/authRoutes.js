/**
 * Authentication Routes
 */

const express = require('express');
const { body } = require('express-validator');
const { asyncHandler, validationErrorHandler } = require('../middleware/errorHandler');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const authController = require('../controllers/authController');

const router = express.Router();

// Validation middleware
const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').optional().trim(),
  body('company_name').optional().trim(),
  body('subscription_amount').optional().isNumeric()
];

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login',
  authLimiter,
  validateLogin,
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await authController.login(req, res);
  })
);

/**
 * POST /api/auth/logout
 * User logout
 */
router.post('/logout',
  authenticate,
  asyncHandler(authController.logout)
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh',
  asyncHandler(authController.refreshToken)
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me',
  authenticate,
  asyncHandler(authController.getMe)
);

/**
 * POST /api/auth/register
 * Register new user (Admin only)
 */
router.post('/register',
  authenticate,
  requireAdmin,
  validateRegister,
  asyncHandler(async (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }
    await authController.register(req, res);
  })
);

module.exports = router;
