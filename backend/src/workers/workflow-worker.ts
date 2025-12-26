import pLimit from 'p-limit';
import { Job } from 'bull';
import { workflowQueue, WorkflowJobData } from '../queues/workflowQueue';
import smartResizerQueue from '../queues/smartResizerQueue';
import { supabaseAdmin } from '../config/database';
import { createGeminiImageService, ReferenceImage } from '../services/geminiImageService';
import { decryptApiKey, EncryptedData } from '../utils/encryption';
import { logger } from '../config/logger';
import apiRateLimiter from '../utils/apiRateLimiter';
import { RateLimiterStats } from '../utils/apiRateLimiter';
import smartResizerService, { SmartResizerJobData, SmartResizerResult } from '../services/smartResizerService';
import { FormatPresetKey } from '../utils/formatPresets';
import {
  logWorkflowStart,
  logPromptProcessing,
  logDecryption,
  logStorageUpload,
  logStorageSuccess,
  logDatabaseOperation,
  logSuccess,
  logError,
  logWorkflowComplete,
  logWorkflowFailed
} from '../utils/workflowLogger';

logger.debug('🚀 General workflow worker starting...');

interface InputData {
  prompts: string[];
  reference_images?: ReferenceImage[];
}

interface SmartResizerInputData {
  batch: Array<{
    image_base64: string;
    image_mime: string;
    image_name: string;
    formats: FormatPresetKey[];
  }>;
  ai_regeneration: boolean;
  pricing_details: {
    cost_per_format: number;
    total_cost: number;
    total_revenue: number;
    format_count: number;
    image_count: number;
  };
}

interface WorkflowConfig {
  api_key_encrypted?: Partial<EncryptedData> | string;
  model?: string;
  aspect_ratio?: string;
  resolution?: string;
  workflow_type?: string;
  [key: string]: any;
}

interface ProcessingResult {
  success: boolean;
  processingTime: number;
  publicUrl?: string;
  error?: any;
}

interface WorkflowResult {
  success: boolean;
  successCount: number;
  failCount: number;
  totalPrompts: number;
}

/**
 * Process Nano Banana workflow (batch image generation)
 */
