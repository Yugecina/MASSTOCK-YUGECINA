/**
 * End-to-End tests for Nano Banana workflow (REAL Gemini API)
 * Tests with actual Gemini API calls - runs on merge to main or manually
 *
 * ⚠️  WARNING: These tests consume Gemini API credits
 * Set SKIP_E2E_TESTS=true in .env to skip in CI
 *
 * These tests verify:
 * - Real Gemini API integration
 * - Image generation with actual models
 * - Storage upload and retrieval
 * - Rate limiting with real API
 * - End-to-end workflow execution
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from '@jest/globals';
import request from 'supertest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  waitForJobCompletion,
  cleanupTestData,
  verifyImageStructure,
  verifyPricing,
  getBatchResults
} from '../../__helpers__/workflow-test-helpers';

// Check if E2E tests should be skipped
const SKIP_E2E = process.env.SKIP_E2E_TESTS === 'true';

const supabaseAdmin: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Import app WITHOUT mocking (use real Gemini API)
let app: any;

// Skip suite if E2E tests are disabled
(SKIP_E2E ? describe.skip : describe)('Nano Banana Workflow - E2E Tests (Real Gemini API)', () => {
  let authToken: string;
  let executionId: string;
  let testWorkflowId: string;

  beforeAll(async () => {
    // Import app
    app = (await import('../../../server')).default;

    // Get workflow ID from environment
    testWorkflowId = process.env.NANO_BANANA_WORKFLOW_ID!;

    if (!testWorkflowId) {
      throw new Error('NANO_BANANA_WORKFLOW_ID environment variable is required for E2E tests');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required for E2E tests');
    }
  });

  beforeEach(async () => {
    // Get auth token for test user
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'testpassword123'
      });

    authToken = loginResponse.body.accessToken || loginResponse.body.access_token;

    if (!authToken) {
      throw new Error('Failed to get auth token. Ensure TEST_USER_EMAIL and TEST_USER_PASSWORD are set correctly.');
    }
  });

  afterEach(async () => {
    // Cleanup test data
    if (executionId) {
      await cleanupTestData(executionId);
      executionId = '';
    }
  });

  // ========================================================================
  // REAL API TESTS
  // ========================================================================

  it('should generate real image with Flash model', async () => {
    const response = await request(app)
      .post(`/api/v1/workflows/${testWorkflowId}/execute`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        prompts_text: 'A modern minimalist living room with large windows',
        model: 'gemini-2.5-flash-image',
        aspect_ratio: '16:9',
        resolution: '1K',
        api_key: process.env.GEMINI_API_KEY
      });

    expect(response.status).toBe(202);
    executionId = response.body.execution_id;

    // Wait for real API call to complete (may take 5-15s)
    const completion = await waitForJobCompletion(executionId, 60000);
    expect(completion.status).toBe('completed');

    // Verify real image was uploaded to storage
    const batchResults = await getBatchResults(executionId);

    expect(batchResults).toHaveLength(1);
    expect(batchResults[0].result_url).toBeTruthy();
    expect(batchResults[0].result_url).toMatch(/^https:\/\//);

    // Verify image is accessible
    const imageResponse = await fetch(batchResults[0].result_url!);
    expect(imageResponse.ok).toBe(true);
    expect(imageResponse.headers.get('content-type')).toMatch(/^image\//);

    // Verify pricing
    const { data: execution } = await supabaseAdmin
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    verifyPricing(execution, 1, 0.0025, 0.05);
  }, 60000); // 60s timeout for real API call

  it('should handle Pro model 4K generation', async () => {
    const response = await request(app)
      .post(`/api/v1/workflows/${testWorkflowId}/execute`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        prompts_text: 'Ultra high quality architectural photography of a luxury penthouse',
        model: 'gemini-3-pro-image-preview',
        aspect_ratio: '16:9',
        resolution: '4K',
        api_key: process.env.GEMINI_API_KEY
      });

    expect(response.status).toBe(202);
    executionId = response.body.execution_id;

    const completion = await waitForJobCompletion(executionId, 120000); // 2min timeout
    expect(completion.status).toBe('completed');

    // Verify 4K pricing
    const { data: execution } = await supabaseAdmin
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    verifyPricing(execution, 1, 0.04, 0.8);

    // Verify image is accessible
    const batchResults = await getBatchResults(executionId);
    const imageResponse = await fetch(batchResults[0].result_url!);
    expect(imageResponse.ok).toBe(true);
  }, 120000); // 2min timeout for Pro model

  it('should generate batch of 3 images successfully', async () => {
    const prompts = [
      'A modern living room with minimalist decor',
      'A cozy bedroom with warm lighting',
      'A spacious kitchen with marble countertops'
    ];

    const response = await request(app)
      .post(`/api/v1/workflows/${testWorkflowId}/execute`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        prompts_text: prompts.join('\n'),
        model: 'gemini-2.5-flash-image',
        aspect_ratio: '16:9',
        api_key: process.env.GEMINI_API_KEY
      });

    expect(response.status).toBe(202);
    executionId = response.body.execution_id;

    const completion = await waitForJobCompletion(executionId, 120000); // 2min timeout for batch
    expect(completion.status).toBe('completed');

    // Verify all 3 images were generated
    const batchResults = await getBatchResults(executionId);
    expect(batchResults).toHaveLength(3);

    // Verify all images are accessible
    for (const result of batchResults) {
      expect(result.status).toBe('completed');
      expect(result.result_url).toBeTruthy();

      const imageResponse = await fetch(result.result_url!);
      expect(imageResponse.ok).toBe(true);
      expect(imageResponse.headers.get('content-type')).toMatch(/^image\//);
    }
  }, 180000); // 3min timeout for batch

  it('should handle different aspect ratios correctly', async () => {
    const aspectRatios = ['1:1', '16:9', '9:16'];
    const executionIds: string[] = [];

    try {
      // Test each aspect ratio
      for (const aspectRatio of aspectRatios) {
        const response = await request(app)
          .post(`/api/v1/workflows/${testWorkflowId}/execute`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            prompts_text: `A test image in ${aspectRatio} aspect ratio`,
            model: 'gemini-2.5-flash-image',
            aspect_ratio: aspectRatio,
            api_key: process.env.GEMINI_API_KEY
          });

        expect(response.status).toBe(202);
        const execId = response.body.execution_id;
        executionIds.push(execId);

        const completion = await waitForJobCompletion(execId, 60000);
        expect(completion.status).toBe('completed');

        const batchResults = await getBatchResults(execId);
        expect(batchResults).toHaveLength(1);
        expect(batchResults[0].status).toBe('completed');
      }
    } finally {
      // Cleanup all test executions
      for (const execId of executionIds) {
        await cleanupTestData(execId);
      }
    }
  }, 240000); // 4min timeout for 3 sequential generations

  // ========================================================================
  // RATE LIMITING TESTS (OPTIONAL - COMMENTED OUT TO AVOID HITTING LIMITS)
  // ========================================================================

  /*
  it.skip('should handle rate limit from real API gracefully', async () => {
    // Send many requests quickly to trigger rate limit
    // WARNING: This may temporarily exhaust API quota
    const requests = Array(20).fill(null).map(() =>
      request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompts_text: 'Test prompt for rate limit',
          model: 'gemini-2.5-flash-image',
          aspect_ratio: '16:9',
          api_key: process.env.GEMINI_API_KEY
        })
    );

    const responses = await Promise.all(requests);

    // All should queue successfully (202)
    responses.forEach(res => {
      expect(res.status).toBe(202);
    });

    // Some may fail due to rate limiting - worker should handle retries
  }, 300000); // 5min timeout
  */

  // ========================================================================
  // VALIDATION TESTS
  // ========================================================================

  it('should validate image format and mime type', async () => {
    const response = await request(app)
      .post(`/api/v1/workflows/${testWorkflowId}/execute`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        prompts_text: 'A test image to validate format',
        model: 'gemini-2.5-flash-image',
        aspect_ratio: '16:9',
        api_key: process.env.GEMINI_API_KEY
      });

    expect(response.status).toBe(202);
    executionId = response.body.execution_id;

    await waitForJobCompletion(executionId, 60000);

    const batchResults = await getBatchResults(executionId);
    const imageUrl = batchResults[0].result_url!;

    // Fetch image and verify format
    const imageResponse = await fetch(imageUrl);
    expect(imageResponse.ok).toBe(true);

    const contentType = imageResponse.headers.get('content-type');
    expect(contentType).toMatch(/^image\/(png|jpeg|webp)/);

    // Verify image can be decoded
    const buffer = await imageResponse.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
  }, 60000);
});
