/**
 * Smart Resizer Service - Core Orchestration
 *
 * Coordinates the entire workflow:
 * 1. Format-by-format generation (AI adapts image to new aspect ratio)
 * 2. Storage management
 * 3. Database updates
 *
 * Nano Banana Pro handles text/visual preservation natively - no OCR needed.
 */

import { supabaseAdmin } from '../config/database';
import * as imageProcessing from './imageProcessingService';
import vertexAIService from './vertexAIImageService';
import {
  FormatPresetKey,
  getFormatPreset,
} from '../utils/formatPresets';
import pLimit from 'p-limit';
import { logger } from '../config/logger';

export interface SmartResizerJobData {
  jobId: string;
  clientId: string;
  userId: string;
  masterImageBuffer: string; // Base64 encoded string (for Redis/Bull serialization)
  formatsRequested: FormatPresetKey[];
}

export interface FormatResult {
  formatName: string;
  platform: string;
  width: number;
  height: number;
  resultUrl: string | null;
  storagePath: string | null;
  processingMethod: 'crop' | 'padding' | 'ai_regenerate';
  status: 'completed' | 'failed';
  errorMessage?: string;
  processingTimeMs: number;
}

export interface SmartResizerResult {
  jobId: string;
  status: 'completed' | 'failed';
  results: FormatResult[];
  totalProcessingTimeMs: number;
}

export interface ProcessImageFormatsParams {
  clientId: string;
  userId: string;
  executionId: string;
  imageIndex: number;
  imageName: string;
  masterImageBuffer: Buffer;
  masterImageBase64: string;
  formatsRequested: FormatPresetKey[];
}

export interface ProcessImageFormatsResult {
  imageName: string;
  formatResults: FormatResult[];
  totalProcessingTimeMs: number;
}

class SmartResizerService {
  /**
   * Main orchestration method
   * Processes a single master image into multiple formats
   */
  async processJob(jobData: SmartResizerJobData): Promise<SmartResizerResult> {
    const { jobId, clientId, userId, masterImageBuffer: masterImageBase64, formatsRequested } = jobData;
    const startTime = Date.now();

    // Convert base64 string to Buffer
    const masterImageBuffer = Buffer.from(masterImageBase64, 'base64');

    // Validate buffer
    if (!masterImageBuffer || masterImageBuffer.length === 0) {
      throw new Error('Master image buffer is empty or invalid');
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('🚀 SmartResizer: Starting job', {
        jobId,
        formatCount: formatsRequested.length,
        imageSize: `${(masterImageBuffer.length / 1024).toFixed(2)}KB`,
        bufferLength: masterImageBuffer.length,
        base64Length: masterImageBase64.length,
      });
    }

    try {
      // ===============================================
      // PHASE 1: Get Master Image Metadata
      // ===============================================
      await this.updateJobStatus(jobId, 'processing');

      // Get master image metadata
      const masterMetadata = await imageProcessing.getImageMetadata(masterImageBuffer);

      if (process.env.NODE_ENV === 'development') {
        logger.debug('✅ SmartResizer: Image analyzed', {
          dimensions: `${masterMetadata.width}x${masterMetadata.height}`,
          format: masterMetadata.format,
        });
      }

      // ===============================================
      // PHASE 2: Generate Each Format
      // ===============================================
      const results: FormatResult[] = [];

      for (const formatKey of formatsRequested) {
        const formatResult = await this.processFormat({
          jobId,
          clientId,
          formatKey,
          masterImageBuffer,
          masterImageBase64,
          masterMetadata,
        });

        results.push(formatResult);

        if (process.env.NODE_ENV === 'development') {
          const emoji = formatResult.status === 'completed' ? '✅' : '❌';
          logger.debug(`${emoji} SmartResizer: Format ${formatKey}`, {
            status: formatResult.status,
            method: formatResult.processingMethod,
            time: `${formatResult.processingTimeMs}ms`,
          });
        }
      }

      // ===============================================
      // PHASE 3: Finalize Job
      // ===============================================
      const totalProcessingTimeMs = Date.now() - startTime;
      const allCompleted = results.every(r => r.status === 'completed');

      await this.updateJobStatus(jobId, allCompleted ? 'completed' : 'failed');

      if (process.env.NODE_ENV === 'development') {
        logger.debug('🎉 SmartResizer: Job complete', {
          jobId,
          totalFormats: results.length,
          successful: results.filter(r => r.status === 'completed').length,
          failed: results.filter(r => r.status === 'failed').length,
          totalTime: `${totalProcessingTimeMs}ms`,
        });
      }

      return {
        jobId,
        status: allCompleted ? 'completed' : 'failed',
        results,
        totalProcessingTimeMs,
      };
    } catch (error: any) {
      logger.error('❌ SmartResizer.processJob: Failed', {
        jobId,
        error: error.message,
        stack: error.stack,
      });

      await this.updateJobStatus(jobId, 'failed');

      throw error;
    }
  }

