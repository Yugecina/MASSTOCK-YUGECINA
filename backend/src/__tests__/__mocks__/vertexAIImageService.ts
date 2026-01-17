/**
 * Deterministic mock for Vertex AI Image Service
 * Supports configurable responses: success, rate limit, server error, timeout, partial failure
 *
 * Usage in tests:
 *
 * import { setMockConfig, resetMockConfig } from '../../__mocks__/vertexAIImageService';
 *
 * beforeEach(() => {
 *   resetMockConfig();
 *   setMockConfig({ mode: 'success' });
 * });
 *
 * // Test rate limiting
 * setMockConfig({ mode: 'rate_limit' });
 *
 * // Test partial failures
 * setMockConfig({ mode: 'partial_failure', failureRate: 0.3 });
 */

interface MockConfig {
  mode: 'success' | 'rate_limit' | 'server_error' | 'timeout' | 'partial_failure';
  failureRate?: number; // For partial_failure mode (0-1)
  delay?: number; // Artificial delay in ms
}

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

let mockConfig: MockConfig = { mode: 'success' };

/**
 * Configure mock behavior for tests
 */
export function setMockConfig(config: Partial<MockConfig>): void {
  mockConfig = { ...mockConfig, ...config };
}

/**
 * Reset mock to default success mode
 */
export function resetMockConfig(): void {
  mockConfig = { mode: 'success' };
}

/**
 * Get current mock configuration (for testing)
 */
export function getMockConfig(): MockConfig {
  return { ...mockConfig };
}

/**
 * Mock Vertex AI Image Service Class
 */
class MockVertexAIImageService {
  private model: string = 'gemini-2.5-flash-image';

  /**
   * Set the model to use
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Generate an image from a prompt
   */
  async generateImage(prompt: string, options: GenerateImageOptions = {}): Promise<GenerateImageResult> {
    const startTime = Date.now();

    // Simulate network delay if configured
    if (mockConfig.delay && mockConfig.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, mockConfig.delay));
    }

    // Handle different mock modes
    switch (mockConfig.mode) {
      case 'rate_limit': {
        const processingTime = Date.now() - startTime;
        return {
          success: false,
          error: {
            message: 'Rate limit exceeded. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429,
            originalError: 'Resource has been exhausted'
          },
          processingTimeMs: processingTime,
          prompt
        };
      }

      case 'server_error': {
        const processingTime = Date.now() - startTime;
        return {
          success: false,
          error: {
            message: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            statusCode: 500,
            originalError: 'Internal error'
          },
          processingTimeMs: processingTime,
          prompt
        };
      }

      case 'timeout': {
        // Simulate timeout by waiting longer than test timeout
        await new Promise(resolve => setTimeout(resolve, 60000));
        const processingTime = Date.now() - startTime;
        return {
          success: false,
          error: {
            message: 'Request timeout. The image generation took too long.',
            code: 'TIMEOUT',
            originalError: 'Timeout error'
          },
          processingTimeMs: processingTime,
          prompt
        };
      }

      case 'partial_failure': {
        // Randomly fail based on configured failure rate
        const failureRate = mockConfig.failureRate ?? 0.3;
        if (Math.random() < failureRate) {
          const processingTime = Date.now() - startTime;
          return {
            success: false,
            error: {
              message: 'Internal server error',
              code: 'RANDOM_FAILURE',
              originalError: 'Simulated partial failure'
            },
            processingTimeMs: processingTime,
            prompt
          };
        }
        break;
      }

      case 'success':
      default:
        // Continue to success response below
        break;
    }

    // Return deterministic mock image (1x1 transparent PNG base64)
    const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      imageData: mockImageBase64,
      mimeType: 'image/png',
      processingTimeMs: processingTime,
      cost: this.model.includes('flash') ? 0.0025 : 0.039,
      model: this.model,
      prompt
    };
  }

  /**
   * Generate image with reference image (wrapper for Smart Resizer)
   */
  async generateImageWithReference(params: {
    prompt: string;
    referenceImage: string;
    aspectRatio: string;
  }): Promise<Buffer> {
    const result = await this.generateImage(params.prompt, {
      referenceImages: [{
        data: params.referenceImage,
        mimeType: 'image/png'
      }],
      aspectRatio: params.aspectRatio
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
const mockVertexAIService = new MockVertexAIImageService();
export default mockVertexAIService;

// Export class for direct instantiation if needed
export { MockVertexAIImageService };
