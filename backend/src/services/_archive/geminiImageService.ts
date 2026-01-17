/**
 * Deterministic mock for Gemini Image API
 * Supports configurable responses: success, rate limit, server error, timeout, partial failure
 *
 * Usage in tests:
 *
 * import { setMockConfig, resetMockConfig } from '../../__mocks__/geminiImageService';
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
 * Mocked generateImage function
 * Returns deterministic 1x1 PNG in success mode
 * Throws errors in failure modes
 */
export async function generateImage(params: {
  prompt: string;
  model: string;
  aspectRatio: string;
  resolution?: string;
  referenceImages?: any[];
}): Promise<{ imageData: string; mimeType: string }> {
  // Simulate network delay if configured
  if (mockConfig.delay && mockConfig.delay > 0) {
    await new Promise(resolve => setTimeout(resolve, mockConfig.delay));
  }

  // Handle different mock modes
  switch (mockConfig.mode) {
    case 'rate_limit':
      throw new Error('RATE_LIMIT_EXCEEDED: 429 Resource has been exhausted');

    case 'server_error':
      throw new Error('INTERNAL_SERVER_ERROR: 500 Internal error');

    case 'timeout':
      // Simulate timeout by waiting longer than test timeout
      await new Promise(resolve => setTimeout(resolve, 60000));
      throw new Error('TIMEOUT');

    case 'partial_failure':
      // Randomly fail based on configured failure rate
      const failureRate = mockConfig.failureRate ?? 0.3;
      if (Math.random() < failureRate) {
        throw new Error('RANDOM_FAILURE: Simulated partial failure');
      }
      break;

    case 'success':
    default:
      // Continue to success response below
      break;
  }

  // Return deterministic mock image (1x1 transparent PNG base64)
  // This is a valid PNG that can be decoded and processed
  const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  return {
    imageData: mockImageBase64,
    mimeType: 'image/png'
  };
}

/**
 * Re-export all other functions from the real service
 * This allows the mock to be used as a drop-in replacement
 * while still providing access to real implementations for E2E tests
 */
// Note: In E2E tests, don't use jest.mock() and import the real service directly
