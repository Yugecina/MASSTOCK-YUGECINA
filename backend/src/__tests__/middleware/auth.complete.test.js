/**
 * Complete Tests for Auth Middleware
 * Testing JWT verification and authorization
 */

const { authenticate, requireAdmin, requireClient, optionalAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../config/database');

jest.mock('../../config/database');
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 'user-id', email: 'user@test.com', role: 'user', status: 'active' },
        error: null
      }),
      update: jest.fn().mockReturnThis()
    }))
  }))
}));
jest.mock('../../config/logger', () => ({
  logAuth: jest.fn(),
  logError: jest.fn(),
  logger: { info: jest.fn(), error: jest.fn() }
}));

describe('Auth Middleware - Complete', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      headers: {},
      body: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0')
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate valid token', async () => {
      req.headers.authorization = 'Bearer valid-token';

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
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      };

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

      await authenticate(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(req.client).toEqual(mockClient);
      expect(next).toHaveBeenCalled();
    });

    it('should reject missing authorization header', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'UNAUTHORIZED'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token format', async () => {
      req.headers.authorization = 'InvalidFormat token123';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'UNAUTHORIZED'
        })
      );
    });

    it('should reject expired token', async () => {
      req.headers.authorization = 'Bearer expired-token';

      supabaseAdmin.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Token expired' }
        })
      };

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_TOKEN'
        })
      );
    });

    it('should reject suspended users', async () => {
      req.headers.authorization = 'Bearer valid-token';

      supabaseAdmin.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-id' } },
          error: null
        })
      };

      const { createClient } = require('@supabase/supabase-js');
      createClient.mockImplementation(() => ({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'user-id', status: 'suspended' },
            error: null
          }),
          update: jest.fn().mockReturnThis()
        }))
      }));

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'ACCOUNT_SUSPENDED'
        })
      );
    });

    it('should reject deleted users', async () => {
      req.headers.authorization = 'Bearer valid-token';

      supabaseAdmin.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-id' } },
          error: null
        })
      };

      const { createClient } = require('@supabase/supabase-js');
      createClient.mockImplementation(() => ({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'user-id', status: 'deleted' },
            error: null
          }),
          update: jest.fn().mockReturnThis()
        }))
      }));

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'ACCOUNT_DELETED'
        })
      );
    });

    it('should handle user not found in database', async () => {
      req.headers.authorization = 'Bearer valid-token';

      supabaseAdmin.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-id' } },
          error: null
        })
      };

      const { createClient } = require('@supabase/supabase-js');
      createClient.mockImplementation(() => ({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' }
          }),
          update: jest.fn().mockReturnThis()
        }))
      }));

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'USER_NOT_FOUND'
        })
      );
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin users', () => {
      req.user = { id: 'admin-id', role: 'admin' };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject non-admin users', () => {
      req.user = { id: 'user-id', role: 'user' };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'FORBIDDEN'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', () => {
      req.user = null;

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'UNAUTHORIZED'
        })
      );
    });
  });

  describe('requireClient', () => {
    it('should allow users with active client', () => {
      req.client = { id: 'client-id', status: 'active' };

      requireClient(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject users without client', () => {
      req.client = null;

      requireClient(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'NO_CLIENT_ACCOUNT'
        })
      );
    });

    it('should reject inactive clients', () => {
      req.client = { id: 'client-id', status: 'suspended' };

      requireClient(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'CLIENT_NOT_ACTIVE'
        })
      );
    });
  });

  describe('optionalAuth', () => {
    it('should continue without token', async () => {
      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should authenticate if token provided', async () => {
      req.headers.authorization = 'Bearer valid-token';

      supabaseAdmin.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-id' } },
          error: null
        })
      };

      const { createClient } = require('@supabase/supabase-js');
      createClient.mockImplementation(() => ({
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'user-id', status: 'active' },
            error: null
          }),
          update: jest.fn().mockReturnThis()
        }))
      }));

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should continue even if authentication fails', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      supabaseAdmin.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid token' }
        })
      };

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
