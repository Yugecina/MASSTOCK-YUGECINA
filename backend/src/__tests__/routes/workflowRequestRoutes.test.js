/**
 * Comprehensive Tests for Workflow Request Routes
 * Testing route configuration, middleware chains, and validation
 */

const express = require('express');
const request = require('supertest');
const workflowRequestRoutes = require('../../routes/workflowRequestRoutes');
const workflowRequestsController = require('../../controllers/workflowRequestsController');
const { authenticate, requireClient } = require('../../middleware/auth');

// Mock dependencies
jest.mock('../../controllers/workflowRequestsController');
jest.mock('../../middleware/auth');
jest.mock('../../config/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

describe('Workflow Request Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/workflow-requests', workflowRequestRoutes);

    // Add error handler to prevent hanging
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({ error: err.message });
    });

    // Setup default middleware mocks
    authenticate.mockImplementation((req, res, next) => {
      req.user = { id: 'user-id', role: 'user', email: 'user@test.com' };
      req.client = { id: 'client-id', name: 'Test Client' };
      next();
    });

    requireClient.mockImplementation((req, res, next) => {
      if (req.client) {
        next();
      } else {
        res.status(403).json({ error: 'Forbidden: Client access required' });
      }
    });
  });

  /**
   * POST /api/workflow-requests
   */
  describe('POST /api/workflow-requests', () => {
    it('should create workflow request successfully', async () => {
      workflowRequestsController.createWorkflowRequest = jest.fn((req, res) => {
        res.status(201).json({ success: true, request: { id: 'req-1' } });
      });

      const response = await request(app)
        .post('/api/workflow-requests')
        .send({
          title: 'Test Request',
          description: 'This is a test workflow request description'
        });

      expect(response.status).toBe(201);
      expect(workflowRequestsController.createWorkflowRequest).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .post('/api/workflow-requests')
        .send({
          title: 'Test',
          description: 'Description'
        });

      expect(response.status).toBe(401);
    });

    it('should require client role', async () => {
      requireClient.mockImplementation((req, res) => {
        res.status(403).json({ error: 'Forbidden' });
      });

      const response = await request(app)
        .post('/api/workflow-requests')
        .send({
          title: 'Test',
          description: 'Description'
        });

      expect(response.status).toBe(403);
    });

    it('should validate title length (min 3)', async () => {
      const response = await request(app)
        .post('/api/workflow-requests')
        .send({
          title: 'Te',
          description: 'This is a description'
        });

      expect(response.status).toBe(400);
    });

    it('should validate title length (max 255)', async () => {
      const response = await request(app)
        .post('/api/workflow-requests')
        .send({
          title: 'T'.repeat(256),
          description: 'This is a description'
        });

      expect(response.status).toBe(400);
    });

    it('should validate description length (min 10)', async () => {
      const response = await request(app)
        .post('/api/workflow-requests')
        .send({
          title: 'Test Request',
          description: 'Short'
        });

      expect(response.status).toBe(400);
    });

    it('should allow optional use_case field', async () => {
      workflowRequestsController.createWorkflowRequest = jest.fn((req, res) => {
        res.status(201).json({ success: true });
      });

      const response = await request(app)
        .post('/api/workflow-requests')
        .send({
          title: 'Test Request',
          description: 'This is a test description',
          use_case: 'Automation'
        });

      expect(response.status).toBe(201);
    });

    it('should validate frequency enum', async () => {
      const response = await request(app)
        .post('/api/workflow-requests')
        .send({
          title: 'Test Request',
          description: 'This is a test description',
          frequency: 'invalid_frequency'
        });

      expect(response.status).toBe(400);
    });

    it('should allow valid frequencies', async () => {
      workflowRequestsController.createWorkflowRequest = jest.fn((req, res) => {
        res.status(201).json({ success: true });
      });

      const response = await request(app)
        .post('/api/workflow-requests')
        .send({
          title: 'Test Request',
          description: 'This is a test description',
          frequency: 'daily'
        });

      expect(response.status).toBe(201);
    });

    it('should allow optional budget field', async () => {
      workflowRequestsController.createWorkflowRequest = jest.fn((req, res) => {
        res.status(201).json({ success: true });
      });

      const response = await request(app)
        .post('/api/workflow-requests')
        .send({
          title: 'Test Request',
          description: 'This is a test description',
          budget: 1000
        });

      expect(response.status).toBe(201);
    });

    it('should validate budget is numeric', async () => {
      const response = await request(app)
        .post('/api/workflow-requests')
        .send({
          title: 'Test Request',
          description: 'This is a test description',
          budget: 'not a number'
        });

      expect(response.status).toBe(400);
    });
  });

  /**
   * GET /api/workflow-requests
   */
  describe('GET /api/workflow-requests', () => {
    it('should get all workflow requests', async () => {
      workflowRequestsController.getWorkflowRequests = jest.fn((req, res) => {
        res.json({ success: true, requests: [] });
      });

      const response = await request(app)
        .get('/api/workflow-requests');

      expect(response.status).toBe(200);
      expect(workflowRequestsController.getWorkflowRequests).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/workflow-requests');

      expect(response.status).toBe(401);
    });

    it('should require client role', async () => {
      requireClient.mockImplementation((req, res) => {
        res.status(403).json({ error: 'Forbidden' });
      });

      const response = await request(app)
        .get('/api/workflow-requests');

      expect(response.status).toBe(403);
    });
  });

  /**
   * GET /api/workflow-requests/:request_id
   */
  describe('GET /api/workflow-requests/:request_id', () => {
    it('should get workflow request details', async () => {
      workflowRequestsController.getWorkflowRequest = jest.fn((req, res) => {
        res.json({ success: true, request: { id: 'req-1' } });
      });

      const response = await request(app)
        .get('/api/workflow-requests/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
      expect(workflowRequestsController.getWorkflowRequest).toHaveBeenCalled();
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/workflow-requests/invalid-uuid');

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/workflow-requests/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(401);
    });
  });

  /**
   * PUT /api/workflow-requests/:request_id
   */
  describe('PUT /api/workflow-requests/:request_id', () => {
    it('should update workflow request', async () => {
      workflowRequestsController.updateWorkflowRequest = jest.fn((req, res) => {
        res.json({ success: true, request: { id: 'req-1' } });
      });

      const response = await request(app)
        .put('/api/workflow-requests/550e8400-e29b-41d4-a716-446655440000')
        .send({
          status: 'submitted'
        });

      expect(response.status).toBe(200);
      expect(workflowRequestsController.updateWorkflowRequest).toHaveBeenCalled();
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .put('/api/workflow-requests/invalid-uuid')
        .send({ status: 'submitted' });

      expect(response.status).toBe(400);
    });

    it('should validate status enum', async () => {
      const response = await request(app)
        .put('/api/workflow-requests/550e8400-e29b-41d4-a716-446655440000')
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
    });

    it('should allow valid statuses', async () => {
      workflowRequestsController.updateWorkflowRequest = jest.fn((req, res) => {
        res.json({ success: true });
      });

      const validStatuses = ['draft', 'submitted', 'reviewing', 'negotiation', 
                             'contract_signed', 'development', 'deployed', 'rejected'];

      for (const status of validStatuses) {
        const response = await request(app)
          .put('/api/workflow-requests/550e8400-e29b-41d4-a716-446655440000')
          .send({ status });

        expect(response.status).toBe(200);
      }
    });

    it('should allow optional notes field', async () => {
      workflowRequestsController.updateWorkflowRequest = jest.fn((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/workflow-requests/550e8400-e29b-41d4-a716-446655440000')
        .send({
          notes: 'Updated notes'
        });

      expect(response.status).toBe(200);
    });

    it('should allow optional estimated_cost field', async () => {
      workflowRequestsController.updateWorkflowRequest = jest.fn((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/workflow-requests/550e8400-e29b-41d4-a716-446655440000')
        .send({
          estimated_cost: 5000
        });

      expect(response.status).toBe(200);
    });

    it('should validate estimated_cost is numeric', async () => {
      const response = await request(app)
        .put('/api/workflow-requests/550e8400-e29b-41d4-a716-446655440000')
        .send({
          estimated_cost: 'not a number'
        });

      expect(response.status).toBe(400);
    });

    it('should allow optional estimated_dev_days field', async () => {
      workflowRequestsController.updateWorkflowRequest = jest.fn((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/workflow-requests/550e8400-e29b-41d4-a716-446655440000')
        .send({
          estimated_dev_days: 10
        });

      expect(response.status).toBe(200);
    });

    it('should validate estimated_dev_days is integer (min 0)', async () => {
      const response = await request(app)
        .put('/api/workflow-requests/550e8400-e29b-41d4-a716-446655440000')
        .send({
          estimated_dev_days: -1
        });

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .put('/api/workflow-requests/550e8400-e29b-41d4-a716-446655440000')
        .send({ status: 'submitted' });

      expect(response.status).toBe(401);
    });
  });
});
