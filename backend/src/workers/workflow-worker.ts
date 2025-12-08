import pLimit from 'p-limit';
import { Job } from 'bull';
import { workflowQueue, WorkflowJobData } from '../queues/workflowQueue';
import { supabaseAdmin } from '../config/database';
import { createGeminiImageService, ReferenceImage } from '../services/geminiImageService';
import { decryptApiKey, EncryptedData } from '../utils/encryption';
import { logger } from '../config/logger';
import apiRateLimiter from '../utils/apiRateLimiter';
import { RateLimiterStats } from '../utils/apiRateLimiter';
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

logger.debug('🚀 Workflow worker starting...');

interface InputData {
  prompts: string[];
  reference_images?: ReferenceImage[];
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

process.on('SIGTERM', async () => {
  logger.debug('SIGTERM received, closing worker...');
  await workflowQueue.close();
  process.exit(0);
});

logger.debug('✅ Workflow worker ready');
