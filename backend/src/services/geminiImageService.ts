/**
 * Gemini Image Service
 *
 * Integrates with Google Gemini 2.5 Flash Image API (aka "Nano Banana")
 * for AI image generation.
 *
 * API Documentation:
 * https://ai.google.dev/gemini-api/docs/image-generation
 *
 * Pricing: $0.039 per image (1,290 output tokens)
 */

import axios, { AxiosResponse, AxiosError } from 'axios';
import { logger } from '../config/logger';
import { logApiCall, logApiResponse, logError, logRetry } from '../utils/workflowLogger';

// API Configuration
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-2.5-flash-image';
const API_TIMEOUT = 120000; // 120 seconds (increased from 60s due to observed 84s processing times)
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const TIMEOUT_RETRY_DELAY = 5000; // 5 seconds for timeout errors (longer delay)

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

interface RequestPayload {
  contents: Array<{
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }>;
  }>;
  generationConfig: {
    responseModalities: string[];
    imageConfig: {
      aspectRatio: string;
      imageSize?: string;
    };
  };
}

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inline_data?: {
          mime_type?: string;
          mimeType?: string;
          data: string;
        };
        inlineData?: {
          mime_type?: string;
          mimeType?: string;
          data: string;
        };
      }>;
    };
  }>;
  [key: string]: any;
}

/**
 * Gemini Image Service Class
 */
class GeminiImageService {
  private apiKey: string;
  private baseUrl: string;
  private model: ValidModel;

  /**
   * Create a new Gemini Image Service instance
   *
   * @param apiKey - Google Gemini API key
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.apiKey = apiKey;
    this.baseUrl = GEMINI_API_BASE_URL;
    this.model = GEMINI_MODEL;
  }

  /**
   * Set the Gemini model to use
   *
   * @param model - Model name (e.g., 'gemini-2.5-flash-image', 'gemini-3-pro-image-preview')
   */
  setModel(model: string): void {
    const validModels: ValidModel[] = ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'];
    if (model && validModels.includes(model as ValidModel)) {
      this.model = model as ValidModel;
      logger.debug(`Model set to: ${model}`);
    } else {
      logger.warn(`Invalid model "${model}". Using default: ${GEMINI_MODEL}`);
      this.model = GEMINI_MODEL;
    }
  }

