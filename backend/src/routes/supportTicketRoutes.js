/**
 * Support Ticket Routes
 */

const express = require('express');
const { body, param } = require('express-validator');
const { asyncHandler, validate } = require('../middleware/errorHandler');
const { authenticate, requireClient } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');
const supportTicketsController = require('../controllers/supportTicketsController');

const router = express.Router();

// Apply rate limiting to all support ticket routes
router.use(apiLimiter);

/**
 * POST /api/support-tickets
 * Create new support ticket
 */
router.post('/',
  authenticate,
  requireClient,
  body('title').trim().isLength({ min: 3, max: 255 }),
  body('description').trim().isLength({ min: 10 }),
  body('priority').optional().isIn(['urgent', 'high', 'medium', 'low']),
  body('workflow_execution_id').optional().isUUID(),
  validate,
  asyncHandler(supportTicketsController.createTicket)
);

/**
 * GET /api/support-tickets
 * Get all support tickets
 */
router.get('/',
  authenticate,
  asyncHandler(supportTicketsController.getTickets)
);

/**
 * GET /api/support-tickets/:ticket_id
 * Get ticket details
 */
router.get('/:ticket_id',
  authenticate,
  param('ticket_id').isUUID(),
  validate,
  asyncHandler(supportTicketsController.getTicket)
);

/**
 * PUT /api/support-tickets/:ticket_id
 * Update ticket (admin only)
 */
router.put('/:ticket_id',
  authenticate,
  param('ticket_id').isUUID(),
  body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
  body('assigned_to').optional().isUUID(),
  body('response').optional().trim(),
  validate,
  asyncHandler(supportTicketsController.updateTicket)
);

module.exports = router;
