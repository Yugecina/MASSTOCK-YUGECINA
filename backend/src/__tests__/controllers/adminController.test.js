/**
 * Tests for Admin Controller
 * Testing admin dashboard, client management, analytics, and system monitoring
 *
 * Tests follow TDD approach:
 * - Test all CRUD operations for clients
 * - Test dashboard metrics and statistics
 * - Test workflow performance monitoring
 * - Test error logging and audit trails
 * - Test admin user creation (bootstrap)
 * - Test validation and authorization
 */

const adminController = require('../../controllers/adminController');
const { supabaseAdmin } = require('../../config/database');
const { ApiError } = require('../../middleware/errorHandler');

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../config/logger', () => ({
  logAudit: jest.fn(),
  logAuth: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('AdminController', () => {
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
      client: null,
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

  describe('POST /api/v1/admin/create-admin - createAdminUser', () => {
    it('should create first admin user successfully', async () => {
      req.body = {
        email: 'admin@masstock.com',
        password: 'secureAdmin123',
        name: 'Admin User'
      };

      let fromCallCount = 0;
      // Mock no existing admins
      supabaseAdmin.from = jest.fn((table) => {
        fromCallCount++;
        if (table === 'users') {
          if (fromCallCount === 1) {
            // First call - check for existing admins
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({ data: [], error: null })
            };
          } else if (fromCallCount === 2) {
            // Second call - check for existing user by email
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            };
          } else {
            // Subsequent calls - for user sync
            return {
              upsert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: 'new-admin-id', email: 'admin@masstock.com', role: 'admin', status: 'active' },
                error: null
              })
            };
          }
        }
      });

      const mockAuthUser = { id: 'new-admin-id' };
      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        expires_in: 3600
      };

      supabaseAdmin.auth = {
        admin: {
          createUser: jest.fn().mockResolvedValue({
            data: { user: mockAuthUser },
            error: null
          })
        },
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { session: mockSession, user: mockAuthUser },
          error: null
        })
      };

      await adminController.createAdminUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Admin user created successfully',
          data: expect.objectContaining({
            id: 'new-admin-id',
            email: 'admin@masstock.com',
            role: 'admin',
            access_token: 'token123'
          })
        })
      );
    });

    it('should reject if admin already exists', async () => {
      req.body = {
        email: 'admin@masstock.com',
        password: 'secureAdmin123'
      };

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: 'existing-admin' }],
          error: null
        })
      }));

      await expect(adminController.createAdminUser(req, res)).rejects.toMatchObject({
        statusCode: 403,
        code: 'ADMIN_EXISTS'
      });
    });

    it('should validate email and password are required', async () => {
      req.body = { email: 'admin@test.com' };

      await expect(adminController.createAdminUser(req, res)).rejects.toMatchObject({
        statusCode: 400,
        code: 'MISSING_REQUIRED_FIELDS'
      });
    });

    it('should validate password minimum length', async () => {
      req.body = {
        email: 'admin@test.com',
        password: 'short'
      };

      await expect(adminController.createAdminUser(req, res)).rejects.toMatchObject({
        statusCode: 400,
        code: 'WEAK_PASSWORD'
      });
    });
  });

  describe('POST /api/v1/admin/users - createUser', () => {
    it('should create new user with client', async () => {
      req.body = {
        email: 'newuser@example.com',
        password: 'securePass123',
        name: 'Test User',
        company_name: 'Test Corp',
        plan: 'premium_custom',
        subscription_amount: 500
      };

      const mockAuthUser = { id: 'new-user-id' };
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
        callCount++;
        if (table === 'users') {
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            };
          } else {
            return {
              upsert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: 'new-user-id', email: 'newuser@example.com', role: 'user', status: 'active' },
                error: null
              })
            };
          }
        }
        if (table === 'clients') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'new-client-id', name: 'Test Corp', plan: 'premium_custom' },
              error: null
            })
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null })
          };
        }
      });

      await adminController.createUser(req, res);

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

    it('should reject invalid role', async () => {
      req.body = {
        email: 'user@test.com',
        password: 'pass1234',
        role: 'superadmin'
      };

      await expect(adminController.createUser(req, res)).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_ROLE'
      });
    });
  });

  describe('GET /api/admin/clients - getClients', () => {
    it('should fetch all clients with pagination', async () => {
      req.query = { limit: '50', offset: '0' };

      const mockClients = [
        { id: 'client-1', name: 'Client One', status: 'active' },
        { id: 'client-2', name: 'Client Two', status: 'active' }
      ];

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockClients,
          error: null,
          count: 2
        }),
        eq: jest.fn().mockReturnThis()
      }));

      await adminController.getClients(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            clients: mockClients,
            total: 2
          })
        })
      );
    });

    it('should filter by status', async () => {
      req.query = { status: 'suspended' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      };

      supabaseAdmin.from = jest.fn(() => mockQuery);

      await adminController.getClients(req, res);

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'suspended');
    });
  });

  describe('GET /api/admin/clients/:client_id - getClient', () => {
    it('should fetch client with full details and stats', async () => {
      req.params = { client_id: 'client-123' };

      const mockClient = { id: 'client-123', name: 'Test Client' };
      const mockWorkflows = [{ id: 'wf-1', revenue_per_execution: 50 }];
      const mockExecutions = [
        { status: 'completed', created_at: new Date().toISOString() },
        { status: 'completed', created_at: new Date().toISOString() },
        { status: 'failed', created_at: new Date().toISOString() }
      ];

      supabaseAdmin.from = jest.fn((table) => {
        if (table === 'clients') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockClient, error: null })
          };
        }
        if (table === 'workflows') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockWorkflows, error: null })
          };
        }
        if (table === 'workflow_requests' || table === 'support_tickets') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        if (table === 'workflow_executions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockExecutions, error: null })
          };
        }
      });

      await adminController.getClient(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.client).toEqual(mockClient);
      expect(response.data.stats.total_executions).toBe(3);
      expect(response.data.stats.success_count).toBe(2);
    });

    it('should return 404 if client not found', async () => {
      req.params = { client_id: 'non-existent' };

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      }));

      await expect(adminController.getClient(req, res)).rejects.toMatchObject({
        statusCode: 404,
        code: 'CLIENT_NOT_FOUND'
      });
    });
  });

  describe('GET /api/admin/dashboard - getDashboard', () => {
    it('should return dashboard statistics', async () => {
      const mockClients = [{ id: 'c1', status: 'active' }, { id: 'c2', status: 'active' }];
      const mockExecutions = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'failed' }
      ];
      const mockWorkflows = [
        { id: 'wf-1', revenue_per_execution: 50 }
      ];
      const mockMonthExecutions = [
        { workflow_id: 'wf-1', status: 'completed' },
        { workflow_id: 'wf-1', status: 'completed' }
      ];
      const mockAuditLogs = [{ id: 'log-1', action: 'user_login' }];

      let fromCallCount = 0;
      supabaseAdmin.from = jest.fn((table) => {
        fromCallCount++;
        if (table === 'clients') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockClients, error: null })
          };
        }
        if (table === 'workflow_executions') {
          if (fromCallCount === 2) {
            return {
              select: jest.fn().mockReturnThis(),
              gte: jest.fn().mockResolvedValue({ data: mockExecutions, error: null })
            };
          } else {
            return {
              select: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({ data: mockMonthExecutions, error: null })
            };
          }
        }
        if (table === 'workflows') {
          return {
            select: jest.fn().mockResolvedValue({ data: mockWorkflows, error: null })
          };
        }
        if (table === 'audit_logs') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: mockAuditLogs, error: null })
          };
        }
      });

      await adminController.getDashboard(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.active_clients).toBe(2);
      expect(response.data.total_executions_24h).toBe(3);
      expect(response.data.errors_24h).toBe(1);
    });
  });

  describe('GET /api/admin/workflows/stats - getWorkflowStats', () => {
    it('should return workflow performance metrics', async () => {
      const mockWorkflows = [
        { id: 'wf-1', name: 'Workflow 1', revenue_per_execution: 50, cost_per_execution: 5 }
      ];
      const mockExecutions = [
        { status: 'completed', duration_seconds: 30 },
        { status: 'completed', duration_seconds: 40 },
        { status: 'failed', duration_seconds: 10 }
      ];

      let callCount = 0;
      supabaseAdmin.from = jest.fn((table) => {
        if (table === 'workflows') {
          return {
            select: jest.fn().mockResolvedValue({ data: mockWorkflows, error: null })
          };
        }
        if (table === 'workflow_executions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockExecutions, error: null })
          };
        }
      });

      await adminController.getWorkflowStats(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.workflows).toHaveLength(1);
      expect(response.data.workflows[0].total_executions).toBe(3);
      expect(response.data.workflows[0].success_count).toBe(2);
    });
  });

  describe('GET /api/admin/errors - getErrors', () => {
    it('should return failed executions as errors', async () => {
      req.query = { limit: '50', offset: '0' };

      const mockErrors = [
        { id: 'exec-1', status: 'failed', error_message: 'Timeout' }
      ];

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockErrors,
          error: null,
          count: 1
        })
      }));

      await adminController.getErrors(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            errors: mockErrors,
            total: 1
          })
        })
      );
    });
  });

  describe('GET /api/admin/audit-logs - getAuditLogs', () => {
    it('should return audit logs with filters', async () => {
      req.query = { client_id: 'client-123', limit: '100', offset: '0' };

      const mockLogs = [
        { id: 'log-1', action: 'user_login', client_id: 'client-123' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockLogs,
          error: null,
          count: 1
        })
      };

      supabaseAdmin.from = jest.fn(() => mockQuery);

      await adminController.getAuditLogs(req, res);

      expect(mockQuery.eq).toHaveBeenCalledWith('client_id', 'client-123');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            logs: mockLogs,
            total: 1
          })
        })
      );
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

      await expect(adminController.getClients(req, res)).rejects.toMatchObject({
        statusCode: 500,
        code: 'DATABASE_ERROR'
      });
    });
  });
});
