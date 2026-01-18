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
import { uploadLimiter, apiLimiter } from '../middleware/rateLimit';
import { logger } from '../config/logger';

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
router.post('/jobs', authenticate, uploadLimiter, uploadSingle('masterImage'), createJob);

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
router.get('/jobs/:id', authenticate, apiLimiter, getJobById);

/**
 * GET /api/v1/smart-resizer/debug
 * Debug endpoint to test authentication and client_members query
 */
router.get('/debug', authenticate, apiLimiter, async (req, res) => {
  try {
    const user = (req as any).user;

    logger.debug('🔍 SmartResizer Debug: User from request', {
      userId: user?.id,
      userEmail: user?.email,
      clientId: user?.client_id,
    });

    const { createClient } = await import('@supabase/supabase-js');
    const testAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: memberData, error: memberError } = await testAdmin
      .from('client_members')
      .select('client_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    logger.debug('🔍 SmartResizer Debug: Query result', {
      memberData,
      memberError,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          client_id: user.client_id,
        },
        query: {
          memberData,
          memberError: memberError ? {
            message: memberError.message,
            code: memberError.code,
          } : null,
        },
      },
    });
  } catch (error) {
    logger.error('❌ SmartResizer Debug: Error', { error });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

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
router.get('/formats', authenticate, apiLimiter, listFormats);

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
router.post('/jobs/:id/retry', authenticate, apiLimiter, retryJob);

export default router;
