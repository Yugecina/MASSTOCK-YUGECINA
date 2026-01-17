import request from 'supertest';
import express from 'express';

/**
 * E2E Tests for Image Factory Workflow
 *
 * Tests complete workflow execution from API call to batch image generation
 * using actual Gemini API and Redis job queue.
 *
 * Prerequisites:
 * - Backend server running on localhost:3000
 * - Worker process running
 * - Valid authentication token
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const WORKFLOW_ID = 'f8b20b59-7d06-4599-8413-64da74225b0c'; // Image Factory
const TEST_TIMEOUT = 300000; // 5 minutes for batch processing

describe('Image Factory E2E Tests', () => {
  let authCookies: string[];

  beforeAll(async () => {
    const loginResponse = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({
        email: process.env.TEST_USER_EMAIL || 'admin@masstock.com',
        password: process.env.TEST_USER_PASSWORD || 'Admin123123'
      });

    expect(loginResponse.status).toBe(200);
    authCookies = (loginResponse.headers['set-cookie'] as unknown) as string[];
    console.log('🔐 Authenticated for Image Factory tests');
  });

  describe('Single Image Generation', () => {
    it('should generate single image from prompt', async () => {
      console.log('🚀 Starting Image Factory single generation');

      const response = await request(API_URL)
        .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
        .set('Cookie', authCookies)
        .send({
          prompts: ['A serene mountain landscape at sunset with golden light'],
          count: 1
        });

      console.log('📦 Response:', response.status, response.body);

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.data.execution_id).toBeDefined();

      const executionId = response.body.data.execution_id;
      console.log(`✅ Execution started: ${executionId}`);

      // Poll for completion
      let completed = false;
      let attempts = 0;
      const maxAttempts = 100; // 5 minutes max

      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;

        const statusResponse = await request(API_URL)
          .get(`/api/v1/executions/${executionId}`)
          .set('Cookie', authCookies);

        console.log(`🔍 Attempt ${attempts}/${maxAttempts} - Status: ${statusResponse.body.data?.status}`);

        if (statusResponse.body.data?.status === 'completed') {
          completed = true;
          console.log('✅ Single image generation completed');

          // Get batch results
          const batchResponse = await request(API_URL)
            .get(`/api/v1/workflows/executions/${executionId}/batch-results`)
            .set('Cookie', authCookies);

          console.log('📦 Batch results:', JSON.stringify(batchResponse.body, null, 2));

          expect(batchResponse.status).toBe(200);
          expect(batchResponse.body.data.results).toBeDefined();
          expect(batchResponse.body.data.results.length).toBe(1);
          expect(batchResponse.body.data.results[0].result_url).toBeDefined();
        } else if (statusResponse.body.data?.status === 'failed') {
          console.error('❌ Execution failed:', statusResponse.body.data.error_message);
          throw new Error(`Workflow failed: ${statusResponse.body.data.error_message}`);
        }
      }

      expect(completed).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('Batch Generation', () => {
    it('should generate batch of 5 images from multiple prompts', async () => {
      console.log('🚀 Starting Image Factory batch generation (5 images)');

      const prompts = [
        'A modern office workspace with natural lighting',
        'A cozy bedroom with minimalist design',
        'A vibrant kitchen with colorful accents',
        'A peaceful garden with blooming flowers',
        'An elegant living room with contemporary furniture'
      ];

      const response = await request(API_URL)
        .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
        .set('Cookie', authCookies)
        .send({
          prompts,
          count: prompts.length
        });

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);

      const executionId = response.body.data.execution_id;
      console.log(`✅ Batch execution started: ${executionId}`);

      // Poll for completion
      let completed = false;
      let attempts = 0;

      while (!completed && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;

        const statusResponse = await request(API_URL)
          .get(`/api/v1/executions/${executionId}`)
          .set('Cookie', authCookies);

        console.log(`🔍 Attempt ${attempts}/100 - Status: ${statusResponse.body.data?.status}`);

        if (statusResponse.body.data?.status === 'completed') {
          completed = true;
          console.log('✅ Batch generation completed');

          // Get batch results
          const batchResponse = await request(API_URL)
            .get(`/api/v1/workflows/executions/${executionId}/batch-results`)
            .set('Cookie', authCookies);

          expect(batchResponse.status).toBe(200);
          expect(batchResponse.body.data.results).toBeDefined();
          expect(batchResponse.body.data.results.length).toBe(5);

          console.log(`📦 Generated ${batchResponse.body.data.results.length} images`);
        } else if (statusResponse.body.data?.status === 'failed') {
          throw new Error(`Batch workflow failed: ${statusResponse.body.data.error_message}`);
        }
      }

      expect(completed).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('Error Handling', () => {
    it('should reject empty prompts array', async () => {
      const response = await request(API_URL)
        .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
        .set('Cookie', authCookies)
        .send({
          prompts: [],
          count: 0
        });

      console.log('📦 Empty prompts response:', response.status, response.body);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid count parameter', async () => {
      const response = await request(API_URL)
        .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
        .set('Cookie', authCookies)
        .send({
          prompts: ['Test prompt'],
          count: -1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject count exceeding limit (10000)', async () => {
      const response = await request(API_URL)
        .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
        .set('Cookie', authCookies)
        .send({
          prompts: ['Test prompt'],
          count: 10001
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
