/**
 * Integration Tests: Middleware
 * Tests auth and error handling middleware integration
 */

import request from 'supertest';
import app from '../../server';
import { supabaseAdmin } from '../../config/database';

describe('Middleware Integration Tests', () => {
  let testUserToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Use existing E2E test user
    const testEmail = 'e2e-test@masstock.fr';
    const testPassword = 'E2eTest123!@#';

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    const cookies = (loginResponse.headers['set-cookie'] as unknown) as string[];
    const accessTokenCookie = cookies.find((c: string) => c.startsWith('access_token='));
    testUserToken = accessTokenCookie?.split(';')[0].split('=')[1] || '';

    // Get user ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', testEmail)
      .single();

    testUserId = user?.id;
  });

  describe('Authentication Middleware', () => {
    it('should allow authenticated requests with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Cookie', [`access_token=${testUserToken}`]);

      expect(response.status).not.toBe(401);
    });

    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/v1/workflows');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('authorization');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Cookie', ['access_token=invalid_token']);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should accept token from Authorization header as fallback', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).not.toBe(401);
    });
  });

  describe('Error Handler Middleware', () => {
    it('should return 404 with proper error structure for non-existent resources', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/workflows/${fakeId}`)
        .set('Cookie', [`access_token=${testUserToken}`]);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('WORKFLOW_NOT_FOUND');
    });

    it('should return 400 with proper error structure for validation errors', async () => {
      const testWorkflowId = 'f8b20b59-7d06-4599-8413-64da74225b0c';
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Cookie', [`access_token=${testUserToken}`])
        .send({}); // Missing required fields

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
    });

    it('should not expose stack traces in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/workflows/${fakeId}`)
        .set('Cookie', [`access_token=${testUserToken}`]);

      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('details');

      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack traces in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/workflows/${fakeId}`)
        .set('Cookie', [`access_token=${testUserToken}`]);

      expect(response.body).toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Rate Limiting Middleware', () => {
    it('should allow requests within rate limit', async () => {
      const responses = [];

      // Make 5 requests (well within limit of 100/15min)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .get('/api/v1/workflows')
          .set('Cookie', [`access_token=${testUserToken}`]);
        responses.push(response.status);
      }

      // All should succeed
      expect(responses.every(status => status !== 429)).toBe(true);
    });
  });

  describe('Request Logger Middleware', () => {
    it('should log request details for authenticated requests', async () => {
      // This test just ensures the logger doesn't crash the request
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Cookie', [`access_token=${testUserToken}`]);

      expect(response.status).toBeDefined();
      expect([200, 401, 403, 404, 500]).toContain(response.status);
    });
  });

  describe('Middleware Chain Integration', () => {
    it('should execute middleware in correct order', async () => {
      // Request should go through: logger → auth → rate limit → controller → error handler
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Cookie', [`access_token=${testUserToken}`]);

      // If middleware chain is correct, authenticated request should succeed
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should stop chain and return 401 if auth fails', async () => {
      // Auth middleware should stop chain before reaching controller
      const response = await request(app)
        .get('/api/v1/workflows');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
