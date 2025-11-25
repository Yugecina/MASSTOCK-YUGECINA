const pLimit = require('p-limit');
const { workflowQueue } = require('../queues/workflowQueue');
const { supabaseAdmin } = require('../config/database');
const { createGeminiImageService } = require('../services/geminiImageService');
const { decryptApiKey } = require('../utils/encryption');
const { logger } = require('../config/logger');
const apiRateLimiter = require('../utils/apiRateLimiter');
const {
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
} = require('../utils/workflowLogger');

logger.debug('🚀 Workflow worker starting...');

/**
 * Process Nano Banana workflow (batch image generation)
 */
async function processNanoBananaWorkflow(job, executionId, inputData, config) {
  const workflowStartTime = Date.now();
  const { prompts, reference_images } = inputData;
  const totalPrompts = prompts.length;
  const referenceImagesBase64 = reference_images || [];

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
  let aspectRatio;
  let resolution;

  // Validate and decrypt API key
  try {
    if (!config.api_key_encrypted) {
      throw new Error('Missing API key in workflow config. Please provide api_key when executing the workflow.');
    }

    logger.debug('Processing Nano Banana workflow', {
      executionId,
      hasEncryptedKey: !!config.api_key_encrypted,
      encryptedKeyLength: config.api_key_encrypted?.length,
      configKeys: Object.keys(config)
    });

    const decryptedApiKey = decryptApiKey(config.api_key_encrypted);

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
    logDecryption(false, { error: error.message });
    logError('API_KEY_DECRYPTION', error, {
      executionId,
      hasEncryptedKey: !!config.api_key_encrypted,
      encryptedKeyLength: config.api_key_encrypted?.length
    });
    throw error;
  }

  // Configure concurrency for prompt processing
  const PROMPT_CONCURRENCY = parseInt(process.env.PROMPT_CONCURRENCY || '5', 10);
  const limit = pLimit(PROMPT_CONCURRENCY);

  logger.debug(`🔧 Prompt concurrency set to: ${PROMPT_CONCURRENCY} parallel prompts`);
  logger.debug(`📊 Rate limiter stats: ${JSON.stringify(apiRateLimiter.getStats())}`);

  /**
   * Process a single prompt with Gemini API
   * Includes rate limiting, error handling, and database updates
   */
  const processSinglePrompt = async (prompt, batchIndex, promptIndex) => {
    const promptStartTime = Date.now();

    logger.debug(`\n🔄 Processing prompt ${promptIndex + 1}/${totalPrompts}: "${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}"`);

    // Update job progress (approximate based on started prompts)
    const progress = Math.floor(((promptIndex + 1) / totalPrompts) * 90);
    job.progress(progress);

    // Log prompt processing start
    logPromptProcessing(promptIndex + 1, totalPrompts, prompt, { batchIndex });

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

      // Acquire rate limiter slot before calling API
      logger.debug(`🚦 Acquiring rate limiter slot... (Queue: ${apiRateLimiter.getStats().queuedRequests})`);
      await apiRateLimiter.acquire();
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
      logger.debug(`📊 Rate limiter stats: ${JSON.stringify(apiRateLimiter.getStats())}`);

      if (result.success) {
        logger.debug(`✅ Image generated successfully`);

        // Upload to storage
        const imageBuffer = Buffer.from(result.imageData, 'base64');
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

        logError('IMAGE_GENERATION', result.error, {
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
            error_message: result.error.message,
            processing_time_ms: processingTime,
            completed_at: new Date().toISOString()
          })
          .eq('execution_id', executionId)
          .eq('batch_index', batchIndex);

        return { success: false, processingTime, error: result.error };
      }

    } catch (error) {
      logger.debug(`❌ Exception during prompt ${promptIndex + 1} processing`);

      logError('PROMPT_PROCESSING', error, {
        executionId,
        promptIndex: promptIndex + 1,
        totalPrompts,
        batchIndex,
        prompt,
        apiKey: config.api_key_encrypted ? '***encrypted***' : 'missing'
      });

      logger.error('Batch result processing failed', { batchIndex, error: error.message });

      try {
        await supabaseAdmin
          .from('workflow_batch_results')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('execution_id', executionId)
          .eq('batch_index', batchIndex);
      } catch (dbError) {
        logError('DATABASE_UPDATE_FAILED', dbError, {
          executionId,
          batchIndex,
          originalError: error.message
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
    ? Math.floor((new Date(completedAt) - new Date(execution.started_at)) / 1000)
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
async function processStandardWorkflow(job, executionId, inputData, config) {
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

workflowQueue.process(WORKER_CONCURRENCY, async (job) => {
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

    let result;

    // Dispatch to appropriate workflow handler based on type
    if (config.workflow_type === 'nano_banana') {
      result = await processNanoBananaWorkflow(job, executionId, inputData, config);
    } else {
      result = await processStandardWorkflow(job, executionId, inputData, config);
    }

    logger.info('Workflow execution completed', { executionId, result });
    return result;

  } catch (error) {
    logger.debug(`\n❌ WORKFLOW EXECUTION FATAL ERROR`);
    logger.debug(`   Execution ID: ${executionId}`);
    logger.debug(`   Error: ${error.message}`);
    logger.debug(`   Stack: ${error.stack}`);

    logWorkflowFailed(executionId, error, {
      totalPrompts: inputData?.prompts?.length || 0
    });

    logger.error('Workflow execution failed', { executionId, error: error.message });

    try {
      await supabaseAdmin
        .from('workflow_executions')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);
    } catch (dbError) {
      logger.error(`❌ Failed to update execution status in database:`, dbError);
    }

    throw error;
  }
});

workflowQueue.on('completed', (job, result) => {
  logger.debug(`✅ Job ${job.id} completed:`, result);
});

workflowQueue.on('failed', (job, err) => {
  logger.error(`❌ Job ${job.id} failed:`, err.message);
});

process.on('SIGTERM', async () => {
  logger.debug('SIGTERM received, closing worker...');
  await workflowQueue.close();
  process.exit(0);
});

logger.debug('✅ Workflow worker ready');
