/**
 * Smart Resizer Controller
 *
 * API endpoints for Smart Resizer workflow:
 * - POST /jobs - Create new resize job
 * - GET /jobs/:id - Get job status and results
 * - GET /formats - List available format presets
 * - POST /jobs/:id/retry - Retry failed formats
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { fileTypeFromBuffer } from 'file-type';
import { supabaseAdmin } from '../config/database';
import smartResizerQueue from '../queues/smartResizerQueue';
import { SmartResizerJobData } from '../services/smartResizerService';
import * as imageProcessing from '../services/imageProcessingService';
import {
  getAllFormatKeys,
  getFormatsByPlatform,
  FORMAT_PRESETS,
  FORMAT_PACKS,
  FormatPresetKey,
} from '../utils/formatPresets';
import { logger } from '../config/logger';

/**
 * Validation Schemas
 */
const createJobSchema = z.object({
  formats: z.array(z.string()).min(1, 'At least one format is required'),
  quality: z.enum(['fast', 'balanced', 'quality']).optional().default('balanced'),
});

/**
 * Create new Smart Resizer job
 * POST /api/v1/smart-resizer/jobs
 */
export async function createJob(req: Request, res: Response): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('📁 SmartResizerController: Create job request', {
      files: req.files ? (Array.isArray(req.files) ? req.files.length : Object.keys(req.files).length) : 0,
      body: req.body,
    });
  }

  try {
    // 1. Parse FormData fields (FormData sends all values as strings)
    const parsedBody = {
      ...req.body,
      formats: typeof req.body.formats === 'string'
        ? JSON.parse(req.body.formats)
        : req.body.formats,
    };

    // 2. Validate request body
    const validatedData = createJobSchema.parse(parsedBody);
    const { formats, quality } = validatedData;

    // 3. Validate uploaded file
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'Master image file is required',
        code: 'MISSING_FILE',
      });
      return;
    }

    // 3b. Validate file type with magic bytes (security)
    const fileType = await fileTypeFromBuffer(req.file.buffer);

    if (!fileType || !['image/jpeg', 'image/png', 'image/webp'].includes(fileType.mime)) {
      logger.error('❌ SmartResizerController: Invalid file type detected', {
        detectedMime: fileType?.mime,
        uploadedMime: req.file.mimetype,
        fileName: req.file.originalname,
      });
      res.status(400).json({
        success: false,
        error: 'Invalid file type detected. Only JPEG, PNG, and WebP images are allowed.',
        code: 'INVALID_FILE_TYPE',
      });
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('✅ SmartResizerController: File type validated', {
        mime: fileType.mime,
        extension: fileType.ext,
        size: `${(req.file.buffer.length / 1024).toFixed(2)}KB`,
      });
    }

    // 3c. Validate image dimensions (prevent Sharp crashes)
    const MAX_DIMENSION = 8000; // 8K max
    try {
      const metadata = await imageProcessing.getImageMetadata(req.file.buffer);

      if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
        logger.error('❌ SmartResizerController: Image dimensions too large', {
          width: metadata.width,
          height: metadata.height,
          maxAllowed: MAX_DIMENSION,
        });
        res.status(400).json({
          success: false,
          error: `Image dimensions too large. Maximum ${MAX_DIMENSION}px per side. Your image is ${metadata.width}x${metadata.height}px.`,
          code: 'IMAGE_TOO_LARGE',
        });
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        logger.debug('✅ SmartResizerController: Image dimensions validated', {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
        });
      }
    } catch (error) {
      logger.error('❌ SmartResizerController: Failed to read image metadata', {
        error: (error as Error).message,
      });
      res.status(400).json({
        success: false,
        error: 'Failed to read image metadata. Please ensure the file is a valid image.',
        code: 'INVALID_IMAGE',
      });
      return;
    }

    // 4. Get authenticated user
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // 5. Get user's client_id (already loaded by auth middleware)
    // No need to query client_members - user.client_id is set in auth.ts line 140
    if (!user.client_id) {
      logger.error('❌ SmartResizerController: User has no client_id', {
        userId: user.id,
        userEmail: user.email,
        hint: 'User must have a client_id in users table',
      });
      res.status(403).json({
        success: false,
        error: 'User is not associated with any client. Please contact support.',
        code: 'NO_CLIENT_ASSOCIATION',
      });
      return;
    }

    const clientId = user.client_id;

    if (process.env.NODE_ENV === 'development') {
      logger.debug('✅ SmartResizerController: Resolved client', {
        userId: user.id,
        clientId,
        source: 'users.client_id (via auth middleware)',
      });
    }

    // 6. Validate format keys
    const allFormatKeys = getAllFormatKeys();
    const invalidFormats = formats.filter(f => !allFormatKeys.includes(f as FormatPresetKey));

    if (invalidFormats.length > 0) {
      res.status(400).json({
        success: false,
        error: `Invalid format keys: ${invalidFormats.join(', ')}`,
        code: 'INVALID_FORMATS',
      });
      return;
    }

    // 7. Upload master image to Supabase Storage
    const timestamp = Date.now();
    const storagePath = `smart-resizer/masters/${clientId}/${timestamp}_${req.file.originalname}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('workflow-results')
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      logger.error('❌ SmartResizerController: Upload failed', {
        error: uploadError.message,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to upload master image',
        code: 'UPLOAD_ERROR',
      });
      return;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('workflow-results')
      .getPublicUrl(storagePath);

    const masterImageUrl = urlData.publicUrl;

    // 8. Create job record in database
    const { data: jobRecord, error: jobError } = await supabaseAdmin
      .from('smart_resizer_jobs')
      .insert({
        client_id: clientId,
        user_id: user.id,
        master_image_url: masterImageUrl,
        master_storage_path: storagePath,
        formats_requested: formats,
        status: 'pending',
      })
      .select()
      .single();

    if (jobError || !jobRecord) {
      logger.error('❌ SmartResizerController: Job creation failed', {
        error: jobError?.message,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to create job record',
        code: 'JOB_CREATE_ERROR',
      });
      return;
    }

    // 9. Add job to Bull queue
    // Convert buffer to base64 string for Redis/Bull serialization
    const jobData: SmartResizerJobData = {
      jobId: jobRecord.id,
      clientId,
      userId: user.id,
      masterImageBuffer: req.file.buffer.toString('base64'), // Base64 string for Redis
      formatsRequested: formats as FormatPresetKey[],
    };

    const bullJob = await smartResizerQueue.add(jobData, {
      priority: quality === 'fast' ? 1 : quality === 'quality' ? 3 : 2,
    });

    if (process.env.NODE_ENV === 'development') {
      logger.debug('✅ SmartResizerController: Job created', {
        jobId: jobRecord.id,
        bullJobId: bullJob.id,
        formatCount: formats.length,
      });
    }

    // 10. Return response
    res.status(201).json({
      success: true,
      data: {
        jobId: jobRecord.id,
        bullJobId: bullJob.id,
        status: 'pending',
        formatsRequested: formats,
        masterImageUrl,
        createdAt: jobRecord.created_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      res.status(400).json({
        success: false,
        error: 'Invalid JSON format in request data',
        code: 'INVALID_JSON',
      });
      return;
    }

    logger.error('❌ SmartResizerController.createJob: Error', {
      error: (error as Error).message,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * Get job status and results
 * GET /api/v1/smart-resizer/jobs/:id
 */
export async function getJobById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // 1. Get job record
    const { data: jobRecord, error: jobError } = await supabaseAdmin
      .from('smart_resizer_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobError || !jobRecord) {
      res.status(404).json({
        success: false,
        error: 'Job not found',
        code: 'JOB_NOT_FOUND',
      });
      return;
    }

    // 2. Check authorization (user's client only)
    // Use user.client_id from auth middleware (no DB query needed)
    if (!user.client_id || user.client_id !== jobRecord.client_id) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN',
      });
      return;
    }

    // 3. Get results
    const { data: results, error: resultsError } = await supabaseAdmin
      .from('smart_resizer_results')
      .select('*')
      .eq('job_id', id)
      .order('created_at', { ascending: true });

    if (resultsError) {
      logger.error('❌ SmartResizerController: Failed to fetch results', {
        error: resultsError.message,
      });
    }

    // 4. Calculate progress
    const totalFormats = jobRecord.formats_requested.length;
    const completedFormats = results?.filter(r => r.status === 'completed').length || 0;
    const failedFormats = results?.filter(r => r.status === 'failed').length || 0;
    const progressPercent = totalFormats > 0 ? Math.round((completedFormats / totalFormats) * 100) : 0;

    if (process.env.NODE_ENV === 'development') {
      logger.debug('📊 SmartResizerController: Job status', {
        jobId: id,
        status: jobRecord.status,
        progress: `${completedFormats}/${totalFormats} (${progressPercent}%)`,
      });
    }

    // 5. Return response
    res.json({
      success: true,
      data: {
        job: {
          id: jobRecord.id,
          status: jobRecord.status,
          masterImageUrl: jobRecord.master_image_url,
          formatsRequested: jobRecord.formats_requested,
          detectedContent: jobRecord.detected_content,
          createdAt: jobRecord.created_at,
          completedAt: jobRecord.completed_at,
        },
        progress: {
          total: totalFormats,
          completed: completedFormats,
          failed: failedFormats,
          pending: totalFormats - completedFormats - failedFormats,
          percent: progressPercent,
        },
        results: results || [],
      },
    });
  } catch (error) {
    logger.error('❌ SmartResizerController.getJobById: Error', {
      error: (error as Error).message,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * List available format presets
 * GET /api/v1/smart-resizer/formats
 */
export async function listFormats(req: Request, res: Response): Promise<void> {
  try {
    const { platform } = req.query;

    let formats: any[];

    if (platform && typeof platform === 'string') {
      // Filter by platform
      const platformFormats = getFormatsByPlatform(platform as any);
      formats = platformFormats.map(key => ({
        key,
        ...FORMAT_PRESETS[key],
      }));
    } else {
      // Return all formats
      const allKeys = getAllFormatKeys();
      formats = allKeys.map(key => ({
        key,
        ...FORMAT_PRESETS[key],
      }));
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('📋 SmartResizerController: List formats', {
        platform: platform || 'all',
        count: formats.length,
      });
    }

    res.json({
      success: true,
      data: {
        formats,
        packs: FORMAT_PACKS,
        totalCount: formats.length,
      },
    });
  } catch (error) {
    logger.error('❌ SmartResizerController.listFormats: Error', {
      error: (error as Error).message,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * Retry failed formats
 * POST /api/v1/smart-resizer/jobs/:id/retry
 */
export async function retryJob(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // 1. Get job record
    const { data: jobRecord, error: jobError } = await supabaseAdmin
      .from('smart_resizer_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobError || !jobRecord) {
      res.status(404).json({
        success: false,
        error: 'Job not found',
        code: 'JOB_NOT_FOUND',
      });
      return;
    }

    // 2. Check authorization
    // Use user.client_id from auth middleware (no DB query needed)
    if (!user.client_id || user.client_id !== jobRecord.client_id) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN',
      });
      return;
    }

    // 3. Get failed formats
    const { data: failedResults } = await supabaseAdmin
      .from('smart_resizer_results')
      .select('format_name')
      .eq('job_id', id)
      .eq('status', 'failed');

    if (!failedResults || failedResults.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No failed formats to retry',
        code: 'NO_FAILED_FORMATS',
      });
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('🔄 SmartResizerController: Retry job', {
        jobId: id,
        failedCount: failedResults.length,
      });
    }

    // 4. TODO: Implement retry logic (for now, return error)
    res.status(501).json({
      success: false,
      error: 'Retry functionality not yet implemented',
      code: 'NOT_IMPLEMENTED',
    });
  } catch (error) {
    logger.error('❌ SmartResizerController.retryJob: Error', {
      error: (error as Error).message,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}
