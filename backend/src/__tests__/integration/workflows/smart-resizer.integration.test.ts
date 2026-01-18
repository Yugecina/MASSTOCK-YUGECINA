/**
 * Integration tests for Smart Resizer workflow (MOCKED)
 * Tests API → Worker flow with mocked dependencies
 */

// Mock services BEFORE imports
jest.mock('../../../services/vertexAIImageService');
jest.mock('../../../services/smartResizerService');

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { smartResizerFixtures } from '../../__helpers__/workflow-fixtures';
import {
  waitForJobCompletion,
  cleanupTestData,
  verifyExecutionMetadata,
  getBatchResults
} from '../../__helpers__/workflow-test-helpers';

// Import app
let app: any;

const supabaseAdmin: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Smart Resizer Workflow - Integration Tests (Mocked)', () => {
  let authToken: string;
  let executionId: string;
  let testWorkflowId: string;

  beforeAll(async () => {
    // Import app after mocks are set up
    const serverModule = await import('../../../server');
    app = serverModule.default;

    // Find Smart Resizer workflow
    const { data: workflows } = await supabaseAdmin
      .from('workflows')
      .select('id')
      .eq('client_id', 'f14a2f20-f81f-4d8b-93ec-96d6e59cff06')
      .ilike('name', '%Smart Resizer%')
      .limit(1);

    if (workflows && workflows.length > 0) {
      testWorkflowId = workflows[0].id;
    } else {
      throw new Error('Smart Resizer workflow not found in database');
    }
  });

  beforeEach(async () => {
    // Login
    const testEmail = 'dev@masstock.com';
    const testPassword = 'DevPassword123!';

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    const cookies = loginResponse.headers['set-cookie'];
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    const accessTokenCookie = cookieArray.find((cookie: string) => 
      cookie.startsWith('access_token=')
    );

    if (accessTokenCookie) {
      authToken = accessTokenCookie.split(';')[0].split('=')[1];
    }
  });

  afterEach(async () => {
    if (executionId) {
      await cleanupTestData(executionId);
    }
  });

  describe('Valid Cases', () => {
    it('should resize single image to multiple formats', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(smartResizerFixtures.singleImageMultipleFormats);

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('execution_id');

      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId);
      expect(completion.status).toBe('completed');

      // Verify batch results (3 formats)
      const batchResults = await getBatchResults(executionId);
      expect(batchResults.length).toBeGreaterThan(0);
    });

    it('should handle multiple images with AI regeneration', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(smartResizerFixtures.multipleImagesWithAI);

      expect(response.status).toBe(202);
      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId);
      expect(completion.status).toBe('completed');
    });

    it('should process all supported formats', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(smartResizerFixtures.allFormats);

      expect(response.status).toBe(202);
      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId, 60000);
      expect(completion.status).toBe('completed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty batch gracefully', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(smartResizerFixtures.emptyBatch);

      expect(response.status).toBe(400);
    });

    it('should handle large batch (50 images)', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(smartResizerFixtures.largeImageBatch);

      expect(response.status).toBe(202);
      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId, 120000);
      expect(completion.status).toBe('completed');
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid format', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(smartResizerFixtures.invalidFormat);

      expect(response.status).toBe(400);
    });

    it('should reject invalid base64', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(smartResizerFixtures.invalidBase64);

      expect(response.status).toBe(400);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .send(smartResizerFixtures.singleImageMultipleFormats);

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', 'Bearer invalid-token-12345')
        .send(smartResizerFixtures.singleImageMultipleFormats);

      expect(response.status).toBe(401);
    });
  });
});
