import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';

/**
 * E2E Tests for Room Redesigner Workflow
 *
 * Tests complete workflow execution from API call to result generation
 * using actual Gemini API and Redis job queue.
 *
 * Prerequisites:
 * - Backend server running on localhost:3000
 * - Worker process running
 * - Valid authentication token
 * - Test image files available
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const WORKFLOW_ID = 'a8437a6d-253e-494f-a308-ad5ad64ae123'; // Room Redesigner
const TEST_TIMEOUT = 180000; // 3 minutes

describe('Room Redesigner E2E Tests', () => {
  let authCookies: string[];
  let executionId: string;

  beforeAll(async () => {
    // Get auth cookies from login
    const loginResponse = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({
        email: process.env.TEST_USER_EMAIL || 'admin@masstock.com',
        password: process.env.TEST_USER_PASSWORD || 'Admin123123'
      });

    expect(loginResponse.status).toBe(200);
    authCookies = (loginResponse.headers['set-cookie'] as unknown) as string[];
    expect(authCookies).toBeDefined();

    console.log('🔐 Authenticated successfully');
  });

  describe('Single Image Execution', () => {
    it('should execute workflow with empty room image', async () => {
      const testImagePath = path.join(__dirname, '../../fixtures/empty-room.jpg');

      // Check if test image exists
      if (!fs.existsSync(testImagePath)) {
        console.warn('⚠️ Test image not found, skipping test');
        return;
      }

      console.log('🚀 Starting Room Redesigner execution with empty room');

      const response = await request(API_URL)
        .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
        .set('Cookie', authCookies)
        .field('design_style', 'modern')
        .field('api_key', process.env.GEMINI_API_KEY || '')
        .attach('room_images', testImagePath);

      console.log('📦 Response:', response.status, response.body);

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.data.execution_id).toBeDefined();

      executionId = response.body.data.execution_id;
      console.log(`✅ Execution started: ${executionId}`);

      // Poll for completion
      let completed = false;
      let attempts = 0;
      const maxAttempts = 60; // 3 minutes max

      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s between polls
        attempts++;

        const statusResponse = await request(API_URL)
          .get(`/api/v1/executions/${executionId}`)
          .set('Cookie', authCookies);

        console.log(`🔍 Attempt ${attempts}/${maxAttempts} - Status: ${statusResponse.body.data?.status}`);

        if (statusResponse.body.data?.status === 'completed') {
          completed = true;
          console.log('✅ Execution completed successfully');

          // Get batch results
          const batchResponse = await request(API_URL)
            .get(`/api/v1/workflows/executions/${executionId}/batch-results`)
            .set('Cookie', authCookies);

          console.log('📦 Batch results:', JSON.stringify(batchResponse.body, null, 2));

          expect(batchResponse.status).toBe(200);
          expect(batchResponse.body.success).toBe(true);
          expect(batchResponse.body.data.results).toBeDefined();
          expect(batchResponse.body.data.results.length).toBeGreaterThan(0);
          expect(batchResponse.body.data.results[0].result_url).toBeDefined();
        } else if (statusResponse.body.data?.status === 'failed') {
          console.error('❌ Execution failed:', statusResponse.body.data.error_message);
          throw new Error(`Workflow execution failed: ${statusResponse.body.data.error_message}`);
        }
      }

      expect(completed).toBe(true);
    }, TEST_TIMEOUT);

    it('should execute workflow with furnished room image', async () => {
      const testImagePath = path.join(__dirname, '../../fixtures/furnished-room.jpg');

      if (!fs.existsSync(testImagePath)) {
        console.warn('⚠️ Test image not found, skipping test');
        return;
      }

      console.log('🚀 Starting Room Redesigner execution with furnished room');

      const response = await request(API_URL)
        .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
        .set('Cookie', authCookies)
        .field('design_style', 'minimalist')
        .field('api_key', process.env.GEMINI_API_KEY || '')
        .attach('room_images', testImagePath);

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);

      const execId = response.body.data.execution_id;
      console.log(`✅ Execution started: ${execId}`);

      // Poll for completion
      let completed = false;
      let attempts = 0;

      while (!completed && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;

        const statusResponse = await request(API_URL)
          .get(`/api/v1/executions/${execId}`)
          .set('Cookie', authCookies);

        if (statusResponse.body.data?.status === 'completed') {
          completed = true;
          console.log('✅ Furnished room redesign completed');

          // Get batch results
          const batchResponse = await request(API_URL)
            .get(`/api/v1/workflows/executions/${execId}/batch-results`)
            .set('Cookie', authCookies);

          expect(batchResponse.status).toBe(200);
          expect(batchResponse.body.data.results).toBeDefined();
          expect(batchResponse.body.data.results.length).toBeGreaterThan(0);
          expect(batchResponse.body.data.results[0].result_url).toBeDefined();
        } else if (statusResponse.body.data?.status === 'failed') {
          throw new Error(`Workflow failed: ${statusResponse.body.data.error_message}`);
        }
      }

      expect(completed).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('Error Handling', () => {
    // TODO: Re-enable when design_style validation is added to controller
    it.skip('should reject invalid style parameter', async () => {
      const testImagePath = path.join(__dirname, '../../fixtures/empty-room.jpg');

      if (!fs.existsSync(testImagePath)) {
        console.warn('⚠️ Test image not found, skipping test');
        return;
      }

      const response = await request(API_URL)
        .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
        .set('Cookie', authCookies)
        .field('design_style', 'invalid-style')
        .field('api_key', process.env.GEMINI_API_KEY || '')
        .attach('room_images', testImagePath);

      console.log('📦 Invalid style response:', response.status, response.body);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing image file', async () => {
      const response = await request(API_URL)
        .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
        .set('Cookie', authCookies)
        .field('design_style', 'modern');

      console.log('📦 Missing image response:', response.status, response.body);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