  /**
   * Generate an image from a prompt
   *
   * @param prompt - The text prompt describing the desired image
   * @param options - Generation options
   * @param options.referenceImages - Array of reference images in base64
   * @param options.aspectRatio - Image aspect ratio (default: "1:1")
   * @param options.imageSize - Image resolution for Pro model: "1K", "2K", or "4K" (default: null)
   * @param options.timeout - Request timeout in ms (default: 60000)
   * @returns Generated image result
   *
   * @example
   * const result = await service.generateImage("a cat wearing sunglasses", {
   *   referenceImages: [{ data: "base64...", mimeType: "image/jpeg" }],
   *   aspectRatio: "16:9",
   *   imageSize: "4K"  // For Pro model only
   * });
   */
  async generateImage(prompt: string, options: GenerateImageOptions = {}): Promise<GenerateImageResult> {
    const {
      referenceImages = [],
      aspectRatio = '1:1',
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
      logger.warn(`Too many reference images provided (${referenceImages.length}). Gemini API supports up to 14 images (6 objects + 5 humans).`);
    }

    const startTime = Date.now();

    logger.debug(`\n🎨 Gemini Image Service - generateImage called`);
    logger.debug(`   Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);
    logger.debug(`   Prompt length: ${prompt.length} chars`);
    logger.debug(`   Reference images: ${referenceImages.length}`);
    logger.debug(`   Aspect ratio: ${aspectRatio}`);
    logger.debug(`   Image size: ${imageSize || 'default'}`);
    logger.debug(`   Model: ${this.model}`);

    try {
      // Build request payload
      const payload = this._buildRequestPayload(prompt, referenceImages, aspectRatio, imageSize);

      logger.debug(`📦 Request payload built:`);
      logger.debug(`   Parts count: ${payload.contents[0].parts.length}`);
      logger.debug(`   Payload size: ${JSON.stringify(payload).length} bytes`);

      // Make API request with retries
      const response = await this._makeRequestWithRetry(payload, timeout);

      logger.debug(`\n📥 Raw Gemini API Response:`);
      logger.debug(`   Status: ${response.status}`);
      logger.debug(`   Response keys: ${Object.keys(response.data).join(', ')}`);
      if (response.data.candidates) {
        logger.debug(`   Candidates count: ${response.data.candidates.length}`);
      }

      // Extract image from response
      const imageData = this._extractImageFromResponse(response.data);

      const processingTime = Date.now() - startTime;

      logger.debug(`\n✅ Image extracted successfully:`);
      logger.debug(`   MIME type: ${imageData.mimeType}`);
      logger.debug(`   Data size: ${imageData.data.length} chars (base64)`);
      logger.debug(`   Processing time: ${(processingTime / 1000).toFixed(2)}s`);

      logApiResponse('Gemini', response.data, {
        status: response.status,
        processingTime,
        hasCandidates: !!response.data.candidates,
        candidatesCount: response.data.candidates?.length,
        imageDataSize: imageData.data.length,
        mimeType: imageData.mimeType
      });

      logger.info('Gemini image generated successfully', {
        promptLength: prompt.length,
        referenceImageCount: referenceImages.length,
        processingTimeMs: processingTime,
        cost: 0.039
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
      const err = error as AxiosError;

      logger.debug(`\n❌ Gemini Image Service - Generation Failed`);
      logger.debug(`   Error: ${err.message}`);
      logger.debug(`   Processing time: ${(processingTime / 1000).toFixed(2)}s`);

      if (err.response) {
        logger.debug(`\n📋 Error Response Details:`);
        logger.debug(`   Status: ${err.response.status}`);
        logger.debug(`   Status Text: ${err.response.statusText}`);
        logger.debug(`   Response Data:`, JSON.stringify(err.response.data, null, 2));
      }

      if (err.code) {
        logger.debug(`   Error Code: ${err.code}`);
      }

      logError('GEMINI_API', err, {
        prompt: prompt.substring(0, 100),
        promptLength: prompt.length,
        referenceImageCount: referenceImages.length,
        processingTime,
        statusCode: err.response?.status,
        apiResponse: err.response?.data
      });

      logger.error('Gemini image generation failed', {
        error: err.message,
        prompt: prompt.substring(0, 100),
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
   * Build request payload for Gemini API
   *
   * @private
   * @param prompt - The text prompt
   * @param referenceImages - Reference images
   * @param aspectRatio - Image aspect ratio
   * @param imageSize - Image resolution (1K, 2K, 4K) for Pro model
   * @returns Request payload
   */
  private _buildRequestPayload(
    prompt: string,
    referenceImages: ReferenceImage[],
    aspectRatio: string,
    imageSize: string | null = null
  ): RequestPayload {
    const parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }> = [];

    // Add text prompt
    parts.push({
      text: prompt
    });

    // Add reference images if provided
    referenceImages.forEach(image => {
      if (image.data && image.mimeType) {
        parts.push({
          inline_data: {
            mime_type: image.mimeType,
            data: image.data
          }
        });
      }
    });

    // Build imageConfig
    const imageConfig: { aspectRatio: string; imageSize?: string } = {
      aspectRatio: aspectRatio
    };

    // Add imageSize for Pro model only
    const isProModel = this.model === 'gemini-3-pro-image-preview';
    if (isProModel && imageSize) {
      imageConfig.imageSize = imageSize;
      logger.debug(`   Adding imageSize "${imageSize}" for Pro model`);
    }

    return {
      contents: [{
        parts: parts
      }],
      generationConfig: {
        responseModalities: ['Image'],
        imageConfig: imageConfig
      }
    };
  }

  /**
   * Make API request with retry logic
   *
   * @private
   * @param payload - Request payload
   * @param timeout - Request timeout
   * @returns API response
   */
  private async _makeRequestWithRetry(payload: RequestPayload, timeout: number): Promise<AxiosResponse<GeminiApiResponse>> {
    let lastError: AxiosError | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Progressive timeout: increase timeout on each retry attempt
        const attemptTimeout = timeout + (30000 * (attempt - 1)); // Add 30s per retry

        const url = `${this.baseUrl}/models/${this.model}:generateContent`;

        logger.debug(`\n🌐 Making Gemini API request (attempt ${attempt}/${MAX_RETRIES})`);
        logger.debug(`   URL: ${url}`);
        logger.debug(`   API Key: ${this.apiKey.substring(0, 8)}...${this.apiKey.substring(this.apiKey.length - 4)} (length: ${this.apiKey.length})`);
        logger.debug(`   Payload size: ${JSON.stringify(payload).length} bytes`);
        logger.debug(`   Timeout: ${attemptTimeout}ms (base: ${timeout}ms + ${30000 * (attempt - 1)}ms)`);

        logApiCall('Gemini', payload, {
          model: this.model,
          apiKey: this.apiKey,
          attempt,
          maxAttempts: MAX_RETRIES,
          url,
          timeout: attemptTimeout
        });

        logger.debug('Making Gemini API request', {
          url,
          attempt,
          payloadSize: JSON.stringify(payload).length,
          hasApiKey: !!this.apiKey,
          apiKeyLength: this.apiKey?.length,
          timeout: attemptTimeout
        });

        const requestStartTime = Date.now();

        const response = await axios.post<GeminiApiResponse>(
          url,
          payload,
          {
            headers: {
              'x-goog-api-key': this.apiKey,
              'Content-Type': 'application/json'
            },
            timeout: attemptTimeout
          }
        );

        const requestTime = Date.now() - requestStartTime;

        logger.debug(`\n✅ Gemini API request successful (${requestTime}ms)`);
        logger.debug(`   Status: ${response.status}`);
        logger.debug(`   Response data keys: ${Object.keys(response.data).join(', ')}`);

        // Warn if request took >80% of timeout
        if (requestTime > attemptTimeout * 0.8) {
          logger.warn(`⚠️  Request took ${requestTime}ms (${Math.round(requestTime/attemptTimeout*100)}% of ${attemptTimeout}ms timeout)`, {
            requestTime,
            timeout: attemptTimeout,
            percentUsed: Math.round(requestTime/attemptTimeout*100)
          });
        }

        logger.debug('Gemini API response received', {
          status: response.status,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : []
        });

        return response;

      } catch (error) {
        lastError = error as AxiosError;
        const isTimeout = lastError.code === 'ECONNABORTED' || lastError.code === 'ETIMEDOUT';

        logger.debug(`\n❌ Gemini API request failed (attempt ${attempt}/${MAX_RETRIES})`);
        logger.debug(`   Error: ${lastError.message}`);
        logger.debug(`   Is timeout: ${isTimeout}`);

        if (lastError.response) {
          logger.debug(`   Status: ${lastError.response.status}`);
          logger.debug(`   Status Text: ${lastError.response.statusText}`);
          logger.debug(`   Response Headers:`, JSON.stringify(lastError.response.headers, null, 2));
          logger.debug(`   Response Data:`, JSON.stringify(lastError.response.data, null, 2));
        } else if (lastError.request) {
          logger.debug(`   No response received from server`);
          logger.debug(`   Request was made but no response`);
        } else {
          logger.debug(`   Error setting up request: ${lastError.message}`);
        }

        if (lastError.code) {
          logger.debug(`   Error Code: ${lastError.code}`);
        }

        // Log detailed error information
        logger.error('Gemini API request error', {
          error: lastError.message,
          statusCode: lastError.response?.status,
          statusText: lastError.response?.statusText,
          responseData: lastError.response?.data,
          hasResponse: !!lastError.response,
          code: lastError.code,
          isTimeout
        });

        // Don't retry on certain errors
        if (this._shouldNotRetry(lastError)) {
          logger.debug(`   ⛔ Error is not retriable, throwing immediately`);
          throw lastError;
        }

        // Log retry attempt
        if (attempt < MAX_RETRIES) {
          // Use longer delay for timeout errors
          const backoffDelay = isTimeout
            ? TIMEOUT_RETRY_DELAY * attempt
            : RETRY_DELAY * attempt;

          logger.debug(`\n⏳ Retrying in ${backoffDelay}ms...`);
          if (isTimeout) {
            logger.debug(`   Using extended delay for timeout error`);
          }

          logRetry(attempt + 1, MAX_RETRIES, backoffDelay, lastError);

          logger.warn(`Gemini API request failed, retrying (${attempt}/${MAX_RETRIES})`, {
            error: lastError.message,
            statusCode: lastError.response?.status,
            isTimeout,
            retryDelay: backoffDelay
          });

          // Wait before retrying
          await this._sleep(backoffDelay);
        }
      }
    }

    // All retries failed
    logger.debug(`\n❌ All ${MAX_RETRIES} retry attempts failed`);
    logger.debug(`   Final error: ${lastError?.message}`);
    throw lastError;
  }

  /**
   * Check if error should not be retried
   *
   * @private
   * @param error - The error object
   * @returns True if should not retry
   */
  private _shouldNotRetry(error: AxiosError): boolean {
    const statusCode = error.response?.status;

    // Don't retry on client errors (except rate limit)
    if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
      return true;
    }

    // Don't retry on invalid API key
    if (statusCode === 401 || statusCode === 403) {
      return true;
    }

    return false;
  }

  /**
   * Extract image data from API response
   *
   * @private
   * @param responseData - API response data
   * @returns Image data
   */
  private _extractImageFromResponse(responseData: GeminiApiResponse): ImageData {
    logger.debug(`\n🔍 Extracting image from Gemini response...`);

    // Log response for debugging
    logger.debug('Gemini API response structure', {
      hasCandidates: !!responseData.candidates,
      candidatesCount: responseData.candidates?.length,
      firstCandidateKeys: responseData.candidates?.[0] ? Object.keys(responseData.candidates[0]) : [],
      fullResponse: JSON.stringify(responseData, null, 2).substring(0, 500)
    });

    logger.debug(`   Response structure:`);
    logger.debug(`   - Has candidates: ${!!responseData.candidates}`);
    logger.debug(`   - Candidates count: ${responseData.candidates?.length || 0}`);

    // Navigate response structure to find image data
    const candidates = responseData.candidates;

    if (!candidates || candidates.length === 0) {
      logger.debug(`   ❌ No candidates found in response`);
      logger.debug(`   Response keys: ${Object.keys(responseData).join(', ')}`);
      throw new Error('No image candidates in response');
    }

    logger.debug(`   - First candidate keys: ${Object.keys(candidates[0]).join(', ')}`);

    const parts = candidates[0].content?.parts;

    logger.debug(`   - Has content.parts: ${!!parts}`);
    logger.debug(`   - Parts count: ${parts?.length || 0}`);

    if (!parts || parts.length === 0) {
      logger.debug(`   ❌ No parts found in candidate content`);
      throw new Error('No image parts in response');
    }

    logger.debug(`   - Part[0] keys: ${Object.keys(parts[0]).join(', ')}`);

    // Find inline_data part (supports both inline_data and inlineData formats)
    const imagePart = parts.find(part => part.inline_data || part.inlineData);

    if (!imagePart) {
      logger.debug(`   ❌ No image part found`);
      logger.debug(`   All parts keys:`, parts.map(p => Object.keys(p)));

      logger.error('No image part found', {
        partsCount: parts.length,
        partKeys: parts.map(p => Object.keys(p))
      });
      throw new Error('No image data found in response');
    }

    logger.debug(`   ✅ Image part found`);

    // Support both naming conventions
    const inlineData = imagePart.inline_data || imagePart.inlineData;

    if (!inlineData) {
      logger.debug(`   ❌ No inline_data in image part`);
      throw new Error('No image data found in response');
    }

    const mimeType = inlineData.mime_type || inlineData.mimeType || 'image/png';
    const dataLength = inlineData.data?.length || 0;

    logger.debug(`   ✅ Image data extracted successfully`);
    logger.debug(`   - MIME type: ${mimeType}`);
    logger.debug(`   - Data length: ${dataLength} chars`);

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
  private _formatError(error: AxiosError): {
    message: string;
    code: string;
    statusCode?: number;
    originalError: string;
  } {
    const statusCode = error.response?.status;
    const errorData = error.response?.data as any;

    let message = error.message;
    let code = 'UNKNOWN_ERROR';

    if (statusCode === 401 || statusCode === 403) {
      message = 'Invalid or expired API key';
      code = 'INVALID_API_KEY';
    } else if (statusCode === 429) {
      message = 'Rate limit exceeded. Please try again later.';
      code = 'RATE_LIMIT_EXCEEDED';
    } else if (statusCode === 400) {
      message = errorData?.error?.message || 'Invalid request';
      code = 'INVALID_REQUEST';
    } else if (statusCode && statusCode >= 500) {
      message = 'Gemini API server error. Please try again later.';
      code = 'SERVER_ERROR';
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      message = 'Request timeout. The image generation took too long.';
      code = 'TIMEOUT';
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
}

/**
 * Create a Gemini Image Service instance
 *
 * @param apiKey - Google Gemini API key
 * @returns Service instance
 */
function createGeminiImageService(apiKey: string): GeminiImageService {
  return new GeminiImageService(apiKey);
}

export {
  GeminiImageService,
  createGeminiImageService,
  GenerateImageOptions,
  GenerateImageResult,
  ReferenceImage
};