  /**
   * Process image formats for workflow execution
   * This method does NOT create smart_resizer_jobs or smart_resizer_results entries
   * It returns results directly for the workflow to store in workflow_batch_results
   */
  async processImageFormats(params: ProcessImageFormatsParams): Promise<ProcessImageFormatsResult> {
    const {
      clientId,
      executionId,
      imageIndex,
      imageName,
      masterImageBuffer,
      masterImageBase64,
      formatsRequested
    } = params;

    const startTime = Date.now();

    if (process.env.NODE_ENV === 'development') {
      logger.debug('🚀 SmartResizer.processImageFormats: Starting', {
        executionId,
        imageIndex,
        imageName,
        formatCount: formatsRequested.length,
        imageSize: `${(masterImageBuffer.length / 1024).toFixed(2)}KB`
      });
    }

    try {
      // ===============================================
      // PHASE 1: Get Master Image Metadata
      // ===============================================
      const masterMetadata = await imageProcessing.getImageMetadata(masterImageBuffer);

      if (process.env.NODE_ENV === 'development') {
        logger.debug('✅ SmartResizer.processImageFormats: Image analyzed', {
          dimensions: `${masterMetadata.width}x${masterMetadata.height}`,
          format: masterMetadata.format
        });
      }

      // ===============================================
      // PHASE 2: Generate Each Format (Parallel Processing)
      // ===============================================
      // Process formats in parallel with concurrency limit of 3
      // This reduces total processing time by ~3x while avoiding API rate limits
      const limit = pLimit(3);

      const formatPromises = formatsRequested.map(formatKey =>
        limit(() => this.processFormatForWorkflow({
          clientId,
          executionId,
          imageIndex,
          formatKey,
          masterImageBuffer,
          masterImageBase64,
          masterMetadata
        }))
      );

      const formatResults = await Promise.all(formatPromises);

      // Log results
      if (process.env.NODE_ENV === 'development') {
        formatResults.forEach(formatResult => {
          const emoji = formatResult.status === 'completed' ? '✅' : '❌';
          logger.debug(`${emoji} SmartResizer.processImageFormats: Format ${formatResult.formatName}`, {
            status: formatResult.status,
            method: formatResult.processingMethod,
            time: `${formatResult.processingTimeMs}ms`
          });
        });
      }

      const totalProcessingTimeMs = Date.now() - startTime;

      if (process.env.NODE_ENV === 'development') {
        logger.debug('🎉 SmartResizer.processImageFormats: Complete', {
          imageName,
          totalFormats: formatResults.length,
          successful: formatResults.filter(r => r.status === 'completed').length,
          failed: formatResults.filter(r => r.status === 'failed').length,
          totalTime: `${totalProcessingTimeMs}ms`
        });
      }

      return {
        imageName,
        formatResults,
        totalProcessingTimeMs
      };
    } catch (error: any) {
      logger.error('❌ SmartResizer.processImageFormats: Failed', {
        imageName,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Process a single format for workflow execution
   * Does NOT create database records - returns results for caller to store
   */
  private async processFormatForWorkflow(params: {
    clientId: string;
    executionId: string;
    imageIndex: number;
    formatKey: FormatPresetKey;
    masterImageBuffer: Buffer;
    masterImageBase64: string;
    masterMetadata: any;
  }): Promise<FormatResult> {
    const { clientId, executionId, imageIndex, formatKey, masterImageBuffer, masterImageBase64, masterMetadata } = params;
    const startTime = Date.now();

    const formatPreset = getFormatPreset(formatKey);
    const { width, height, platform } = formatPreset;

    try {
      // Determine best processing method
      const method = imageProcessing.determineBestMethod(
        masterMetadata.width,
        masterMetadata.height,
        formatPreset
      );

      if (process.env.NODE_ENV === 'development') {
        logger.debug('🔍 SmartResizer.processFormatForWorkflow: Processing', {
          formatKey,
          method,
          dimensions: `${width}x${height}`
        });
      }

      let processedBuffer: Buffer;

      // =============================================
      // Apply processing method
      // =============================================
      if (method === 'crop') {
        const result = await imageProcessing.smartCrop(
          masterImageBuffer,
          width,
          height,
          { strategy: 'attention' }
        );
        processedBuffer = result.buffer;
      } else if (method === 'padding') {
        const result = await imageProcessing.resizeWithPadding(
          masterImageBuffer,
          width,
          height,
          '#FFFFFF'
        );
        processedBuffer = result.buffer;
      } else {
        // AI regeneration with Gemini (Nano Banana Pro)
        processedBuffer = await this.generateWithAI(
          masterImageBase64,
          formatKey
        );
      }

      // =============================================
      // Upload to Supabase Storage
      // =============================================
      const storagePath = `smart-resizer/${executionId}/${imageIndex}_${formatKey}.png`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('workflow-results')
        .upload(storagePath, processedBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('workflow-results')
        .getPublicUrl(storagePath);

      const resultUrl = urlData.publicUrl;
      const processingTimeMs = Date.now() - startTime;

      return {
        formatName: formatKey,
        platform,
        width,
        height,
        resultUrl,
        storagePath,
        processingMethod: method,
        status: 'completed',
        processingTimeMs
      };
    } catch (error: any) {
      logger.error('❌ SmartResizer.processFormatForWorkflow: Failed', {
        formatKey,
        error: error.message
      });

      return {
        formatName: formatKey,
        platform,
        width,
        height,
        resultUrl: null,
        storagePath: null,
        processingMethod: 'ai_regenerate',
        status: 'failed',
        errorMessage: error.message,
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Process a single format
   */
  private async processFormat(params: {
    jobId: string;
    clientId: string;
    formatKey: FormatPresetKey;
    masterImageBuffer: Buffer;
    masterImageBase64: string;
    masterMetadata: any;
  }): Promise<FormatResult> {
    const { jobId, clientId, formatKey, masterImageBuffer, masterImageBase64, masterMetadata } = params;
    const startTime = Date.now();

    const formatPreset = getFormatPreset(formatKey);
    const { width, height, platform, safeZone } = formatPreset;

    // Create result record in DB
    const { data: resultRecord, error: createError } = await supabaseAdmin
      .from('smart_resizer_results')
      .insert({
        job_id: jobId,
        format_name: formatKey,
        platform,
        width,
        height,
        status: 'processing',
      })
      .select()
      .single();

    if (createError || !resultRecord) {
      logger.error('❌ SmartResizer: Failed to create result record', {
        formatKey,
        error: createError?.message,
      });

      return {
        formatName: formatKey,
        platform,
        width,
        height,
        resultUrl: null,
        storagePath: null,
        processingMethod: 'ai_regenerate',
        status: 'failed',
        errorMessage: 'Failed to create result record',
        processingTimeMs: Date.now() - startTime,
      };
    }

    try {
      // Determine best processing method
      const method = imageProcessing.determineBestMethod(
        masterMetadata.width,
        masterMetadata.height,
        formatPreset
      );

      if (process.env.NODE_ENV === 'development') {
        logger.debug('🔍 SmartResizer: Processing format', {
          formatKey,
          method,
          dimensions: `${width}x${height}`,
        });
      }

      let processedBuffer: Buffer;

      // =============================================
      // Apply processing method
      // =============================================
      if (method === 'crop') {
        // Smart crop with Sharp
        const result = await imageProcessing.smartCrop(
          masterImageBuffer,
          width,
          height,
          { strategy: 'attention' }
        );
        processedBuffer = result.buffer;
      } else if (method === 'padding') {
        // Resize with padding
        const result = await imageProcessing.resizeWithPadding(
          masterImageBuffer,
          width,
          height,
          '#FFFFFF'
        );
        processedBuffer = result.buffer;
      } else {
        // AI regeneration with Gemini (Nano Banana Pro)
        processedBuffer = await this.generateWithAI(
          masterImageBase64,
          formatKey
        );
      }

      // =============================================
      // Upload to Supabase Storage
      // =============================================
      const storagePath = `smart-resizer/${jobId}/${formatKey}.png`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('workflow-results')
        .upload(storagePath, processedBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('workflow-results')
        .getPublicUrl(storagePath);

      const resultUrl = urlData.publicUrl;

      // Update result record
      const processingTimeMs = Date.now() - startTime;

      await supabaseAdmin
        .from('smart_resizer_results')
        .update({
          result_url: resultUrl,
          storage_path: storagePath,
          processing_method: method,
          status: 'completed',
          processing_time_ms: processingTimeMs,
        })
        .eq('id', resultRecord.id);

      return {
        formatName: formatKey,
        platform,
        width,
        height,
        resultUrl,
        storagePath,
        processingMethod: method,
        status: 'completed',
        processingTimeMs,
      };
    } catch (error: any) {
      logger.error('❌ SmartResizer.processFormat: Failed', {
        formatKey,
        error: error.message,
      });

      // Update result record with error
      await supabaseAdmin
        .from('smart_resizer_results')
        .update({
          status: 'failed',
          error_message: error.message,
          processing_time_ms: Date.now() - startTime,
        })
        .eq('id', resultRecord.id);

      return {
        formatName: formatKey,
        platform,
        width,
        height,
        resultUrl: null,
        storagePath: null,
        processingMethod: 'ai_regenerate',
        status: 'failed',
        errorMessage: error.message,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate format using Gemini AI (Nano Banana Pro)
   * Simple approach: Send image + aspect ratio, let AI handle the rest
   */
  private async generateWithAI(
    masterImageBase64: string,
    formatKey: FormatPresetKey
  ): Promise<Buffer> {
    const formatPreset = getFormatPreset(formatKey);
    const { ratio, width, height } = formatPreset;

    if (process.env.NODE_ENV === 'development') {
      logger.debug('🎨 SmartResizer: Generating with AI', {
        formatKey,
        ratio,
        dimensions: `${width}x${height}`
      });
    }

    const startTime = Date.now();

    try {
      // Detailed prompt to ensure intelligent recomposition without black borders
      const prompt = `Transform this image to a ${ratio} aspect ratio by intelligently reorganizing and expanding the composition.

CRITICAL REQUIREMENTS:
1. DO NOT add black borders or letterboxing
2. DO NOT simply crop or stretch the image
3. PRESERVE all text content exactly as written (same fonts, colors, sizes)
4. PRESERVE all logos and brand elements exactly
5. EXPAND the background/scene naturally to fill the new dimensions
6. RECOMPOSE the layout to fit ${ratio} while maintaining visual balance
7. The final image must be a complete, full-bleed ${ratio} composition

Think of this as creating a new ${ratio} version of the same creative, not just resizing it.`;

      // Configure model: Use Pro model for creative recomposition
      vertexAIService.setModel('gemini-3-pro-image-preview');

      // Call Vertex AI Image Service (Nano Banana Pro)
      const result = await vertexAIService.generateImageWithReference({
        prompt,
        referenceImage: masterImageBase64,
        aspectRatio: ratio,
      });

      const processingTime = Date.now() - startTime;

      if (process.env.NODE_ENV === 'development') {
        logger.debug('✅ SmartResizer: AI generation complete', {
          formatKey,
          ratio,
          processingTime: `${processingTime}ms`,
        });
      }

      return result;
    } catch (error: any) {
      logger.error('❌ SmartResizer.generateWithAI: Failed', {
        formatKey,
        ratio,
        error: error.message,
        stack: error.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });
      throw error;
    }
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(
    jobId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<void> {
    const updateData: any = { status };

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    await supabaseAdmin
      .from('smart_resizer_jobs')
      .update(updateData)
      .eq('id', jobId);
  }
}

export default new SmartResizerService();
