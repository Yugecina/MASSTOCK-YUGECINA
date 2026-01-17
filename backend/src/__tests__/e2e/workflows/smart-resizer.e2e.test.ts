import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';

/**
 * E2E Tests for Smart Resizer Workflow
 *
 * Tests complete workflow execution from API call to multi-format image resizing
 * using actual OCR analysis and AI-powered content adaptation.
 *
 * Prerequisites:
 * - Backend server running on localhost:3000
 * - Worker process running
 * - Valid authentication token
 * - Test image files available
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const WORKFLOW_ID = '32cb03e3-39e8-4cc9-8d21-525324cc8544'; // Smart Resizer
const TEST_TIMEOUT = 240000; // 4 minutes

describe('Smart Resizer E2E Tests', () => {
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
    console.log('🔐 Authenticated for Smart Resizer tests');
  });

  describe('Single Format Resize', () => {
    it('should resize image to Instagram Square format', async () => {
      const testImagePath = path.join(__dirname, '../../fixtures/test-image.jpg');

      if (!fs.existsSync(testImagePath)) {
        console.warn('⚠️ Test image not found, skipping test');
        return;
      }

      console.log('🚀 Starting Smart Resizer - Instagram Square');

      const response = await request(API_URL)
        .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
        .set('Cookie', authCookies)
        .field('formats', JSON.stringify(['instagram-square']))
        .attach('master_image', testImagePath);

      console.log('📦 Response:', response.status, response.body);

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);

      const executionId = response.body.data.execution_id;
      console.log(`✅ Execution started: ${executionId}`);

      // Poll for completion
      let completed = false;
      let attempts = 0;

      while (!completed && attempts < 80) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;

        const statusResponse = await request(API_URL)
          .get(`/api/v1/executions/${executionId}`)
          .set('Cookie', authCookies);

        console.log(`🔍 Attempt ${attempts}/80 - Status: ${statusResponse.body.data?.status}`);

        if (statusResponse.body.data?.status === 'completed') {
          completed = true;
          console.log('✅ Single format resize completed');

          // Get batch results
          const batchResponse = await request(API_URL)
            .get(`/api/v1/workflows/executions/${executionId}/batch-results`)
            .set('Cookie', authCookies);

          expect(batchResponse.status).toBe(200);
          expect(batchResponse.body.data.results).toBeDefined();
          expect(batchResponse.body.data.results.length).toBe(1);
          expect(batchResponse.body.data.results[0].result_url).toBeDefined();
        } else if (statusResponse.body.data?.status === 'failed') {
          throw new Error(`Resize failed: ${statusResponse.body.data.error_message}`);
        }
      }

      expect(completed).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('Multi-Format Resize', () => {
    it('should resize image to multiple Meta formats', async () => {
      const testImagePath = path.join(__dirname, '../../fixtures/test-image.jpg');

      if (!fs.existsSync(testImagePath)) {
        console.warn('⚠️ Test image not found, skipping test');
        return;
      }

      console.log('🚀 Starting Smart Resizer - Multi-format (Meta)');

      const formats = [
        'instagram-square',
        'instagram-story',
        'facebook-post',
        'facebook-story'
      ];

      const response = await request(API_URL)
        .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
        .set('Cookie', authCookies)
        .field('formats', JSON.stringify(formats))
        .attach('master_image', testImagePath);

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);

      const executionId = response.body.data.execution_id;
      console.log(`✅ Multi-format execution started: ${executionId}`);

      // Poll for completion
      let completed = false;
      let attempts = 0;

      while (!completed && attempts < 80) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;

        const statusResponse = await request(API_URL)
          .get(`/api/v1/executions/${executionId}`)
          .set('Cookie', authCookies);

        console.log(`🔍 Attempt ${attempts}/80 - Status: ${statusResponse.body.data?.status}`);

        if (statusResponse.body.data?.status === 'completed') {
          completed = true;
          console.log('✅ Multi-format resize completed');

          // Get batch results
          const batchResponse = await request(API_URL)
            .get(`/api/v1/workflows/executions/${executionId}/batch-results`)
            .set('Cookie', authCookies);

          expect(batchResponse.status).toBe(200);
          expect(batchResponse.body.data.results).toBeDefined();
          expect(batchResponse.body.data.results.length).toBe(4);

          console.log('📦 Batch results:', batchResponse.body.data.results.length, 'images');
        } else if (statusResponse.body.data?.status === 'failed') {
          throw new Error(`Multi-resize failed: ${statusResponse.body.data.error_message}`);
        }
      }

      expect(completed).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('Error Handling', () => {
    it('should reject empty formats array', async () => {
      const testImagePath = path.join(__dirname, '../../fixtures/test-image.jpg');

      if (!fs.existsSync(testImagePath)) {
        console.warn('⚠️ Test image not found, skipping test');
        return;
      }

      const response = await request(API_URL)
        .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
        .set('Cookie', authCookies)
        .field('formats', JSON.stringify([]))
        .attach('master_image', testImagePath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid format name', async () => {
      const testImagePath = path.join(__dirname, '../../fixtures/test-image.jpg');

      if (!fs.existsSync(testImagePath)) {
        console.warn('⚠️ Test image not found, skipping test');
        return;
      }

      const response = await request(API_URL)
        .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
        .set('Cookie', authCookies)
        .field('formats', JSON.stringify(['invalid-format']))
        .attach('master_image', testImagePath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing image file', async () => {
      const response = await request(API_URL)
        .post(`/api/v1/workflows/${WORKFLOW_ID}/execute`)
        .set('Cookie', authCookies)
        .field('formats', JSON.stringify(['instagram-square']));

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
