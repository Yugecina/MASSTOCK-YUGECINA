/**
 * Comprehensive Tests for Execution Routes
 * Testing route configuration, middleware chains, and validation
 */

const express = require('express');
const request = require('supertest');

// Mock dependencies BEFORE requiring routes
jest.mock('../../controllers/workflowsController', () => ({
  getExecution: jest.fn((req, res) => {
    res.json({
      success: true,
      execution: {
        id: 'exec-1',
        status: 'completed',
        workflow_id: 'wf-1',
        results: {}
      }
    });
  })
}));
jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { id: 'user-id', role: 'user', email: 'user@test.com' };
    req.client = { id: 'client-id', name: 'Test Client' };
    next();
  }),
  requireClient: jest.fn((req, res, next) => {
    if (req.client) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Client access required' });
    }
  })
}));
jest.mock('../../config/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

// Now require the modules that were mocked
const executionRoutes = require('../../routes/executionRoutes');
const workflowsController = require('../../controllers/workflowsController');
const { authenticate, requireClient } = require('../../middleware/auth');

describe('Execution Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/executions', executionRoutes);
  });

  /**
   * GET /api/executions/:execution_id
   */
  describe('GET /api/executions/:execution_id', () => {
    it('should get execution status and results', async () => {
      const response = await request(app)
        .get('/api/executions/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
      expect(workflowsController.getExecution).toHaveBeenCalled();
      expect(response.body.execution).toHaveProperty('id');
      expect(response.body.execution).toHaveProperty('status');
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/executions/invalid-uuid');

      expect(response.status).toBe(400);
    });

    it('should reject non-UUID execution_id', async () => {
      const response = await request(app)
        .get('/api/executions/12345');

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementationOnce((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/executions/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(401);
    });

    it('should require client role', async () => {
      requireClient.mockImplementationOnce((req, res) => {
        res.status(403).json({ error: 'Forbidden: Client access required' });
      });

      const response = await request(app)
        .get('/api/executions/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(403);
    });

    it('should handle processing execution', async () => {
      workflowsController.getExecution.mockImplementationOnce((req, res) => {
        res.json({
          success: true,
          execution: {
            id: 'exec-1',
            status: 'processing',
            workflow_id: 'wf-1',
            progress: 50
          }
        });
      });

      const response = await request(app)
        .get('/api/executions/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
      expect(response.body.execution.status).toBe('processing');
      expect(response.body.execution.progress).toBe(50);
    });

    it('should handle failed execution', async () => {
      workflowsController.getExecution.mockImplementationOnce((req, res) => {
        res.json({
          success: true,
          execution: {
            id: 'exec-1',
            status: 'failed',
            workflow_id: 'wf-1',
            error_message: 'Execution failed'
          }
        });
      });

      const response = await request(app)
        .get('/api/executions/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
      expect(response.body.execution.status).toBe('failed');
      expect(response.body.execution).toHaveProperty('error_message');
    });

    it('should handle queued execution', async () => {
      workflowsController.getExecution.mockImplementationOnce((req, res) => {
        res.json({
          success: true,
          execution: {
            id: 'exec-1',
            status: 'queued',
            workflow_id: 'wf-1'
          }
        });
      });

      const response = await request(app)
        .get('/api/executions/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
      expect(response.body.execution.status).toBe('queued');
    });

    it('should call controller with correct execution_id parameter', async () => {
      workflowsController.getExecution.mockImplementationOnce((req, res) => {
        expect(req.params.execution_id).toBe('550e8400-e29b-41d4-a716-446655440000');
        res.json({ success: true, execution: {} });
      });

      await request(app)
        .get('/api/executions/550e8400-e29b-41d4-a716-446655440000');

      expect(workflowsController.getExecution).toHaveBeenCalled();
    });

    it('should pass user context to controller', async () => {
      workflowsController.getExecution.mockImplementationOnce((req, res) => {
        expect(req.user).toBeDefined();
        expect(req.user.id).toBe('user-id');
        expect(req.client).toBeDefined();
        expect(req.client.id).toBe('client-id');
        res.json({ success: true, execution: {} });
      });

      await request(app)
        .get('/api/executions/550e8400-e29b-41d4-a716-446655440000');

      expect(workflowsController.getExecution).toHaveBeenCalled();
    });
  });
});
