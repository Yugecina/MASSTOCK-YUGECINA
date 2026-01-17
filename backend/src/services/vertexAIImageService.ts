/**
 * Vertex AI Image Service (New SDK - @google/genai)
 *
 * Integrates with Google Vertex AI for AI image generation using Gemini models.
 * Provides much higher rate limits compared to Google AI Studio (500+ RPM vs 20 RPM).
 *
 * Migration from @google-cloud/vertexai to @google/genai (June 2025)
 *
 * Supported Models:
 * - gemini-2.5-flash-image: Nano Banana Flash (fast, economical)
 * - gemini-3-pro-image-preview: Nano Banana Pro (high quality, reasoning)
 *
 * API Documentation:
 * https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/image-generation
 */

import { GoogleGenAI, Modality } from '@google/genai';
import { logger } from '../config/logger';
import * as fs from 'fs';
import * as path from 'path';

// API Configuration
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || '';
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'global';
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
const DEFAULT_MODEL = 'gemini-2.5-flash-image';
const API_TIMEOUT = 120000; // 120 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Type definitions
type ValidModel = 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';

interface ReferenceImage {
  data: string;
  mimeType: string;
}

interface GenerateImageOptions {
  referenceImages?: ReferenceImage[];
  aspectRatio?: string;
  imageSize?: string | null;
  timeout?: number;
}

interface ImageData {
  data: string;
  mimeType: string;
}

interface GenerateImageResult {
  success: boolean;
  imageData?: string;
  mimeType?: string;
  processingTimeMs: number;
  cost?: number;
  model?: string;
  prompt: string;
  error?: {
    message: string;
    code: string;
    statusCode?: number;
    originalError: string;
  };
}

/**
 * Vertex AI Image Service Class
 */
class VertexAIImageService {
  private client: GoogleGenAI;
  private model: ValidModel;
  private projectId: string;
  private location: string;

  /**
   * Create a new Vertex AI Image Service instance
   */
  constructor() {
    this.projectId = GOOGLE_CLOUD_PROJECT;
    this.location = GOOGLE_CLOUD_LOCATION;
    this.model = DEFAULT_MODEL;

    // Validate configuration BEFORE initializing
    this._validateConfiguration();

    // Initialize Vertex AI client
    try {
      this.client = new GoogleGenAI({
        vertexai: true,
        project: this.projectId,
        location: this.location,
      });

      logger.info('🚀 [VERTEX_AI_INIT] Vertex AI Image Service initialized', {
        project: this.projectId,
        location: this.location,
        model: this.model,
        sdk: '@google/genai',
        credentialsPath: GOOGLE_APPLICATION_CREDENTIALS
      });
    } catch (error) {
      const err = error as Error;
      logger.error('❌ [VERTEX_AI_INIT] Failed to initialize Vertex AI client', {
        error: err.message,
        stack: err.stack
      });
      throw error;
    }
  }

  /**
   * Validate configuration and credentials
   * @private
   */
  private _validateConfiguration(): void {
    logger.info('🔍 [VERTEX_AI_CONFIG] Validating configuration...');

    // Check required environment variables
    if (!this.projectId) {
      logger.error('❌ [VERTEX_AI_CONFIG] GOOGLE_CLOUD_PROJECT not set');
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
    }

    if (!GOOGLE_APPLICATION_CREDENTIALS) {
      logger.error('❌ [VERTEX_AI_CONFIG] GOOGLE_APPLICATION_CREDENTIALS not set');
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is required');
    }

    // Check if credentials file exists
    if (!fs.existsSync(GOOGLE_APPLICATION_CREDENTIALS)) {
      logger.error('❌ [VERTEX_AI_CONFIG] Credentials file not found', {
        path: GOOGLE_APPLICATION_CREDENTIALS
      });
      throw new Error(`Credentials file not found: ${GOOGLE_APPLICATION_CREDENTIALS}`);
    }

    // Parse and validate credentials file
    try {
      const credsContent = fs.readFileSync(GOOGLE_APPLICATION_CREDENTIALS, 'utf8');
      const creds = JSON.parse(credsContent);

      logger.info('✅ [VERTEX_AI_CONFIG] Credentials loaded successfully', {
        type: creds.type,
        projectId: creds.project_id,
        clientEmail: creds.client_email,
        fileSize: credsContent.length
      });

      // Verify project ID matches
      if (creds.project_id !== this.projectId) {
        logger.warn('⚠️  [VERTEX_AI_CONFIG] Project ID mismatch', {
          envProjectId: this.projectId,
          credsProjectId: creds.project_id
        });
      }
    } catch (error) {
      const err = error as Error;
      logger.error('❌ [VERTEX_AI_CONFIG] Failed to read credentials file', {
        error: err.message,
        path: GOOGLE_APPLICATION_CREDENTIALS
      });
      throw new Error(`Invalid credentials file: ${err.message}`);
    }
  }

