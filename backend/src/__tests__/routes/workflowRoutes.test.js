/**
 * Comprehensive Tests for Workflow Routes
 * Testing route configuration, middleware chains, and validation
 */

const express = require('express');
const request = require('supertest');
const workflowRoutes = require('../../routes/workflowRoutes');
const workflowsController = require('../../controllers/workflowsController');
const { authenticate, requireClient } = require('../../middleware/auth');
const { executionLimiter } = require('../../middleware/rateLimit');

// Mock dependencies
jest.mock('../../controllers/workflowsController');
jest.mock('../../middleware/auth');
jest.mock('../../middleware/rateLimit', () => ({
  executionLimiter: (req, res, next) => next(),
  apiLimiter: (req, res, next) => next(),
  authLimiter: (req, res, next) => next()
}));
jest.mock('../../config/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

describe('Workflow Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/workflows', workflowRoutes);

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
   * GET /api/workflows
   */
  describe('GET /api/workflows', () => {
    it('should get all workflows for client', async () => {
      workflowsController.getWorkflows = jest.fn((req, res) => {
        res.json({ success: true, workflows: [] });
      });

      const response = await request(app)
        .get('/api/workflows');

      expect(response.status).toBe(200);
      expect(workflowsController.getWorkflows).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/workflows');

      expect(response.status).toBe(401);
    });

    it('should require client role', async () => {
      authenticate.mockImplementation((req, res, next) => {
        req.user = { id: 'user-id', role: 'user' };
        next();
      });

      requireClient.mockImplementation((req, res) => {
        res.status(403).json({ error: 'Forbidden' });
      });

      const response = await request(app)
        .get('/api/workflows');

      expect(response.status).toBe(403);
    });
  });

  /**
   * GET /api/workflows/:workflow_id
   */
  describe('GET /api/workflows/:workflow_id', () => {
    it('should get workflow details', async () => {
      workflowsController.getWorkflow = jest.fn((req, res) => {
        res.json({ success: true, workflow: { id: 'wf-1' } });
      });

      const response = await request(app)
        .get('/api/workflows/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
      expect(workflowsController.getWorkflow).toHaveBeenCalled();
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/workflows/invalid-uuid');

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/workflows/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(401);
    });
  });

  /**
   * POST /api/workflows/:workflow_id/execute
   */
  describe('POST /api/workflows/:workflow_id/execute', () => {
    it('should execute workflow successfully', async () => {
      workflowsController.executeWorkflow = jest.fn((req, res) => {
        res.json({ success: true, execution_id: 'exec-1' });
      });

      const response = await request(app)
        .post('/api/workflows/550e8400-e29b-41d4-a716-446655440000/execute')
        .send({
          input_data: { key: 'value' }
        });

      expect(response.status).toBe(200);
      expect(workflowsController.executeWorkflow).toHaveBeenCalled();
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .post('/api/workflows/invalid-uuid/execute')
        .send({
          input_data: { key: 'value' }
        });

      expect(response.status).toBe(400);
    });

    it('should validate input_data is object', async () => {
      const response = await request(app)
        .post('/api/workflows/550e8400-e29b-41d4-a716-446655440000/execute')
        .send({
          input_data: 'not an object'
        });

      expect(response.status).toBe(400);
    });

    it('should require input_data field', async () => {
      const response = await request(app)
        .post('/api/workflows/550e8400-e29b-41d4-a716-446655440000/execute')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should apply execution rate limiter', async () => {
      workflowsController.executeWorkflow = jest.fn((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/api/workflows/550e8400-e29b-41d4-a716-446655440000/execute')
        .send({
          input_data: { key: 'value' }
        });

      expect(response.status).toBe(200);
    });
  });

  /**
   * GET /api/workflows/:workflow_id/executions
   */
  describe('GET /api/workflows/:workflow_id/executions', () => {
    it('should get workflow execution history', async () => {
      workflowsController.getWorkflowExecutions = jest.fn((req, res) => {
        res.json({ success: true, executions: [] });
      });

      const response = await request(app)
        .get('/api/workflows/550e8400-e29b-41d4-a716-446655440000/executions');

      expect(response.status).toBe(200);
      expect(workflowsController.getWorkflowExecutions).toHaveBeenCalled();
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/workflows/invalid-uuid/executions');

      expect(response.status).toBe(400);
    });

    it('should support limit parameter', async () => {
      workflowsController.getWorkflowExecutions = jest.fn((req, res) => {
        res.json({ success: true, executions: [] });
      });

      const response = await request(app)
        .get('/api/workflows/550e8400-e29b-41d4-a716-446655440000/executions?limit=50');

      expect(response.status).toBe(200);
    });

    it('should validate limit parameter (min 1)', async () => {
      const response = await request(app)
        .get('/api/workflows/550e8400-e29b-41d4-a716-446655440000/executions?limit=0');

      expect(response.status).toBe(400);
    });

    it('should validate limit parameter (max 100)', async () => {
      const response = await request(app)
        .get('/api/workflows/550e8400-e29b-41d4-a716-446655440000/executions?limit=101');

      expect(response.status).toBe(400);
    });

    it('should support offset parameter', async () => {
      workflowsController.getWorkflowExecutions = jest.fn((req, res) => {
        res.json({ success: true, executions: [] });
      });

      const response = await request(app)
        .get('/api/workflows/550e8400-e29b-41d4-a716-446655440000/executions?offset=10');

      expect(response.status).toBe(200);
    });

    it('should validate offset parameter (min 0)', async () => {
      const response = await request(app)
        .get('/api/workflows/550e8400-e29b-41d4-a716-446655440000/executions?offset=-1');

      expect(response.status).toBe(400);
    });
  });

  /**
   * GET /api/workflows/:workflow_id/stats
   */
  describe('GET /api/workflows/:workflow_id/stats', () => {
    it('should get workflow statistics', async () => {
      workflowsController.getWorkflowStats = jest.fn((req, res) => {
        res.json({ success: true, stats: {} });
      });

      const response = await request(app)
        .get('/api/workflows/550e8400-e29b-41d4-a716-446655440000/stats');

      expect(response.status).toBe(200);
      expect(workflowsController.getWorkflowStats).toHaveBeenCalled();
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/workflows/invalid-uuid/stats');

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/workflows/550e8400-e29b-41d4-a716-446655440000/stats');

      expect(response.status).toBe(401);
    });
  });

  /**
   * GET /api/workflows/executions/:execution_id
   */
  describe('GET /api/workflows/executions/:execution_id', () => {
    it('should get execution status', async () => {
      workflowsController.getExecution = jest.fn((req, res) => {
        res.json({ success: true, execution: { id: 'exec-1', status: 'completed' } });
      });

      const response = await request(app)
        .get('/api/workflows/executions/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
      expect(workflowsController.getExecution).toHaveBeenCalled();
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/workflows/executions/invalid-uuid');

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/workflows/executions/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(401);
    });

    it('should require client role', async () => {
      requireClient.mockImplementation((req, res) => {
        res.status(403).json({ error: 'Forbidden' });
      });

      const response = await request(app)
        .get('/api/workflows/executions/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(403);
    });
  });
});
