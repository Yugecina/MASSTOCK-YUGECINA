/**
 * Tests for Admin User Controller
 * Testing user/client management endpoints
 *
 * Tests follow TDD approach:
 * - Test all CRUD operations
 * - Test pagination and filtering
 * - Test search functionality
 * - Test validation
 * - Test authorization
 * - Test audit logging
 */

const adminUserController = require('../../controllers/adminUserController');
const { supabaseAdmin } = require('../../config/database');
const { ApiError } = require('../../middleware/errorHandler');

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../config/logger', () => ({
  logAuth: jest.fn(),
  logError: jest.fn(),
  logAudit: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('AdminUserController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request object
    req = {
      body: {},
      query: {},
      params: {},
      user: {
        id: 'admin-user-id',
        email: 'admin@masstock.com',
        role: 'admin'
      },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0')
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('POST /api/v1/admin/users - createUser', () => {
    it('should create a new user with client successfully', async () => {
      req.body = {
        email: 'newuser@example.com',
        password: 'securePass123',
        name: 'John Doe',
        company_name: 'ACME Corp',
        plan: 'premium_custom',
        subscription_amount: 500,
        role: 'user'
      };

      const mockAuthUser = { id: 'new-user-id' };
      const mockDbUser = {
        id: 'new-user-id',
        email: 'newuser@example.com',
        role: 'user',
        status: 'active'
      };
      const mockClient = {
        id: 'new-client-id',
        user_id: 'new-user-id',
        name: 'ACME Corp',
        company_name: 'ACME Corp',
        plan: 'premium_custom',
        status: 'active',
        subscription_amount: 500
      };

      supabaseAdmin.auth = {
        admin: {
          createUser: jest.fn().mockResolvedValue({
            data: { user: mockAuthUser },
            error: null
          })
        }
      };

      let userCallCount = 0;
      supabaseAdmin.from = jest.fn((table) => {
        if (table === 'users') {
          userCallCount++;
          if (userCallCount === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            };
          } else {
            return {
              upsert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: mockDbUser, error: null })
            };
          }
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

      await adminUserController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User created successfully',
          data: expect.objectContaining({
            user: expect.any(Object),
            client: expect.any(Object)
          })
        })
      );
    });

    it('should validate required fields - email missing', async () => {
      req.body = { password: 'test123' };

      await expect(adminUserController.createUser(req, res)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Email and password are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    });

    it('should validate password minimum length', async () => {
      req.body = {
        email: 'user@example.com',
        password: 'short'
      };

      await expect(adminUserController.createUser(req, res)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Password must be at least 8 characters'
      });
    });

    it('should reject duplicate email', async () => {
      req.body = {
        email: 'existing@example.com',
        password: 'securePass123'
      };

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'existing-user-id' },
          error: null
        })
      }));

      await expect(adminUserController.createUser(req, res)).rejects.toMatchObject({
        statusCode: 400,
        message: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    });

    it('should validate role enum', async () => {
      req.body = {
        email: 'user@example.com',
        password: 'securePass123',
        role: 'invalid_role'
      };

      await expect(adminUserController.createUser(req, res)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Role must be either "user" or "admin"',
        code: 'INVALID_ROLE'
      });
    });
  });

  describe('GET /api/v1/admin/clients - getClients', () => {
    it('should fetch all clients with default pagination', async () => {
      req.query = {};

      const mockClients = [
        { id: 'client-1', name: 'Client One', status: 'active' },
        { id: 'client-2', name: 'Client Two', status: 'active' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockClients,
          error: null,
          count: 2
        }),
        eq: jest.fn().mockReturnThis()
      };

      supabaseAdmin.from = jest.fn(() => mockQuery);

      await adminUserController.getClients(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            clients: mockClients,
            pagination: expect.objectContaining({
              total: 2,
              limit: 50,
              page: 1
            })
          })
        })
      );
    });

    it('should support pagination with page and limit', async () => {
      req.query = { page: '2', limit: '10' };

      const mockClients = [{ id: 'client-11', name: 'Client Eleven' }];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockClients,
          error: null,
          count: 25
        }),
        eq: jest.fn().mockReturnThis()
      };

      supabaseAdmin.from = jest.fn(() => mockQuery);

      await adminUserController.getClients(req, res);

      expect(mockQuery.range).toHaveBeenCalledWith(10, 19);
    });

    it('should filter by status = active', async () => {
      req.query = { status: 'active' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        }),
        eq: jest.fn().mockReturnThis()
      };

      supabaseAdmin.from = jest.fn(() => mockQuery);

      await adminUserController.getClients(req, res);

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should filter by plan = starter', async () => {
      req.query = { plan: 'starter' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        }),
        eq: jest.fn().mockReturnThis()
      };

      supabaseAdmin.from = jest.fn(() => mockQuery);

      await adminUserController.getClients(req, res);

      expect(mockQuery.eq).toHaveBeenCalledWith('plan', 'starter');
    });

    it('should search by email or company name', async () => {
      req.query = { search: 'ACME' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [{ id: 'client-1', company_name: 'ACME Corp' }],
          error: null,
          count: 1
        })
      };

      supabaseAdmin.from = jest.fn(() => mockQuery);

      await adminUserController.getClients(req, res);

      expect(mockQuery.or).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/admin/clients/:client_id - getClient', () => {
    it('should fetch single client with stats', async () => {
      req.params = { client_id: 'client-123' };

      const mockClient = { id: 'client-123', name: 'Test Client', status: 'active' };

      supabaseAdmin.from = jest.fn((table) => {
        if (table === 'clients') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockClient, error: null })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      await adminUserController.getClient(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            client: mockClient,
            stats: expect.objectContaining({
              total_workflows: 0,
              total_executions: 0,
              success_rate: expect.any(String)
            })
          })
        })
      );
    });

    it('should return 404 if client not found', async () => {
      req.params = { client_id: 'non-existent' };

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      }));

      await expect(adminUserController.getClient(req, res)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Client not found',
        code: 'CLIENT_NOT_FOUND'
      });
    });
  });

  describe('PUT /api/v1/admin/clients/:client_id - updateClient', () => {
    it('should update client successfully', async () => {
      req.params = { client_id: 'client-123' };
      req.body = { status: 'suspended', subscription_amount: 1000, plan: 'pro' };

      const mockExistingClient = { id: 'client-123', status: 'active', subscription_amount: 500, plan: 'starter' };
      const mockUpdatedClient = { id: 'client-123', status: 'suspended', subscription_amount: 1000, plan: 'pro' };

      let callCount = 0;
      supabaseAdmin.from = jest.fn((table) => {
        if (table === 'clients') {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: mockExistingClient, error: null })
            };
          } else {
            return {
              update: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: mockUpdatedClient, error: null })
            };
          }
        }
        if (table === 'audit_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null })
          };
        }
      });

      await adminUserController.updateClient(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUpdatedClient
        })
      );
    });

    it('should return 404 if client not found', async () => {
      req.params = { client_id: 'non-existent' };
      req.body = { status: 'active' };

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      }));

      await expect(adminUserController.updateClient(req, res)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Client not found',
        code: 'CLIENT_NOT_FOUND'
      });
    });
  });

  describe('DELETE /api/v1/admin/clients/:client_id - deleteClient', () => {
    it('should soft delete (suspend) client', async () => {
      req.params = { client_id: 'client-123' };

      const mockClient = { id: 'client-123', status: 'suspended' };

      supabaseAdmin.from = jest.fn((table) => {
        if (table === 'clients') {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
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

      await adminUserController.deleteClient(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Client suspended successfully'
        })
      );
    });

    it('should return 404 if client not found', async () => {
      req.params = { client_id: 'non-existent' };

      supabaseAdmin.from = jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      }));

      await expect(adminUserController.deleteClient(req, res)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Client not found',
        code: 'CLIENT_NOT_FOUND'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      req.query = {};

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
          count: 0
        })
      }));

      await expect(adminUserController.getClients(req, res)).rejects.toMatchObject({
        statusCode: 500,
        message: 'Failed to fetch clients',
        code: 'DATABASE_ERROR'
      });
    });
  });
});