async function processNanoBananaWorkflow(
  job: Job<WorkflowJobData>,
  executionId: string,
  inputData: InputData,
  config: WorkflowConfig
): Promise<WorkflowResult> {
  const workflowStartTime = Date.now();
  const { prompts, reference_images } = inputData;
  const totalPrompts = prompts.length;
  const referenceImagesBase64 = reference_images || [];

  // DEBUG: Log inputData structure
  logger.debug(`🔍 WORKER INPUT DATA:`, {
    inputData_keys: Object.keys(inputData),
    reference_images_type: typeof reference_images,
    reference_images_is_array: Array.isArray(reference_images),
    reference_images_value: reference_images,
    reference_images_length: reference_images?.length,
    referenceImagesBase64_length: referenceImagesBase64.length
  });

  logger.debug(`\n🎬 Processing Nano Banana workflow - Execution ID: ${executionId}`);
  logger.debug(`   Prompts: ${totalPrompts}, Reference images: ${referenceImagesBase64.length}`);

  // Log workflow start with all context
  logWorkflowStart(executionId, 'nano_banana', {
    workflowId: job.data.workflowId,
    clientId: job.data.clientId,
    numberOfPrompts: totalPrompts,
    hasApiKey: !!config.api_key_encrypted,
    hasReferenceImages: referenceImagesBase64.length > 0,
    referenceImageCount: referenceImagesBase64.length
  });

  // Declare variables that need to be accessible in the for-loop
  let geminiService;
  let aspectRatio: string;
  let resolution: string;

  // Validate and decrypt API key
  try {
    if (!config.api_key_encrypted) {
      throw new Error('Missing API key in workflow config. Please provide api_key when executing the workflow.');
    }

    logger.debug('Processing Nano Banana workflow', {
      executionId,
      hasEncryptedKey: !!config.api_key_encrypted,
      encryptedKeyType: typeof config.api_key_encrypted,
      configKeys: Object.keys(config)
    });

    // Parse if string, otherwise use as-is
    const encryptedData = typeof config.api_key_encrypted === 'string'
      ? JSON.parse(config.api_key_encrypted)
      : config.api_key_encrypted;

    // decryptApiKey expects Partial<EncryptedData> object
    const decryptedApiKey = decryptApiKey(encryptedData);

    logDecryption(true, {
      keyLength: decryptedApiKey?.length
    });

    logger.debug('API key decrypted', {
      hasDecryptedKey: !!decryptedApiKey,
      decryptedKeyLength: decryptedApiKey?.length
    });

    geminiService = createGeminiImageService(decryptedApiKey);

    // Set model with fallback
    const model = config.model || 'gemini-2.5-flash-image';
    geminiService.setModel(model);

    // Get aspect ratio and resolution with fallbacks
    aspectRatio = config.aspect_ratio || '1:1';
    resolution = config.resolution || '1K';

    logger.info('🎨 Nano Banana Config:', {
      model,
      aspectRatio,
      resolution,
      promptCount: prompts.length
    });
  } catch (error) {
    const err = error as Error;
    logDecryption(false, { error: err.message });
    logError('API_KEY_DECRYPTION', err, {
      executionId,
      hasEncryptedKey: !!config.api_key_encrypted,
      encryptedKeyType: typeof config.api_key_encrypted
    });
    throw error;
  }

  // Configure concurrency based on model (Flash = faster, Pro = slower)
  const model = config.model || 'gemini-2.5-flash-preview-image';
  const isFlash = model.includes('flash');

  const PROMPT_CONCURRENCY = isFlash
    ? parseInt(process.env.PROMPT_CONCURRENCY_FLASH || '15', 10)
    : parseInt(process.env.PROMPT_CONCURRENCY_PRO || '10', 10);

  const limit = pLimit(PROMPT_CONCURRENCY);

  logger.debug(`🔧 Model: ${model} (${isFlash ? 'Flash' : 'Pro'})`);
  logger.debug(`🔧 Prompt concurrency set to: ${PROMPT_CONCURRENCY} parallel prompts`);
  logger.debug(`📊 Rate limiter stats: ${JSON.stringify(apiRateLimiter.getStats(model))}`);

  /**
   * Process a single prompt with Gemini API
   * Includes rate limiting, error handling, and database updates
   */
  const processSinglePrompt = async (prompt: string, batchIndex: number, promptIndex: number): Promise<ProcessingResult> => {
    const promptStartTime = Date.now();

    logger.debug(`\n🔄 Processing prompt ${promptIndex + 1}/${totalPrompts}: "${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}"`);

    // Update job progress (approximate based on started prompts)
    const progress = Math.floor(((promptIndex + 1) / totalPrompts) * 90);
    job.progress(progress);

    // Log prompt processing start - use batchId instead of batchIndex to match interface
    logPromptProcessing(promptIndex + 1, totalPrompts, prompt, { batchId: String(batchIndex) });

    try {
      // Insert initial batch result
      logDatabaseOperation('INSERT', 'workflow_batch_results', {
        execution_id: executionId,
        batch_index: batchIndex,
        status: 'processing'
      });

      await supabaseAdmin
        .from('workflow_batch_results')
        .insert({
          execution_id: executionId,
          batch_index: batchIndex,
          prompt_text: prompt,
          status: 'processing'
        });

      // Acquire rate limiter slot before calling API (model-specific)
      const rateLimiterStats = apiRateLimiter.getStats(model) as RateLimiterStats;
      logger.debug(`🚦 Acquiring ${isFlash ? 'Flash' : 'Pro'} rate limiter slot... (Queue: ${rateLimiterStats.queuedRequests || 0})`);
      await apiRateLimiter.acquire(model);
      logger.debug(`✅ Rate limiter slot acquired`);

      // Generate image with Gemini
      const startTime = Date.now();
      logger.debug(`⏱️  Calling Gemini API...`);

      const result = await geminiService.generateImage(prompt, {
        referenceImages: referenceImagesBase64,
        aspectRatio: aspectRatio,
        imageSize: resolution
      });

      const processingTime = Date.now() - startTime;

      logger.debug(`⏱️  Completed in ${(processingTime / 1000).toFixed(2)}s`);
      logger.debug(`📊 Rate limiter stats: ${JSON.stringify(apiRateLimiter.getStats(model))}`);

      if (result.success) {
        logger.debug(`✅ Image generated successfully`);

        // Upload to storage
        const imageBuffer = Buffer.from(result.imageData!, 'base64');
        const fileName = `${executionId}/${batchIndex}_${Date.now()}.png`;

        logStorageUpload('workflow-results', fileName, imageBuffer.length, {
          contentType: result.mimeType || 'image/png'
        });

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('workflow-results')
          .upload(fileName, imageBuffer, {
            contentType: result.mimeType || 'image/png'
          });

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('workflow-results')
          .getPublicUrl(fileName);

        logStorageSuccess(publicUrl, {
          uploadTime: Date.now() - startTime
        });

        // Update batch result with success
        logDatabaseOperation('UPDATE', 'workflow_batch_results', {
          status: 'completed',
          result_url: publicUrl
        });

        await supabaseAdmin
          .from('workflow_batch_results')
          .update({
            status: 'completed',
            result_url: publicUrl,
            result_storage_path: fileName,
            processing_time_ms: processingTime,
            completed_at: new Date().toISOString()
          })
          .eq('execution_id', executionId)
          .eq('batch_index', batchIndex);

        const promptTotalTime = Date.now() - promptStartTime;
        logSuccess(`Prompt ${promptIndex + 1}/${totalPrompts}`, {
          processingTime: `${(processingTime / 1000).toFixed(2)}s`,
          totalTime: `${(promptTotalTime / 1000).toFixed(2)}s`,
          imageUrl: publicUrl
        });

        return { success: true, processingTime, publicUrl };

      } else {
        logger.debug(`❌ Image generation failed for prompt ${promptIndex + 1}`);

        logError('IMAGE_GENERATION', result.error!, {
          executionId,
          promptIndex: promptIndex + 1,
          totalPrompts,
          prompt,
          processingTime
        });

        // Update batch result with failure
        await supabaseAdmin
          .from('workflow_batch_results')
          .update({
            status: 'failed',
            error_message: result.error!.message,
            processing_time_ms: processingTime,
            completed_at: new Date().toISOString()
          })
          .eq('execution_id', executionId)
          .eq('batch_index', batchIndex);

        return { success: false, processingTime, error: result.error };
      }

    } catch (error) {
      const err = error as Error;
      logger.debug(`❌ Exception during prompt ${promptIndex + 1} processing`);

      logError('PROMPT_PROCESSING', err, {
        executionId,
        promptIndex: promptIndex + 1,
        totalPrompts,
        batchIndex,
        prompt,
        apiKey: config.api_key_encrypted ? '***encrypted***' : 'missing'
      });

      logger.error('Batch result processing failed', { batchIndex, error: err.message });

      try {
        await supabaseAdmin
          .from('workflow_batch_results')
          .update({
            status: 'failed',
            error_message: err.message,
            completed_at: new Date().toISOString()
          })
          .eq('execution_id', executionId)
          .eq('batch_index', batchIndex);
      } catch (dbError) {
        logError('DATABASE_UPDATE_FAILED', dbError as Error, {
          executionId,
          batchIndex,
          originalError: err.message
        });
      }

      return { success: false, processingTime: 0, error };
    }
  };

  // Process all prompts in parallel with concurrency control
  logger.debug(`\n🚀 Starting parallel processing of ${totalPrompts} prompts with concurrency ${PROMPT_CONCURRENCY}`);

  const promptPromises = prompts.map((prompt, index) =>
    limit(() => processSinglePrompt(prompt, index, index))
  );

  const results = await Promise.allSettled(promptPromises);

  // Aggregate results
  let successCount = 0;
  let failCount = 0;
  let totalProcessingTime = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const value = result.value;
      if (value.success) {
        successCount++;
        totalProcessingTime += value.processingTime;
      } else {
        failCount++;
        totalProcessingTime += value.processingTime;
      }
    } else {
      // Promise was rejected (shouldn't happen as we catch errors in processSinglePrompt)
      logger.error(`Prompt ${index + 1} promise rejected unexpectedly:`, result.reason);
      failCount++;
    }
  });

  job.progress(100);

  // Calculate final statistics
  const totalTime = Date.now() - workflowStartTime;
  const avgTimePerPrompt = totalPrompts > 0 ? totalProcessingTime / totalPrompts : 0;

  const completedAt = new Date().toISOString();
  const { data: execution } = await supabaseAdmin
    .from('workflow_executions')
    .select('started_at')
    .eq('id', executionId)
    .single();

  const durationSeconds = execution?.started_at
    ? Math.floor((new Date(completedAt).getTime() - new Date(execution.started_at).getTime()) / 1000)
    : null;

  // Update execution status
  logDatabaseOperation('UPDATE', 'workflow_executions', {
    status: 'completed',
    successful: successCount,
    failed: failCount
  });

  await supabaseAdmin
    .from('workflow_executions')
    .update({
      status: 'completed',
      output_data: { successful: successCount, failed: failCount, total: totalPrompts },
      completed_at: completedAt,
      duration_seconds: durationSeconds
    })
    .eq('id', executionId);

  // Log workflow completion
  logWorkflowComplete(executionId, {
    totalPrompts,
    successful: successCount,
    failed: failCount,
    totalTime,
    avgTimePerPrompt
  });

  logger.info('Workflow execution completed', {
    executionId,
    successCount,
    failCount,
    totalPrompts
  });

  return { success: true, successCount, failCount, totalPrompts };
}