  /**
   * Set the Gemini model to use
   *
   * @param model - Model name
   */
  setModel(model: string): void {
    const validModels: ValidModel[] = [
      'gemini-2.5-flash-image',
      'gemini-3-pro-image-preview'
    ];

    if (model && validModels.includes(model as ValidModel)) {
      this.model = model as ValidModel;
      logger.debug(`🎯 [VERTEX_AI_CONFIG] Model set to: ${model}`);
    } else {
      logger.warn(`⚠️  [VERTEX_AI_CONFIG] Invalid model "${model}". Using default: ${DEFAULT_MODEL}`);
      this.model = DEFAULT_MODEL;
    }
  }

  /**
   * Generate an image from a prompt
   *
   * @param prompt - The text prompt describing the desired image
   * @param options - Generation options
   * @returns Generated image result
   */
  async generateImage(prompt: string, options: GenerateImageOptions = {}): Promise<GenerateImageResult> {
    const {
      referenceImages = [],
      aspectRatio,
      imageSize = null,
      timeout = API_TIMEOUT
    } = options;

    // Validate inputs
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Valid prompt is required');
    }

    if (prompt.length < 3) {
      throw new Error('Prompt is too short (minimum 3 characters)');
    }

    if (referenceImages.length > 14) {
      logger.warn(`⚠️  [VERTEX_AI_REQUEST] Too many reference images (${referenceImages.length}). Max is 14.`);
    }

    const startTime = Date.now();

    logger.debug('📤 [VERTEX_AI_REQUEST] Preparing image generation request', {
      model: this.model,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      referenceImagesCount: referenceImages.length,
      aspectRatio,
      imageSize: imageSize || 'default',
      project: this.projectId,
      location: this.location
    });

