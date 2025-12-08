import request from 'supertest';
import * as express from 'express';
import cookieParser from 'cookie-parser';
import * as authRoutes from '../../routes/authRoutes';
import {  supabaseAdmin  } from '../../config/database';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../config/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRoutes);

describe('Auth Persistence Flow', () => {
  let mockAccessToken;
  let mockRefreshToken;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = 'mock-access-token-' + Date.now();
    mockRefreshToken = 'mock-refresh-token-' + Date.now();
  });

  describe('POST /auth/login - Cookie Setting', () => {
    it('should set httpOnly cookies on successful login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockSession = {
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
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
          }),
        }),
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
      
      // Check that cookies are set
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.includes('access_token'))).toBe(true);
      expect(cookies.some(cookie => cookie.includes('refresh_token'))).toBe(true);
      expect(cookies.some(cookie => cookie.includes('HttpOnly'))).toBe(true);
    });
  });

  describe('GET /auth/me - Cookie Authentication', () => {
    it('should authenticate user with cookie', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      // Mock Supabase auth verification
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      });

      const response = await request(app)
        .get('/auth/me')
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(mockUser.email);
    });

    it('should return 401 without valid cookie', async () => {
      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const response = await request(app)
        .get('/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/logout - Cookie Clearing', () => {
    it('should clear cookies on logout', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      supabaseAdmin.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'user', ...mockUser },
              error: null,
            }),
          }),
        }),
      });

      supabaseAdmin.auth.signOut.mockResolvedValue({
        error: null,
      });

      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
      
      // Check that cookies are cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.includes('access_token=;'))).toBe(true);
      expect(cookies.some(cookie => cookie.includes('refresh_token=;'))).toBe(true);
    });
  });
});