/**
 * Process Smart Resizer workflow (multi-format image generation)
 */
async function processSmartResizerWorkflow(
  job: Job<WorkflowJobData>,
  executionId: string,
  inputData: SmartResizerInputData,
  config: WorkflowConfig
): Promise<WorkflowResult> {
  const workflowStartTime = Date.now();
  const {
    batch,
    ai_regeneration
  } = inputData;

  // Calculate total formats across all images
  const totalFormats = batch.reduce((sum: number, item: any) => sum + item.formats.length, 0);

  logger.debug(`\n🎨 Processing Smart Resizer workflow - Execution ID: ${executionId}`);
  logger.debug(`   Images: ${batch.length}, Total formats: ${totalFormats}, AI Regen: ${ai_regeneration}`);

  logWorkflowStart(executionId, 'smart_resizer', {
    workflowId: job.data.workflowId,
    clientId: job.data.clientId,
    numberOfPrompts: totalFormats,
    hasApiKey: false
  });

  try {
    let successCount = 0;
    let failCount = 0;
    let batchResultIndex = 0;

    // Process each image in the batch
    for (let imageIndex = 0; imageIndex < batch.length; imageIndex++) {
      const imageItem = batch[imageIndex];

      logger.debug(`🖼️ Processing image ${imageIndex + 1}/${batch.length}: ${imageItem.image_name}`);

      // Convert base64 to Buffer
      const masterImageBuffer = Buffer.from(imageItem.image_base64, 'base64');

      try {
        // Process using workflow-specific method (no smart_resizer_jobs interaction)
        const result = await smartResizerService.processImageFormats({
          clientId: job.data.clientId,
          userId: job.data.userId,
          executionId,
          imageIndex,
          imageName: imageItem.image_name,
          masterImageBuffer,
          masterImageBase64: imageItem.image_base64,
          formatsRequested: imageItem.formats
        });

        logger.debug(`✅ Image ${imageIndex + 1} processed: ${result.formatResults.length} formats`);

        // Store each format result in workflow_batch_results
        for (const formatResult of result.formatResults) {
          if (formatResult.status === 'completed') {
            successCount++;
          } else {
            failCount++;
          }

          try {
            await supabaseAdmin
              .from('workflow_batch_results')
              .insert({
                execution_id: executionId,
                batch_index: batchResultIndex++,
                prompt_text: `${imageItem.image_name} → ${formatResult.formatName}`,
                status: formatResult.status === 'completed' ? 'completed' : 'failed',
                result_url: formatResult.resultUrl,
                processing_time_ms: formatResult.processingTimeMs,
                error_message: formatResult.errorMessage,
                completed_at: new Date().toISOString(),
                width: formatResult.width,
                height: formatResult.height,
                format_name: formatResult.formatName
              });

            logger.debug(`✓ Stored result for ${imageItem.image_name} → ${formatResult.formatName}`);
          } catch (dbError) {
            logger.error(`Failed to store result for ${formatResult.formatName}`, {
              error: (dbError as Error).message
            });
          }
        }
      } catch (imageError) {
        logger.error(`Failed to process image ${imageItem.image_name}`, {
          error: (imageError as Error).message
        });

        // Mark all formats for this image as failed
        for (const formatKey of imageItem.formats) {
          failCount++;
          try {
            await supabaseAdmin
              .from('workflow_batch_results')
              .insert({
                execution_id: executionId,
                batch_index: batchResultIndex++,
                prompt_text: `${imageItem.image_name} → ${formatKey}`,
                status: 'failed',
                result_url: null,
                processing_time_ms: 0,
                error_message: (imageError as Error).message,
                completed_at: new Date().toISOString()
              });
          } catch (dbError) {
            logger.error(`Failed to store error result for ${formatKey}`, {
              error: (dbError as Error).message
            });
          }
        }
      }

      // Update job progress
      const progress = Math.floor(((imageIndex + 1) / batch.length) * 100);
      job.progress(progress);
    }

    // Update execution status with final results
    const durationSeconds = Math.floor((Date.now() - workflowStartTime) / 1000);

    await supabaseAdmin
      .from('workflow_executions')
      .update({
        status: 'completed',
        output_data: {
          successful: successCount,
          failed: failCount,
          total: totalFormats,
          images_processed: batch.length
        },
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds
      })
      .eq('id', executionId);

    // Final progress update
    job.progress(100);

    logWorkflowComplete(executionId, {
      totalPrompts: totalFormats, // Using totalPrompts for consistency
      successful: successCount,
      failed: failCount,
      totalTime: Date.now() - workflowStartTime
    });

    logger.info('Smart Resizer workflow execution completed', {
      executionId,
      successCount,
      failCount,
      totalFormats
    });

    return { success: true, successCount, failCount, totalPrompts: totalFormats };

  } catch (error) {
    const err = error as Error;
    logger.debug(`\n❌ SMART RESIZER WORKFLOW FAILED`);
    logger.debug(`   Execution ID: ${executionId}`);
    logger.debug(`   Error: ${err.message}`);
    logger.debug(`   Stack: ${err.stack}`);

    logWorkflowFailed(executionId, err, {
      totalPrompts: totalFormats
    });

    logger.error('Smart Resizer workflow execution failed', {
      executionId,
      error: err.message
    });

    throw error;
  }
}

