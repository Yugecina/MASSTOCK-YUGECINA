/**
 * Integration tests for Nano Banana workflow (MOCKED Vertex AI API)
 * Tests API → Worker flow with mocked external dependencies
 *
 * These tests verify:
 * - Full request/response cycle
 * - Database state transitions
 * - Pricing calculations
 * - Error handling
 * - Concurrent job processing
 */

// Mock the Vertex AI Image Service BEFORE any imports
jest.mock('../../../services/vertexAIImageService');

import { describe, it, expect, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { setMockConfig, resetMockConfig } from '../../__mocks__/vertexAIImageService';
import {
  nanoBananaFixtures,
  MOCK_USER_ID,
  MOCK_CLIENT_ID,
  MOCK_WORKFLOW_ID
} from '../../__helpers__/workflow-fixtures';
import {
  waitForJobCompletion,
  cleanupTestData,
  verifyImageStructure,
  verifyPricing,
  verifyExecutionMetadata,
  verifyBatchIndices,
  verifyExecutionStatus,
  getBatchResults,
  countBatchResultsByStatus
} from '../../__helpers__/workflow-test-helpers';

const supabaseAdmin: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Import app after mocking
let app: any;

describe('Nano Banana Workflow - Integration Tests (Mocked)', () => {
  let authToken: string;
  let executionId: string;
  let testWorkflowId: string;
  const MOCK_API_KEY = 'test-mock-api-key-for-integration-tests';

  beforeAll(async () => {
    // Import app after all mocks are set up
    app = (await import('../../../server')).default;

    // Use real Nano Banana workflow for dev@masstock.com
    // Workflow ID: 52e18313-8930-4901-a382-b9434f0f875f
    testWorkflowId = process.env.TEST_WORKFLOW_ID || '52e18313-8930-4901-a382-b9434f0f875f';
  });

  beforeEach(async () => {
    // Reset mock to success mode
    resetMockConfig();
    setMockConfig({ mode: 'success' });

    // Get auth token for test user (dev@masstock.com)
    const testEmail = process.env.TEST_USER_EMAIL || 'dev@masstock.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'DevPassword123!';

    console.log(`🔍 Attempting login with: ${testEmail}`);

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword
      });

    console.log(`📦 Login response status: ${loginResponse.status}`);
    console.log(`📦 Login response cookies:`, loginResponse.headers['set-cookie']);

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed with status ${loginResponse.status}: ${JSON.stringify(loginResponse.body)}`);
    }

    // Extract access token from cookies
    const cookies = loginResponse.headers['set-cookie'];
    if (cookies) {
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      const accessTokenCookie = cookieArray.find((cookie: string) => cookie.startsWith('access_token='));
      if (accessTokenCookie) {
        authToken = accessTokenCookie.split(';')[0].split('=')[1];
      }
    }

    // Fallback to body if present
    if (!authToken) {
      authToken = loginResponse.body.accessToken || loginResponse.body.access_token;
    }

    console.log(`✅ Auth token obtained: ${authToken ? 'YES' : 'NO'}`);
  });

  afterEach(async () => {
    // Cleanup test data
    if (executionId) {
      await cleanupTestData(executionId);
      executionId = '';
    }
  });

  afterAll(async () => {
    // Cleanup any remaining test data
    await supabaseAdmin
      .from('workflow_executions')
      .delete()
      .eq('workflow_id', testWorkflowId);
  });

  // ========================================================================
  // VALID CASES
  // ========================================================================

  describe('Valid Cases', () => {
    it('should execute workflow with single prompt successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: nanoBananaFixtures.singlePrompt.prompts.join('\n'),
          model: nanoBananaFixtures.singlePrompt.model,
          aspect_ratio: nanoBananaFixtures.singlePrompt.aspect_ratio,
          resolution: nanoBananaFixtures.singlePrompt.resolution,
          api_key: MOCK_API_KEY
        });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('execution_id');
      expect(response.body.data.status).toBe('pending');

      executionId = response.body.data.execution_id;

      // Wait for job completion (timeout 30s)
      const completion = await waitForJobCompletion(executionId);
      expect(completion.status).toBe('completed');

      // Verify execution in database
      const { data: execution } = await supabaseAdmin
        .from('workflow_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      verifyExecutionMetadata(execution, 'nano_banana');
      verifyExecutionStatus(execution, 'completed');

      // Verify batch results
      const batchResults = await getBatchResults(executionId);
      expect(batchResults).toHaveLength(1);
      batchResults.forEach(result => {
        verifyImageStructure(result);
      });

      // Verify pricing (Flash model: cost=0.0025, revenue=0.05)
      verifyPricing(execution, 1, 0.0025, 0.05);
    });

    it('should execute workflow with multiple prompts successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: nanoBananaFixtures.multiplePrompts.prompts.join('\n'),
          model: nanoBananaFixtures.multiplePrompts.model,
          aspect_ratio: nanoBananaFixtures.multiplePrompts.aspect_ratio,

          api_key: MOCK_API_KEY
        });

      expect(response.status).toBe(202);
      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId);
      expect(completion.status).toBe('completed');

      // Verify batch results count
      const batchResults = await getBatchResults(executionId);
      expect(batchResults).toHaveLength(3);

      // Verify indices are sequential
      verifyBatchIndices(batchResults, 3);
    });

    it('should calculate correct pricing for Pro model 4K', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: nanoBananaFixtures.proModel4K.prompts[0],
          model: nanoBananaFixtures.proModel4K.model,
          aspect_ratio: nanoBananaFixtures.proModel4K.aspect_ratio,
          resolution: nanoBananaFixtures.proModel4K.resolution,

          api_key: MOCK_API_KEY
        });

      expect(response.status).toBe(202);
      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId);
      expect(completion.status).toBe('completed');

      // Verify 4K pricing (Pro 4K: cost=0.04, revenue=0.8)
      const { data: execution } = await supabaseAdmin
        .from('workflow_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      verifyPricing(execution, 1, 0.04, 0.8);
    });

    it('should handle large batch (50 prompts)', async () => {
      const prompts = Array(50).fill('Test prompt');

      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: prompts.join('\n'),
          model: 'gemini-2.5-flash-image',
          aspect_ratio: '16:9',

          api_key: MOCK_API_KEY
        });

      expect(response.status).toBe(202);
      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId, 60000); // 60s timeout
      expect(completion.status).toBe('completed');

      // Verify all 50 images were generated
      const batchResults = await getBatchResults(executionId);
      expect(batchResults).toHaveLength(50);

      // Verify all completed successfully
      const completedCount = await countBatchResultsByStatus(executionId, 'completed');
      expect(completedCount).toBe(50);
    });
  });

  // ========================================================================
  // EDGE CASES
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle empty prompts list gracefully', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: '',
          model: nanoBananaFixtures.emptyPromptsList.model,
          aspect_ratio: nanoBananaFixtures.emptyPromptsList.aspect_ratio,

          api_key: MOCK_API_KEY
        });

      // Should reject with 400 Bad Request
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle very long prompts', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: nanoBananaFixtures.longPrompt.prompts[0],
          model: nanoBananaFixtures.longPrompt.model,
          aspect_ratio: nanoBananaFixtures.longPrompt.aspect_ratio,

          api_key: MOCK_API_KEY
        });

      expect(response.status).toBe(202);
      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId);
      expect(completion.status).toBe('completed');
    });

    it('should handle special characters in prompts', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: nanoBananaFixtures.specialCharacters.prompts[0],
          model: nanoBananaFixtures.specialCharacters.model,
          aspect_ratio: nanoBananaFixtures.specialCharacters.aspect_ratio,

          api_key: MOCK_API_KEY
        });

      expect(response.status).toBe(202);
      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId);
      expect(completion.status).toBe('completed');
    });
  });

  // ========================================================================
  // ERROR HANDLING
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle rate limit errors gracefully', async () => {
      setMockConfig({ mode: 'rate_limit' });

      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: nanoBananaFixtures.singlePrompt.prompts[0],
          model: nanoBananaFixtures.singlePrompt.model,
          aspect_ratio: nanoBananaFixtures.singlePrompt.aspect_ratio,

          api_key: MOCK_API_KEY
        });

      expect(response.status).toBe(202);
      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId);
      expect(completion.status).toBe('failed');
      expect(completion.error_message).toContain('RATE_LIMIT_EXCEEDED');
    });

    it('should handle Gemini server errors', async () => {
      setMockConfig({ mode: 'server_error' });

      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: nanoBananaFixtures.singlePrompt.prompts[0],
          model: nanoBananaFixtures.singlePrompt.model,
          aspect_ratio: nanoBananaFixtures.singlePrompt.aspect_ratio,

          api_key: MOCK_API_KEY
        });

      expect(response.status).toBe(202);
      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId);
      expect(completion.status).toBe('failed');
      expect(completion.error_message).toContain('INTERNAL_SERVER_ERROR');
    });

    it('should handle partial failures (some prompts fail)', async () => {
      setMockConfig({ mode: 'partial_failure', failureRate: 0.5 });

      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: nanoBananaFixtures.multiplePrompts.prompts.join('\n'),
          model: nanoBananaFixtures.multiplePrompts.model,
          aspect_ratio: nanoBananaFixtures.multiplePrompts.aspect_ratio,

          api_key: MOCK_API_KEY
        });

      expect(response.status).toBe(202);
      executionId = response.body.data.execution_id;

      await waitForJobCompletion(executionId);

      // Should complete but report partial success
      const batchResults = await getBatchResults(executionId);

      const successCount = batchResults.filter(r => r.status === 'completed').length;
      const failedCount = batchResults.filter(r => r.status === 'failed').length;

      expect(successCount + failedCount).toBe(3);
      expect(successCount).toBeGreaterThan(0);
      expect(failedCount).toBeGreaterThan(0);
    });

    it('should reject invalid model', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: nanoBananaFixtures.invalidModel.prompts[0],
          model: nanoBananaFixtures.invalidModel.model,
          aspect_ratio: nanoBananaFixtures.invalidModel.aspect_ratio,

          api_key: MOCK_API_KEY
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid aspect ratio', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: nanoBananaFixtures.invalidAspectRatio.prompts[0],
          model: nanoBananaFixtures.invalidAspectRatio.model,
          aspect_ratio: nanoBananaFixtures.invalidAspectRatio.aspect_ratio,

          api_key: MOCK_API_KEY
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  // ========================================================================
  // DATABASE STATE CONSISTENCY
  // ========================================================================

  describe('Database State Consistency', () => {
    it('should maintain correct execution status transitions', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: nanoBananaFixtures.singlePrompt.prompts[0],
          model: nanoBananaFixtures.singlePrompt.model,
          aspect_ratio: nanoBananaFixtures.singlePrompt.aspect_ratio,

          api_key: MOCK_API_KEY
        });

      executionId = response.body.data.execution_id;

      // Check initial state (pending)
      let { data: execution } = await supabaseAdmin
        .from('workflow_executions')
        .select('status, started_at, completed_at')
        .eq('id', executionId)
        .single();

      verifyExecutionStatus(execution, 'pending');

      // Wait for completion
      await waitForJobCompletion(executionId);

      // Check final state (completed)
      ({ data: execution } = await supabaseAdmin
        .from('workflow_executions')
        .select('status, started_at, completed_at')
        .eq('id', executionId)
        .single());

      verifyExecutionStatus(execution, 'completed');
    });

    it('should create correct number of batch result records', async () => {
      const promptCount = 5;
      const prompts = Array(promptCount).fill('Test prompt');

      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: prompts.join('\n'),
          model: 'gemini-2.5-flash-image',
          aspect_ratio: '16:9',

          api_key: MOCK_API_KEY
        });

      executionId = response.body.data.execution_id;

      await waitForJobCompletion(executionId);

      const { data: batchResults, count } = await supabaseAdmin
        .from('workflow_batch_results')
        .select('*', { count: 'exact' })
        .eq('execution_id', executionId);

      expect(count).toBe(promptCount);
      expect(batchResults).toHaveLength(promptCount);

      // Verify each has unique index
      verifyBatchIndices(batchResults!, promptCount);
    });
  });

  // ========================================================================
  // AUTHENTICATION & AUTHORIZATION
  // ========================================================================

  describe('Authentication & Authorization', () => {
    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        // No Authorization header
        .send({
          prompts_text: 'Test prompt',
          model: 'gemini-2.5-flash-image',
          aspect_ratio: '16:9',

          api_key: MOCK_API_KEY
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', 'Bearer invalid-token-12345')
        .send({
          prompts_text: 'Test prompt',
          model: 'gemini-2.5-flash-image',
          aspect_ratio: '16:9',

          api_key: MOCK_API_KEY
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
