/**
 * Contact Routes
 * Public endpoints for landing page contact form
 */

import { Router } from 'express';
import { submitContact } from '../controllers/contactController';
import { contactLimiter } from '../middleware/rateLimit';

const router: Router = Router();

/**
 * POST /api/v1/contact
 * Submit contact form (public endpoint, no auth required)
 * Rate limited: 5 requests per 15 minutes per IP
 */
router.post('/', contactLimiter, submitContact);

export default router;