    try {
      // Build request content
      const parts: any[] = [{ text: prompt }];

      // Add reference images
      for (const img of referenceImages) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data
          }
        });
      }

      logger.debug('📦 [VERTEX_AI_REQUEST] Request payload built', {
        partsCount: parts.length,
        hasText: true,
        imageCount: parts.length - 1
      });

      // Make API request with retry
      const response = await this._makeRequestWithRetry(parts, aspectRatio, imageSize, timeout);

      // Extract image from response
      const imageData = this._extractImageFromResponse(response);

      const processingTime = Date.now() - startTime;

      logger.info('✅ [VERTEX_AI_SUCCESS] Image generated successfully', {
        processingTimeMs: processingTime,
        processingTimeSec: (processingTime / 1000).toFixed(2),
        imageDataLength: imageData.data.length,
        mimeType: imageData.mimeType,
        model: this.model,
        promptLength: prompt.length
      });

      return {
        success: true,
        imageData: imageData.data,
        mimeType: imageData.mimeType || 'image/png',
        processingTimeMs: processingTime,
        cost: 0.039,
        model: this.model,
        prompt: prompt
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const err = error as any;

      logger.error('❌ [VERTEX_AI_ERROR] Image generation failed', {
        errorName: err.name,
        errorMessage: err.message,
        errorStack: err.stack,
        errorCode: err.code,
        statusCode: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data ? JSON.stringify(err.response.data) : undefined,
        model: this.model,
        project: this.projectId,
        location: this.location,
        promptPreview: prompt.substring(0, 50),
        processingTimeMs: processingTime
      });

      return {
        success: false,
        error: this._formatError(err),
        processingTimeMs: processingTime,
        prompt: prompt
      };
    }
  }

  /**
   * Make API request with retry logic
   *
   * @private
   * @param parts - Content parts (text + images)
   * @param aspectRatio - Image aspect ratio
   * @param imageSize - Image resolution (1K, 2K, 4K) for Pro model
   * @param timeout - Request timeout
   * @returns API response
   */
  private async _makeRequestWithRetry(
    parts: any[],
    aspectRatio: string,
    imageSize: string | null,
    timeout: number
  ): Promise<any> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.debug(`🌐 [VERTEX_AI_REQUEST] Making request (attempt ${attempt}/${MAX_RETRIES})`, {
          model: this.model,
          partsCount: parts.length,
          aspectRatio,
          timeout
        });

        const requestStartTime = Date.now();

        // Generate content using Vertex AI
        const response = await this.client.models.generateContent({
          model: this.model,
          contents: [{
            role: 'user',
            parts: parts
          }],
          config: {
            // IMPORTANT: Both modalities are required for image generation
            responseModalities: [Modality.TEXT, Modality.IMAGE],
            // Image generation config (aspectRatio + imageSize for Pro model)
            imageConfig: {
              ...(aspectRatio && { aspectRatio }),
              ...(imageSize && this.model === 'gemini-3-pro-image-preview' && {
                imageSize: imageSize
              })
            }
          }
        });

        const requestTime = Date.now() - requestStartTime;

        logger.debug(`✅ [VERTEX_AI_REQUEST] Request successful (${requestTime}ms)`, {
          attempt,
          requestTimeMs: requestTime,
          hasResponse: !!response
        });

        // Warn if request took >80% of timeout
        if (requestTime > timeout * 0.8) {
          logger.warn('⚠️  [VERTEX_AI_REQUEST] Request took long time', {
            requestTimeMs: requestTime,
            timeoutMs: timeout,
            percentUsed: Math.round(requestTime / timeout * 100)
          });
        }

        return response;

      } catch (error) {
        lastError = error as Error;

        logger.debug(`❌ [VERTEX_AI_RETRY] Request failed (attempt ${attempt}/${MAX_RETRIES})`, {
          error: lastError.message,
          attempt,
          maxRetries: MAX_RETRIES
        });

        // Don't retry on certain errors
        if (this._shouldNotRetry(lastError)) {
          logger.debug('⛔ [VERTEX_AI_RETRY] Error is not retriable, throwing immediately');
          throw lastError;
        }

        // Wait before retrying
        if (attempt < MAX_RETRIES) {
          const backoffDelay = RETRY_DELAY * attempt;
          logger.debug(`⏳ [VERTEX_AI_RETRY] Waiting ${backoffDelay}ms before retry...`);
          await this._sleep(backoffDelay);
        }
      }
    }

    // All retries failed
    logger.error(`❌ [VERTEX_AI_RETRY] All ${MAX_RETRIES} retry attempts failed`, {
      finalError: lastError?.message
    });
    throw lastError || new Error('Unknown error after retries');
  }

  /**
   * Check if error should not be retried
   *
   * @private
   * @param error - The error object
   * @returns True if should not retry
   */
  private _shouldNotRetry(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();

    // Don't retry on authentication errors
    if (
      errorMessage.includes('auth') ||
      errorMessage.includes('permission') ||
      errorMessage.includes('credentials') ||
      errorMessage.includes('unauthorized')
    ) {
      return true;
    }

    // Don't retry on invalid request errors
    if (errorMessage.includes('invalid') || errorMessage.includes('bad request')) {
      return true;
    }

    return false;
  }

  /**
   * Extract image data from API response
   *
   * @private
   * @param response - API response data
   * @returns Image data
   */
  private _extractImageFromResponse(response: any): ImageData {
    logger.debug('🔍 [VERTEX_AI_RESPONSE] Extracting image from response...');

    // Check response structure
    if (!response || !response.candidates || response.candidates.length === 0) {
      logger.error('❌ [VERTEX_AI_RESPONSE] No candidates in response', {
        hasResponse: !!response,
        hasCandidates: !!response?.candidates,
        candidatesCount: response?.candidates?.length || 0
      });
      throw new Error('No image candidates in response');
    }

    const candidate = response.candidates[0];
    const parts = candidate?.content?.parts;

    if (!parts || parts.length === 0) {
      logger.error('❌ [VERTEX_AI_RESPONSE] No parts in candidate content', {
        hasContent: !!candidate?.content,
        hasParts: !!parts,
        partsCount: parts?.length || 0
      });
      throw new Error('No image parts in response');
    }

    // Find image part (supports both inline_data and inlineData formats)
    const imagePart = parts.find((part: any) => part.inline_data || part.inlineData);

    if (!imagePart) {
      logger.error('❌ [VERTEX_AI_RESPONSE] No image part found', {
        partsCount: parts.length,
        partKeys: parts.map((p: any) => Object.keys(p))
      });
      throw new Error('No image data found in response');
    }

    // Support both naming conventions
    const inlineData = imagePart.inline_data || imagePart.inlineData;

    if (!inlineData || !inlineData.data) {
      logger.error('❌ [VERTEX_AI_RESPONSE] No inline data in image part');
      throw new Error('No image data found in response');
    }

    const mimeType = inlineData.mime_type || inlineData.mimeType || 'image/png';
    const dataLength = inlineData.data?.length || 0;

    logger.debug('✅ [VERTEX_AI_RESPONSE] Image extracted successfully', {
      mimeType,
      dataLength,
      dataSizeKB: Math.round(dataLength * 0.75 / 1024) // Approx size in KB (base64 is ~33% larger)
    });

    return {
      data: inlineData.data,
      mimeType: mimeType
    };
  }

  /**
   * Format error for response
   *
   * @private
   * @param error - The error object
   * @returns Formatted error
   */
  private _formatError(error: any): {
    message: string;
    code: string;
    statusCode?: number;
    originalError: string;
  } {
    const errorMessage = (error.message || '').toLowerCase();

    let message = error.message;
    let code = 'UNKNOWN_ERROR';
    let statusCode = error.response?.status;

    if (errorMessage.includes('auth') || errorMessage.includes('credentials')) {
      message = 'Invalid or missing credentials';
      code = 'INVALID_CREDENTIALS';
    } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      message = 'Rate limit exceeded. Please try again later.';
      code = 'RATE_LIMIT_EXCEEDED';
    } else if (errorMessage.includes('invalid') || errorMessage.includes('bad request')) {
      message = 'Invalid request';
      code = 'INVALID_REQUEST';
    } else if (errorMessage.includes('timeout')) {
      message = 'Request timeout. The image generation took too long.';
      code = 'TIMEOUT';
    } else if (errorMessage.includes('not found') || errorMessage.includes('model')) {
      message = 'Model not found or not available in this region';
      code = 'MODEL_NOT_FOUND';
    }

    return {
      message,
      code,
      statusCode,
      originalError: error.message
    };
  }

  /**
   * Sleep utility for retry delays
   *
   * @private
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate image with reference image (wrapper for Smart Resizer)
   * Returns image as Buffer instead of base64 string
   *
   * @param params.prompt - Generation prompt
   * @param params.referenceImage - Base64 encoded reference image
   * @param params.aspectRatio - Target aspect ratio (e.g., "16:9", "1080:1920")
   * @returns Image as Buffer
   */
  async generateImageWithReference(params: {
    prompt: string;
    referenceImage: string;
    aspectRatio: string;
  }): Promise<Buffer> {
    const { prompt, referenceImage, aspectRatio } = params;

    const result = await this.generateImage(prompt, {
      referenceImages: [{
        data: referenceImage,
        mimeType: 'image/png',
      }],
      aspectRatio,
    });

    if (!result.success || !result.imageData) {
      const errorMessage = result.error?.message || 'Unknown error';
      const errorCode = result.error?.code || 'UNKNOWN';
      const statusCode = result.error?.statusCode ? ` (HTTP ${result.error.statusCode})` : '';
      throw new Error(`Failed to generate image: [${errorCode}${statusCode}] ${errorMessage}`);
    }

    // Convert base64 to Buffer
    return Buffer.from(result.imageData, 'base64');
  }
}

// Export singleton instance
let vertexAIService: VertexAIImageService;

if (process.env.NODE_ENV === 'test') {
  // Import mock service for testing
  try {
    const mockService = require('../__tests__/__mocks__/vertexAIImageService');
    vertexAIService = mockService.default;
  } catch (e) {
    // Mock doesn't exist yet, create real service
    vertexAIService = new VertexAIImageService();
  }
} else {
  vertexAIService = new VertexAIImageService();
}

export default vertexAIService;

export {
  VertexAIImageService,
  GenerateImageOptions,
  GenerateImageResult,
  ReferenceImage
};
