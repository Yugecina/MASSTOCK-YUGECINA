/**
 * Integration test for authentication persistence
 * Tests the complete flow: login -> cookie -> verify -> logout
 */

import request from 'supertest';
import * as express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import * as authRoutes from '../../routes/authRoutes';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../config/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
  logAuth: jest.fn(),
  logError: jest.fn(),
}));

import {  supabaseAdmin  } from '../../config/database';

// Create test app with same config as main server
const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/auth', authRoutes);

// Add error handler to prevent hanging
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
});

describe('Authentication Persistence Integration Test', () => {
  let accessTokenCookie;
  let refreshTokenCookie;
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Auth Flow', () => {
    it('should complete full auth flow: login -> verify -> logout', async () => {
      // Step 1: Login
      const mockSession = {
        access_token: 'mock-access-token-' + Date.now(),
        refresh_token: 'mock-refresh-token-' + Date.now(),
        expires_at: Date.now() + 900000,
      };

      supabaseAdmin.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'user', ...mockUser },
              error: null,
            }),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { role: 'user', ...mockUser },
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.user).toBeDefined();
      expect(loginResponse.body.user.email).toBe(mockUser.email);

      // Extract cookies from Set-Cookie headers
      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();
      
      accessTokenCookie = cookies.find(c => c.startsWith('access_token='));
      refreshTokenCookie = cookies.find(c => c.startsWith('refresh_token='));
      
      expect(accessTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('HttpOnly');

      // Step 2: Verify authentication with cookies (simulating page refresh)
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const verifyResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [accessTokenCookie, refreshTokenCookie]);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.user).toBeDefined();
      expect(verifyResponse.body.user.email).toBe(mockUser.email);

      // Step 3: Verify fails without cookies
      const failResponse = await request(app)
        .get('/api/v1/auth/me');

      expect(failResponse.status).toBe(401);

      // Step 4: Logout
      supabaseAdmin.auth.signOut.mockResolvedValue({
        error: null,
      });

      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [accessTokenCookie, refreshTokenCookie]);

      expect(logoutResponse.status).toBe(200);
      
      const logoutCookies = logoutResponse.headers['set-cookie'];
      expect(logoutCookies).toBeDefined();
      expect(logoutCookies.some(c => c.includes('access_token=;'))).toBe(true);

      // Step 5: Verify fails after logout
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const afterLogoutResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [accessTokenCookie, refreshTokenCookie]);

      expect(afterLogoutResponse.status).toBe(401);
    });
  });
});
