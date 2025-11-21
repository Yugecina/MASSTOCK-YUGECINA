/**
 * Complete Tests for Auth Controller
 * Testing all authentication endpoints
 */

const authController = require('../../controllers/authController');
const { supabaseAdmin } = require('../../config/database');
const { ApiError } = require('../../middleware/errorHandler');

jest.mock('../../config/database');
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 'user-id', email: 'user@test.com', role: 'user', status: 'active' },
        error: null
      })
    }))
  }))
}));
jest.mock('../../config/logger', () => ({
  logAuth: jest.fn(),
  logAudit: jest.fn(),
  logError: jest.fn(),
  logger: { info: jest.fn(), error: jest.fn() }
}));

describe('AuthController - Complete', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      query: {},
      params: {},
      user: { id: 'user-id', email: 'user@test.com', role: 'user', status: 'active' },
      client: { id: 'client-id', name: 'Test Client' },
      token: 'token123',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0')
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('POST /api/auth/login - login', () => {
    it('should login successfully', async () => {
      req.body = {
        email: 'user@test.com',
        password: 'password123'
      };

      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        expires_in: 3600
      };

      const mockUser = {
        id: 'user-id',
        email: 'user@test.com',
        role: 'user',
        status: 'active'
      };

      const mockClient = {
        id: 'client-id',
        name: 'Test Client'
      };

      supabaseAdmin.auth = {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { session: mockSession, user: mockUser },
          error: null
        })
      };

      supabaseAdmin.from = jest.fn((table) => ({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null })
      }));

      // Mock getCleanAdminClient
      const { createClient } = require('@supabase/supabase-js');
      createClient.mockImplementation(() => ({
        from: jest.fn((table) => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: table === 'users' ? mockUser : mockClient,
            error: null
          }),
          update: jest.fn().mockReturnThis()
        }))
      }));

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            access_token: 'token123',
            refresh_token: 'refresh123'
          })
        })
      );
    });

    it('should require email and password', async () => {
      req.body = { email: 'user@test.com' };

      await expect(authController.login(req, res)).rejects.toMatchObject({
        statusCode: 400,
        code: 'MISSING_CREDENTIALS'
      });
    });

    it('should handle invalid credentials', async () => {
      req.body = {
        email: 'user@test.com',
        password: 'wrong'
      };

      supabaseAdmin.auth = {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid login' }
        })
      };

      await expect(authController.login(req, res)).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS'
      });
    });

    it('should reject suspended accounts', async () => {
      req.body = {
        email: 'user@test.com',
        password: 'password123'
      };

      supabaseAdmin.auth = {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { session: {}, user: { id: 'user-id' } },
          error: null
        })
      };

      // Mock returns suspended user
      const { createClient } = require('@supabase/supabase-js');
      createClient.mockImplementation(() => ({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'user-id', status: 'suspended' },
            error: null
          })
        }))
      }));

      await expect(authController.login(req, res)).rejects.toMatchObject({
        statusCode: 403,
        code: 'ACCOUNT_SUSPENDED'
      });
    });
  });

  describe('POST /api/auth/logout - logout', () => {
    it('should logout successfully', async () => {
      supabaseAdmin.auth = {
        signOut: jest.fn().mockResolvedValue({ error: null })
      };

      supabaseAdmin.from = jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null })
      }));

      await authController.logout(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logged out successfully'
        })
      );
    });

    it('should handle logout errors gracefully', async () => {
      supabaseAdmin.auth = {
        signOut: jest.fn().mockResolvedValue({
          error: { message: 'Logout failed' }
        })
      };

      supabaseAdmin.from = jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null })
      }));

      await authController.logout(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('POST /api/auth/refresh - refreshToken', () => {
    it('should refresh token successfully', async () => {
      req.body = { refresh_token: 'refresh123' };

      const mockSession = {
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expires_in: 3600
      };

      supabaseAdmin.auth = {
        refreshSession: jest.fn().mockResolvedValue({
          data: { session: mockSession, user: { id: 'user-id' } },
          error: null
        })
      };

      await authController.refreshToken(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            access_token: 'new-token'
          })
        })
      );
    });

    it('should require refresh token', async () => {
      req.body = {};

      await expect(authController.refreshToken(req, res)).rejects.toMatchObject({
        statusCode: 400,
        code: 'MISSING_REFRESH_TOKEN'
      });
    });

    it('should reject invalid refresh token', async () => {
      req.body = { refresh_token: 'invalid' };

      supabaseAdmin.auth = {
        refreshSession: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid token' }
        })
      };

      await expect(authController.refreshToken(req, res)).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN'
      });
    });
  });

  describe('GET /api/auth/me - getMe', () => {
    it('should return current user profile', async () => {
      req.user = {
        id: 'user-id',
        email: 'user@test.com',
        role: 'user',
        status: 'active',
        created_at: '2024-01-01',
        last_login: '2024-01-02'
      };

      req.client = {
        id: 'client-id',
        name: 'Test Client',
        email: 'client@test.com',
        plan: 'pro'
      };

      await authController.getMe(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: 'user-id',
              email: 'user@test.com'
            }),
            client: expect.objectContaining({
              id: 'client-id',
              name: 'Test Client'
            })
          })
        })
      );
    });

    it('should return user without client', async () => {
      req.client = null;

      await authController.getMe(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.client).toBeNull();
    });
  });

  describe('POST /api/auth/register - register', () => {
    it('should register new user', async () => {
      req.body = {
        email: 'new@test.com',
        password: 'password123',
        name: 'New User',
        company_name: 'New Corp'
      };

      const mockAuthUser = { id: 'new-user-id' };
      const mockUser = {
        id: 'new-user-id',
        email: 'new@test.com',
        role: 'user',
        status: 'active'
      };
      const mockClient = {
        id: 'new-client-id',
        name: 'New Corp',
        email: 'new@test.com',
        plan: 'premium_custom',
        status: 'active'
      };

      supabaseAdmin.auth = {
        admin: {
          createUser: jest.fn().mockResolvedValue({
            data: { user: mockAuthUser },
            error: null
          })
        }
      };

      let callCount = 0;
      supabaseAdmin.from = jest.fn((table) => {
        if (table === 'users') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
          };
        }
        if (table === 'clients') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockClient, error: null })
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null })
          };
        }
      });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.any(Object),
            client: expect.any(Object)
          })
        })
      );
    });

    it('should require email and password', async () => {
      req.body = { email: 'test@test.com' };

      await expect(authController.register(req, res)).rejects.toMatchObject({
        statusCode: 400,
        code: 'MISSING_CREDENTIALS'
      });
    });

    it('should handle auth creation failure', async () => {
      req.body = {
        email: 'new@test.com',
        password: 'password123'
      };

      supabaseAdmin.auth = {
        admin: {
          createUser: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Email already exists' }
          })
        }
      };

      await expect(authController.register(req, res)).rejects.toMatchObject({
        statusCode: 400,
        code: 'REGISTRATION_FAILED'
      });
    });
  });
});
