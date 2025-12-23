/**
 * Smart Resizer Service - Core Orchestration
 *
 * Coordinates the entire workflow:
 * 1. Master image analysis (OCR)
 * 2. Format-by-format generation
 * 3. Storage management
 * 4. Database updates
 */

import { supabaseAdmin } from '../config/database';
import ocrService, { DetectedContent } from './ocrService';
import * as imageProcessing from './imageProcessingService';
import geminiService from './geminiImageService';
import {
  FormatPresetKey,
  getFormatPreset,
  calculateSafeZonePixels,
} from '../utils/formatPresets';

export interface SmartResizerJobData {
  jobId: string;
  clientId: string;
  userId: string;
  masterImageBuffer: Buffer;
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
  detectedContent: DetectedContent;
  results: FormatResult[];
  totalProcessingTimeMs: number;
}

class SmartResizerService {
  /**
   * Main orchestration method
   * Processes a single master image into multiple formats
   */
  async processJob(jobData: SmartResizerJobData): Promise<SmartResizerResult> {
    const { jobId, clientId, userId, masterImageBuffer, formatsRequested } = jobData;
    const startTime = Date.now();

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 SmartResizer: Starting job', {
        jobId,
        formatCount: formatsRequested.length,
        imageSize: `${(masterImageBuffer.length / 1024).toFixed(2)}KB`,
      });
    }

    try {
      // ===============================================
      // PHASE 1: Analyze Master Image with OCR
      // ===============================================
      await this.updateJobStatus(jobId, 'processing');

      const masterImageBase64 = imageProcessing.bufferToBase64(masterImageBuffer);
      const detectedContent = await ocrService.analyzeImage(masterImageBase64);

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ SmartResizer: OCR complete', {
          textCount: detectedContent.texts.length,
          visualCount: detectedContent.visual_elements.length,
        });
      }

      // Save detected content to job
      await supabaseAdmin
        .from('smart_resizer_jobs')
        .update({ detected_content: detectedContent })
        .eq('id', jobId);

      // Get master image metadata
      const masterMetadata = await imageProcessing.getImageMetadata(masterImageBuffer);

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
          masterMetadata,
          detectedContent,
        });

        results.push(formatResult);

        if (process.env.NODE_ENV === 'development') {
          const emoji = formatResult.status === 'completed' ? '✅' : '❌';
          console.log(`${emoji} SmartResizer: Format ${formatKey}`, {
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
        console.log('🎉 SmartResizer: Job complete', {
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
        detectedContent,
        results,
        totalProcessingTimeMs,
      };
    } catch (error: any) {
      console.error('❌ SmartResizer.processJob: Failed', {
        jobId,
        error: error.message,
        stack: error.stack,
      });

      await this.updateJobStatus(jobId, 'failed');

      throw error;
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
    masterMetadata: any;
    detectedContent: DetectedContent;
  }): Promise<FormatResult> {
    const { jobId, clientId, formatKey, masterImageBuffer, masterMetadata, detectedContent } = params;
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
      console.error('❌ SmartResizer: Failed to create result record', {
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
        console.log('🔍 SmartResizer: Processing format', {
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
        // AI regeneration with Gemini
        processedBuffer = await this.generateWithAI(
          masterImageBuffer,
          detectedContent,
          formatKey,
          width,
          height,
          safeZone
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
      console.error('❌ SmartResizer.processFormat: Failed', {
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
   * Generate format using Gemini AI
   */
  private async generateWithAI(
    masterImageBuffer: Buffer,
    detectedContent: DetectedContent,
    formatKey: FormatPresetKey,
    width: number,
    height: number,
    safeZone: any
  ): Promise<Buffer> {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎨 SmartResizer: Generating with AI', { formatKey, width, height });
    }

    const startTime = Date.now();

    try {
      // Calculate safe zone in pixels
      const safeZonePixels = calculateSafeZonePixels(width, height, safeZone);

      // Build comprehensive prompt
      const prompt = ocrService.buildGenerationPrompt(
        detectedContent,
        formatKey,
        width,
        height,
        safeZonePixels
      );

      // Convert master image to base64
      const masterImageBase64 = imageProcessing.bufferToBase64(masterImageBuffer);

      // Call Gemini Image Service (Nano Banana Pro)
      const result = await geminiService.generateImageWithReference({
        prompt,
        referenceImage: masterImageBase64,
        aspectRatio: `${width}:${height}`,
      });

      const processingTime = Date.now() - startTime;

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ SmartResizer: AI generation complete', {
          formatKey,
          processingTime: `${processingTime}ms`,
        });
      }

      // Result is already a Buffer from geminiService
      return result;
    } catch (error: any) {
      console.error('❌ SmartResizer.generateWithAI: Failed', {
        formatKey,
        error: error.message,
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