/**
 * Process standard workflow (placeholder for future workflows)
 */
async function processStandardWorkflow(
  job: Job<WorkflowJobData>,
  executionId: string,
  inputData: InputData,
  config: WorkflowConfig
): Promise<WorkflowResult> {
  // Placeholder for other workflow types
  throw new Error('Standard workflow processing not implemented yet');
}

/**
 * Main workflow processor - dispatches to specific handlers based on type
 *
 * Concurrency: Process multiple workflow executions in parallel
 * Configured via WORKER_CONCURRENCY env var (default: 3)
 */
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '3', 10);
logger.info(`🔧 Worker concurrency set to: ${WORKER_CONCURRENCY} parallel executions`);

workflowQueue.process(WORKER_CONCURRENCY, async (job: Job<WorkflowJobData>) => {
  const { executionId, workflowId, clientId, inputData, config } = job.data;

  logger.info('Processing workflow execution', {
    executionId,
    workflowId,
    workflowType: config.workflow_type || 'standard'
  });

  try {
    logger.debug(`\n🎯 Main workflow processor started for execution: ${executionId}`);
    logger.debug(`   Workflow type: ${config.workflow_type || 'standard'}`);
    logger.debug(`   Workflow ID: ${workflowId}`);
    logger.debug(`   Client ID: ${clientId}`);

    await supabaseAdmin
      .from('workflow_executions')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', executionId);

    let result: WorkflowResult;

    // Dispatch to appropriate workflow handler based on type
    if (config.workflow_type === 'nano_banana') {
      result = await processNanoBananaWorkflow(job, executionId, inputData, config);
    } else if (config.workflow_type === 'smart_resizer') {
      result = await processSmartResizerWorkflow(job, executionId, inputData as unknown as SmartResizerInputData, config);
    } else {
      result = await processStandardWorkflow(job, executionId, inputData, config);
    }

    logger.info('Workflow execution completed', { executionId, result });
    return result;

  } catch (error) {
    const err = error as Error;
    logger.debug(`\n❌ WORKFLOW EXECUTION FATAL ERROR`);
    logger.debug(`   Execution ID: ${executionId}`);
    logger.debug(`   Error: ${err.message}`);
    logger.debug(`   Stack: ${err.stack}`);

    logWorkflowFailed(executionId, err, {
      totalPrompts: inputData?.prompts?.length || 0
    });

    logger.error('Workflow execution failed', { executionId, error: err.message });

    try {
      await supabaseAdmin
        .from('workflow_executions')
        .update({
          status: 'failed',
          error_message: err.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);
    } catch (dbError) {
      logger.error(`❌ Failed to update execution status in database:`, dbError);
    }

    throw error;
  }
});

workflowQueue.on('completed', (job: Job, result: WorkflowResult) => {
  logger.debug(`✅ Job ${job.id} completed:`, result);
});

workflowQueue.on('failed', (job: Job, err: Error) => {
  logger.error(`❌ Job ${job.id} failed:`, err.message);
});

/**
 * Smart Resizer Queue Processor
 * Handles standalone Smart Resizer jobs (direct API calls to /smart-resizer/jobs)
 *
 * Concurrency: 2 (process 2 master images simultaneously)
 */
const SMART_RESIZER_CONCURRENCY = parseInt(process.env.SMART_RESIZER_CONCURRENCY || '2', 10);
logger.info(`🔧 Smart Resizer concurrency set to: ${SMART_RESIZER_CONCURRENCY} parallel jobs`);

smartResizerQueue.process(SMART_RESIZER_CONCURRENCY, async (job: Job<SmartResizerJobData>): Promise<SmartResizerResult> => {
  const { jobId, clientId, formatsRequested } = job.data;

  if (process.env.NODE_ENV === 'development') {
    logger.debug('🚀 General Worker - SmartResizer Job started', {
      jobId,
      clientId,
      formatCount: formatsRequested.length,
    });
  }

  logger.info('Smart Resizer job started', {
    jobId,
    clientId,
    formatCount: formatsRequested.length,
  });

  try {
    // Process the job using smartResizerService
    const result = await smartResizerService.processJob(job.data);

    // Update job progress to 100%
    await job.progress(100);

    logger.info('Smart Resizer job completed', {
      jobId,
      status: result.status,
      successCount: result.results.filter(r => r.status === 'completed').length,
      failedCount: result.results.filter(r => r.status === 'failed').length,
      processingTimeMs: result.totalProcessingTimeMs,
    });

    if (process.env.NODE_ENV === 'development') {
      logger.debug('✅ General Worker - SmartResizer Job completed', {
        jobId,
        status: result.status,
        successCount: result.results.filter(r => r.status === 'completed').length,
        failedCount: result.results.filter(r => r.status === 'failed').length,
        totalTime: `${result.totalProcessingTimeMs}ms`,
      });
    }

    return result;
  } catch (error: any) {
    logger.error('Smart Resizer job failed', {
      jobId,
      error: error.message,
      stack: error.stack,
    });

    if (process.env.NODE_ENV === 'development') {
      logger.error('❌ General Worker - SmartResizer Job failed', {
        jobId,
        error: error.message,
      });
    }

    throw error;
  }
});

/**
 * Smart Resizer Queue Event Listeners
 */
smartResizerQueue.on('completed', (job: Job, result: SmartResizerResult) => {
  logger.info('Smart Resizer queue job completed', {
    jobId: job.id,
    dataJobId: result.jobId,
    status: result.status,
  });

  if (process.env.NODE_ENV === 'development') {
    logger.debug('🎉 General Worker - SmartResizer queue job completed', {
      queueJobId: job.id,
      jobId: result.jobId,
    });
  }
});

smartResizerQueue.on('failed', (job: Job, err: Error) => {
  logger.error('Smart Resizer queue job failed', {
    jobId: job.id,
    error: err.message,
    attemptsMade: job.attemptsMade,
    attemptsTotal: job.opts.attempts,
  });

  if (process.env.NODE_ENV === 'development') {
    logger.error('❌ General Worker - SmartResizer queue job failed', {
      queueJobId: job.id,
      error: err.message,
      attempts: `${job.attemptsMade}/${job.opts.attempts}`,
    });
  }
});

smartResizerQueue.on('stalled', (job: Job) => {
  logger.warn('Smart Resizer queue job stalled', {
    jobId: job.id,
  });

  if (process.env.NODE_ENV === 'development') {
    logger.warn('⚠️  General Worker - SmartResizer queue job stalled', {
      queueJobId: job.id,
    });
  }
});

smartResizerQueue.on('progress', (job: Job, progress: number) => {
  logger.debug('Smart Resizer queue job progress', {
    jobId: job.id,
    progress: `${progress}%`,
  });

  if (process.env.NODE_ENV === 'development') {
    logger.debug('📊 General Worker - SmartResizer progress update', {
      queueJobId: job.id,
      progress: `${progress}%`,
    });
  }
});

process.on('SIGTERM', async () => {
  logger.debug('SIGTERM received, closing workers...');
  await workflowQueue.close();
  await smartResizerQueue.close();
  process.exit(0);
});

logger.info('✅ General workflow worker ready (workflowQueue + smartResizerQueue)');
