/**
 * Comprehensive Tests for Admin Routes
 * Testing route configuration, middleware chains, and validation
 */

const express = require('express');
const request = require('supertest');
const adminRoutes = require('../../routes/adminRoutes');
const adminController = require('../../controllers/adminController');
const adminUserController = require('../../controllers/adminUserController');
const adminWorkflowController = require('../../controllers/adminWorkflowController');
const analyticsController = require('../../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const { adminLimiter } = require('../../middleware/rateLimit');

// Mock dependencies
jest.mock('../../controllers/adminController');
jest.mock('../../controllers/adminUserController');
jest.mock('../../controllers/adminWorkflowController');
jest.mock('../../controllers/analyticsController');
jest.mock('../../middleware/auth');
jest.mock('../../middleware/rateLimit', () => ({
  adminLimiter: (req, res, next) => next(),
  apiLimiter: (req, res, next) => next(),
  authLimiter: (req, res, next) => next()
}));
jest.mock('../../config/logger', () => ({
  logAuth: jest.fn(),
  logError: jest.fn(),
  logAudit: jest.fn(),
  logAudit: jest.fn(),
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));
jest.mock('../../queues/workflowQueue', () => ({
  addWorkflowJob: jest.fn(),
  getJobStatus: jest.fn(),
  workflowQueue: {
    add: jest.fn(),
    getJob: jest.fn(),
    close: jest.fn()
  }
}));

describe('Admin Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/v1/admin', adminRoutes);

    // Add error handler to prevent hanging
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({ error: err.message });
    });

    // Setup default middleware mocks
    authenticate.mockImplementation((req, res, next) => {
      req.user = { id: 'admin-id', role: 'admin', email: 'admin@test.com' };
      next();
    });

    requireAdmin.mockImplementation((req, res, next) => {
      if (req.user?.role === 'admin') {
        next();
      } else {
        res.status(403).json({ error: 'Forbidden' });
      }
    });
  });

  /**
   * BOOTSTRAP ENDPOINT (No Auth Required)
   */
  describe('POST /api/v1/admin/create-admin', () => {
    it('should create first admin without authentication', async () => {
      adminController.createAdminUser = jest.fn((req, res) => {
        res.status(201).json({ success: true, user: { id: 'admin-1' } });
      });

      const response = await request(app)
        .post('/api/v1/admin/create-admin')
        .send({
          email: 'admin@test.com',
          password: 'password123',
          name: 'Admin User'
        });

      expect(response.status).toBe(201);
      expect(adminController.createAdminUser).toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/admin/create-admin')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
    });

    it('should validate password length (min 8)', async () => {
      const response = await request(app)
        .post('/api/v1/admin/create-admin')
        .send({
          email: 'admin@test.com',
          password: '1234567'
        });

      expect(response.status).toBe(400);
    });

    it('should allow optional name field', async () => {
      adminController.createAdminUser = jest.fn((req, res) => {
        res.status(201).json({ success: true });
      });

      const response = await request(app)
        .post('/api/v1/admin/create-admin')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
    });
  });

  /**
   * USER MANAGEMENT ENDPOINTS
   */
  describe('POST /api/v1/admin/users', () => {
    it('should create user successfully', async () => {
      adminUserController.createUser = jest.fn((req, res) => {
        res.status(201).json({ success: true, user: { id: 'user-1' } });
      });

      const response = await request(app)
        .post('/api/v1/admin/users')
        .send({
          email: 'user@test.com',
          password: 'password123',
          name: 'Test User',
          role: 'user'
        });

      expect(response.status).toBe(201);
      expect(adminUserController.createUser).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .post('/api/v1/admin/users')
        .send({
          email: 'user@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      authenticate.mockImplementation((req, res, next) => {
        req.user = { id: 'user-id', role: 'user' };
        next();
      });

      const response = await request(app)
        .post('/api/v1/admin/users')
        .send({
          email: 'user@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(403);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/admin/users')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/v1/admin/users')
        .send({
          email: 'user@test.com',
          password: '1234567'
        });

      expect(response.status).toBe(400);
    });

    it('should validate plan enum', async () => {
      const response = await request(app)
        .post('/api/v1/admin/users')
        .send({
          email: 'user@test.com',
          password: 'password123',
          plan: 'invalid_plan'
        });

      expect(response.status).toBe(400);
    });

    it('should allow valid plans', async () => {
      adminUserController.createUser = jest.fn((req, res) => {
        res.status(201).json({ success: true });
      });

      const response = await request(app)
        .post('/api/v1/admin/users')
        .send({
          email: 'user@test.com',
          password: 'password123',
          plan: 'premium_custom'
        });

      expect(response.status).toBe(201);
    });

    it('should validate role enum', async () => {
      const response = await request(app)
        .post('/api/v1/admin/users')
        .send({
          email: 'user@test.com',
          password: 'password123',
          role: 'superadmin'
        });

      expect(response.status).toBe(400);
    });
  });

  /**
   * CLIENT MANAGEMENT ENDPOINTS
   */
  describe('GET /api/v1/admin/clients', () => {
    it('should list all clients', async () => {
      adminUserController.getClients = jest.fn((req, res) => {
        res.json({ success: true, clients: [], total: 0 });
      });

      const response = await request(app)
        .get('/api/v1/admin/clients');

      expect(response.status).toBe(200);
      expect(adminUserController.getClients).toHaveBeenCalled();
    });

    it('should support pagination with page parameter', async () => {
      adminUserController.getClients = jest.fn((req, res) => {
        res.json({ success: true, clients: [], page: 2 });
      });

      const response = await request(app)
        .get('/api/v1/admin/clients?page=2&limit=10');

      expect(response.status).toBe(200);
    });

    it('should validate page parameter (min 1)', async () => {
      const response = await request(app)
        .get('/api/v1/admin/clients?page=0');

      expect(response.status).toBe(400);
    });

    it('should validate limit parameter (max 100)', async () => {
      const response = await request(app)
        .get('/api/v1/admin/clients?limit=101');

      expect(response.status).toBe(400);
    });

    it('should validate status enum', async () => {
      const response = await request(app)
        .get('/api/v1/admin/clients?status=invalid');

      expect(response.status).toBe(400);
    });

    it('should allow valid statuses', async () => {
      adminUserController.getClients = jest.fn((req, res) => {
        res.json({ success: true, clients: [] });
      });

      const response = await request(app)
        .get('/api/v1/admin/clients?status=active');

      expect(response.status).toBe(200);
    });

    it('should support search parameter', async () => {
      adminUserController.getClients = jest.fn((req, res) => {
        res.json({ success: true, clients: [] });
      });

      const response = await request(app)
        .get('/api/v1/admin/clients?search=test');

      expect(response.status).toBe(200);
    });

    it('should validate sort field', async () => {
      const response = await request(app)
        .get('/api/v1/admin/clients?sort=invalid_field');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/admin/clients/:client_id', () => {
    it('should get client details', async () => {
      adminUserController.getClient = jest.fn((req, res) => {
        res.json({ success: true, client: { id: 'client-1' } });
      });

      const response = await request(app)
        .get('/api/v1/admin/clients/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
      expect(adminUserController.getClient).toHaveBeenCalled();
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/admin/clients/invalid-uuid');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/admin/clients', () => {
    it('should create client', async () => {
      adminController.createClient = jest.fn((req, res) => {
        res.status(201).json({ success: true, client: { id: 'client-1' } });
      });

      const response = await request(app)
        .post('/api/v1/admin/clients')
        .send({
          name: 'Test Client',
          email: 'client@test.com'
        });

      expect(response.status).toBe(201);
    });

    it('should validate name length (min 2)', async () => {
      const response = await request(app)
        .post('/api/v1/admin/clients')
        .send({
          name: 'T',
          email: 'client@test.com'
        });

      expect(response.status).toBe(400);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/admin/clients')
        .send({
          name: 'Test Client',
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/v1/admin/clients/:client_id', () => {
    it('should update client', async () => {
      adminUserController.updateClient = jest.fn((req, res) => {
        res.json({ success: true, client: { id: 'client-1' } });
      });

      const response = await request(app)
        .put('/api/v1/admin/clients/550e8400-e29b-41d4-a716-446655440000')
        .send({
          status: 'active',
          subscription_amount: 1000
        });

      expect(response.status).toBe(200);
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .put('/api/v1/admin/clients/invalid-uuid')
        .send({ status: 'active' });

      expect(response.status).toBe(400);
    });

    it('should validate status enum', async () => {
      const response = await request(app)
        .put('/api/v1/admin/clients/550e8400-e29b-41d4-a716-446655440000')
        .send({ status: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('should validate plan enum', async () => {
      const response = await request(app)
        .put('/api/v1/admin/clients/550e8400-e29b-41d4-a716-446655440000')
        .send({ plan: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('should validate metadata is object', async () => {
      const response = await request(app)
        .put('/api/v1/admin/clients/550e8400-e29b-41d4-a716-446655440000')
        .send({ metadata: 'not an object' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/admin/clients/:client_id', () => {
    it('should delete client', async () => {
      adminUserController.deleteClient = jest.fn((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .delete('/api/v1/admin/clients/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .delete('/api/v1/admin/clients/invalid-uuid');

      expect(response.status).toBe(400);
    });
  });

  /**
   * WORKFLOW MANAGEMENT ENDPOINTS
   */
  describe('GET /api/v1/admin/workflows', () => {
    it('should list all workflows', async () => {
      adminWorkflowController.getWorkflows = jest.fn((req, res) => {
        res.json({ success: true, workflows: [] });
      });

      const response = await request(app)
        .get('/api/v1/admin/workflows');

      expect(response.status).toBe(200);
    });

    it('should support status filter', async () => {
      adminWorkflowController.getWorkflows = jest.fn((req, res) => {
        res.json({ success: true, workflows: [] });
      });

      const response = await request(app)
        .get('/api/v1/admin/workflows?status=deployed');

      expect(response.status).toBe(200);
    });

    it('should validate status enum', async () => {
      const response = await request(app)
        .get('/api/v1/admin/workflows?status=invalid');

      expect(response.status).toBe(400);
    });

    it('should validate client_id is UUID', async () => {
      const response = await request(app)
        .get('/api/v1/admin/workflows?client_id=invalid');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/admin/workflows/:id', () => {
    it('should get workflow details', async () => {
      adminWorkflowController.getWorkflow = jest.fn((req, res) => {
        res.json({ success: true, workflow: { id: 'wf-1' } });
      });

      const response = await request(app)
        .get('/api/v1/admin/workflows/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/admin/workflows/invalid-uuid');

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/admin/workflows/:id', () => {
    it('should archive workflow', async () => {
      adminWorkflowController.deleteWorkflow = jest.fn((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .delete('/api/v1/admin/workflows/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/admin/workflows/:id/stats', () => {
    it('should get workflow stats', async () => {
      adminWorkflowController.getWorkflowStats = jest.fn((req, res) => {
        res.json({ success: true, stats: {} });
      });

      const response = await request(app)
        .get('/api/v1/admin/workflows/550e8400-e29b-41d4-a716-446655440000/stats');

      expect(response.status).toBe(200);
    });
  });

  /**
   * WORKFLOW REQUEST ENDPOINTS
   */
  describe('GET /api/v1/admin/workflow-requests', () => {
    it('should list workflow requests', async () => {
      adminWorkflowController.getWorkflowRequests = jest.fn((req, res) => {
        res.json({ success: true, requests: [] });
      });

      const response = await request(app)
        .get('/api/v1/admin/workflow-requests');

      expect(response.status).toBe(200);
    });

    it('should validate status enum', async () => {
      const response = await request(app)
        .get('/api/v1/admin/workflow-requests?status=invalid');

      expect(response.status).toBe(400);
    });

    it('should support search parameter', async () => {
      adminWorkflowController.getWorkflowRequests = jest.fn((req, res) => {
        res.json({ success: true, requests: [] });
      });

      const response = await request(app)
        .get('/api/v1/admin/workflow-requests?search=test');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/admin/workflow-requests/:id', () => {
    it('should get workflow request', async () => {
      adminWorkflowController.getWorkflowRequest = jest.fn((req, res) => {
        res.json({ success: true, request: { id: 'req-1' } });
      });

      const response = await request(app)
        .get('/api/v1/admin/workflow-requests/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/v1/admin/workflow-requests/:id/stage', () => {
    it('should update workflow request stage', async () => {
      adminWorkflowController.updateWorkflowRequestStage = jest.fn((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/v1/admin/workflow-requests/550e8400-e29b-41d4-a716-446655440000/stage')
        .send({ stage: 'development' });

      expect(response.status).toBe(200);
    });

    it('should validate stage enum', async () => {
      const response = await request(app)
        .put('/api/v1/admin/workflow-requests/550e8400-e29b-41d4-a716-446655440000/stage')
        .send({ stage: 'invalid_stage' });

      expect(response.status).toBe(400);
    });
  });

  /**
   * DASHBOARD & ANALYTICS ENDPOINTS
   */
  describe('GET /api/v1/admin/dashboard', () => {
    it('should get dashboard statistics', async () => {
      adminController.getDashboard = jest.fn((req, res) => {
        res.json({ success: true, stats: {} });
      });

      const response = await request(app)
        .get('/api/v1/admin/dashboard');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/admin/errors', () => {
    it('should get error logs', async () => {
      adminController.getErrors = jest.fn((req, res) => {
        res.json({ success: true, errors: [] });
      });

      const response = await request(app)
        .get('/api/v1/admin/errors');

      expect(response.status).toBe(200);
    });

    it('should validate severity enum', async () => {
      const response = await request(app)
        .get('/api/v1/admin/errors?severity=invalid');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/admin/audit-logs', () => {
    it('should get audit logs', async () => {
      adminController.getAuditLogs = jest.fn((req, res) => {
        res.json({ success: true, logs: [] });
      });

      const response = await request(app)
        .get('/api/v1/admin/audit-logs');

      expect(response.status).toBe(200);
    });

    it('should validate client_id is UUID', async () => {
      const response = await request(app)
        .get('/api/v1/admin/audit-logs?client_id=invalid');

      expect(response.status).toBe(400);
    });
  });

  /**
   * ANALYTICS ENDPOINTS
   */
  describe('GET /api/v1/admin/analytics/overview', () => {
    it('should get analytics overview', async () => {
      analyticsController.getOverview = jest.fn((req, res) => {
        res.json({ success: true, overview: {} });
      });

      const response = await request(app)
        .get('/api/v1/admin/analytics/overview');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/admin/analytics/executions-trend', () => {
    it('should get executions trend', async () => {
      analyticsController.getExecutionsTrend = jest.fn((req, res) => {
        res.json({ success: true, trend: [] });
      });

      const response = await request(app)
        .get('/api/v1/admin/analytics/executions-trend');

      expect(response.status).toBe(200);
    });

    it('should validate period enum', async () => {
      const response = await request(app)
        .get('/api/v1/admin/analytics/executions-trend?period=invalid');

      expect(response.status).toBe(400);
    });

    it('should allow valid periods', async () => {
      analyticsController.getExecutionsTrend = jest.fn((req, res) => {
        res.json({ success: true, trend: [] });
      });

      const response = await request(app)
        .get('/api/v1/admin/analytics/executions-trend?period=30d');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/admin/analytics/workflow-performance', () => {
    it('should get workflow performance', async () => {
      analyticsController.getWorkflowPerformance = jest.fn((req, res) => {
        res.json({ success: true, performance: [] });
      });

      const response = await request(app)
        .get('/api/v1/admin/analytics/workflow-performance');

      expect(response.status).toBe(200);
    });

    it('should validate period parameter', async () => {
      const response = await request(app)
        .get('/api/v1/admin/analytics/workflow-performance?period=invalid');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/admin/analytics/revenue-breakdown', () => {
    it('should get revenue breakdown', async () => {
      analyticsController.getRevenueBreakdown = jest.fn((req, res) => {
        res.json({ success: true, revenue: [] });
      });

      const response = await request(app)
        .get('/api/v1/admin/analytics/revenue-breakdown');

      expect(response.status).toBe(200);
    });

    it('should validate type enum', async () => {
      const response = await request(app)
        .get('/api/v1/admin/analytics/revenue-breakdown?type=invalid');

      expect(response.status).toBe(400);
    });

    it('should allow valid types', async () => {
      analyticsController.getRevenueBreakdown = jest.fn((req, res) => {
        res.json({ success: true, revenue: [] });
      });

      const response = await request(app)
        .get('/api/v1/admin/analytics/revenue-breakdown?type=client');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/admin/analytics/failures', () => {
    it('should get recent failures', async () => {
      analyticsController.getFailures = jest.fn((req, res) => {
        res.json({ success: true, failures: [] });
      });

      const response = await request(app)
        .get('/api/v1/admin/analytics/failures');

      expect(response.status).toBe(200);
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/admin/analytics/failures?limit=501');

      expect(response.status).toBe(400);
    });
  });
});
