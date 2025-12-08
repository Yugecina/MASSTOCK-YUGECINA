/**
 * E2E Tests: Authentication Flow
 * Tests the complete authentication flow with real database
 */

import request from 'supertest';
import app from '../../server';
import { setupE2ETest, E2ETestContext } from '../__helpers__/e2e-setup';

describe('Authentication Flow E2E', () => {
  let context: E2ETestContext;

  beforeAll(async () => {
    context = await setupE2ETest();
  });

  afterAll(async () => {
    if (context?.cleanup) {
      await context.cleanup();
    }
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials and set httpOnly cookies', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: context.userEmail,
          password: context.userPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(context.userEmail);

      // Verify httpOnly cookies are set
      const cookies = (response.headers['set-cookie'] as unknown) as string[];
      expect(cookies).toBeDefined();
      expect(cookies.length).toBeGreaterThan(0);

      const accessTokenCookie = cookies.find((c: string) => c.startsWith('access_token='));
      const refreshTokenCookie = cookies.find((c: string) => c.startsWith('refresh_token='));

      expect(accessTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toBeDefined();

      // Verify httpOnly flag is set
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('HttpOnly');
    });

    it('should return 401 with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: context.userEmail,
          password: 'wrong-password',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.status).toBe(401);
    });

    it('should return 400 with missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: context.userEmail,
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Validation');
    });

    it('should return 400 with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Validation');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: context.userEmail,
          password: context.userPassword,
        });

      const cookies = (loginResponse.headers['set-cookie'] as unknown) as string[];
      const refreshTokenCookie = cookies.find((c: string) => c.startsWith('refresh_token='));
      refreshToken = refreshTokenCookie?.split(';')[0].split('=')[1] || '';
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${refreshToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('session');
      expect(response.body.success).toBe(true);

      // Verify new access token cookie is set
      const cookies = (response.headers['set-cookie'] as unknown) as string[];
      const accessTokenCookie = cookies?.find((c: string) => c.startsWith('access_token='));
      expect(accessTokenCookie).toBeDefined();
    });

    it('should return 401 with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.code).toBe('NO_REFRESH_TOKEN');
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', ['refresh_token=invalid-token']);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Login to get access token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: context.userEmail,
          password: context.userPassword,
        });

      const cookies = (loginResponse.headers['set-cookie'] as unknown) as string[];
      const accessTokenCookie = cookies.find((c: string) => c.startsWith('access_token='));
      accessToken = accessTokenCookie?.split(';')[0].split('=')[1] || '';
    });

    it('should logout and clear cookies', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify cookies are cleared
      const cookies = (response.headers['set-cookie'] as unknown) as string[];
      expect(cookies).toBeDefined();

      const accessTokenCookie = cookies?.find((c: string) => c.includes('access_token'));
      const refreshTokenCookie = cookies?.find((c: string) => c.includes('refresh_token'));

      // Cleared cookies should have Max-Age=0 or Expires in the past (Thu, 01 Jan 1970)
      expect(accessTokenCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);
      expect(refreshTokenCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);
    });

    it('should return 401 without access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Protected Route Access', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Login to get access token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: context.userEmail,
          password: context.userPassword,
        });

      const cookies = (loginResponse.headers['set-cookie'] as unknown) as string[];
      const accessTokenCookie = cookies.find((c: string) => c.startsWith('access_token='));
      accessToken = accessTokenCookie?.split(';')[0].split('=')[1] || '';
    });

    it('should access protected route with valid access token', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Cookie', [`access_token=${accessToken}`]);

      // Should not be 401
      expect(response.status).not.toBe(401);
    });

    it('should reject protected route without access token', async () => {
      const response = await request(app)
        .get('/api/v1/workflows');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject protected route with invalid access token', async () => {
      const response = await request(app)
        .get('/api/v1/workflows')
        .set('Cookie', ['access_token=invalid-token']);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
