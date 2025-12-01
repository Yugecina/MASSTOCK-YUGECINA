/**
 * Comprehensive Tests for Support Ticket Routes
 * Testing route configuration, middleware chains, and validation
 */

const express = require('express');
const request = require('supertest');
const supportTicketRoutes = require('../../routes/supportTicketRoutes');
const supportTicketsController = require('../../controllers/supportTicketsController');
const { authenticate, requireClient } = require('../../middleware/auth');

// Mock dependencies
jest.mock('../../controllers/supportTicketsController');
jest.mock('../../middleware/auth');
jest.mock('../../config/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

describe('Support Ticket Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/support-tickets', supportTicketRoutes);

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
   * POST /api/support-tickets
   */
  describe('POST /api/support-tickets', () => {
    it('should create support ticket successfully', async () => {
      supportTicketsController.createTicket = jest.fn((req, res) => {
        res.status(201).json({ success: true, ticket: { id: 'ticket-1' } });
      });

      const response = await request(app)
        .post('/api/support-tickets')
        .send({
          title: 'Test Ticket',
          description: 'This is a test support ticket description'
        });

      expect(response.status).toBe(201);
      expect(supportTicketsController.createTicket).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .post('/api/support-tickets')
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
        .post('/api/support-tickets')
        .send({
          title: 'Test',
          description: 'Description'
        });

      expect(response.status).toBe(403);
    });

    it('should validate title length (min 3)', async () => {
      const response = await request(app)
        .post('/api/support-tickets')
        .send({
          title: 'Te',
          description: 'This is a description'
        });

      expect(response.status).toBe(400);
    });

    it('should validate title length (max 255)', async () => {
      const response = await request(app)
        .post('/api/support-tickets')
        .send({
          title: 'T'.repeat(256),
          description: 'This is a description'
        });

      expect(response.status).toBe(400);
    });

    it('should validate description length (min 10)', async () => {
      const response = await request(app)
        .post('/api/support-tickets')
        .send({
          title: 'Test Ticket',
          description: 'Short'
        });

      expect(response.status).toBe(400);
    });

    it('should validate priority enum', async () => {
      const response = await request(app)
        .post('/api/support-tickets')
        .send({
          title: 'Test Ticket',
          description: 'This is a test description',
          priority: 'invalid_priority'
        });

      expect(response.status).toBe(400);
    });

    it('should allow valid priorities', async () => {
      supportTicketsController.createTicket = jest.fn((req, res) => {
        res.status(201).json({ success: true });
      });

      const validPriorities = ['urgent', 'high', 'medium', 'low'];

      for (const priority of validPriorities) {
        const response = await request(app)
          .post('/api/support-tickets')
          .send({
            title: 'Test Ticket',
            description: 'This is a test description',
            priority
          });

        expect(response.status).toBe(201);
      }
    });

    it('should allow optional workflow_execution_id field', async () => {
      supportTicketsController.createTicket = jest.fn((req, res) => {
        res.status(201).json({ success: true });
      });

      const response = await request(app)
        .post('/api/support-tickets')
        .send({
          title: 'Test Ticket',
          description: 'This is a test description',
          workflow_execution_id: '550e8400-e29b-41d4-a716-446655440000'
        });

      expect(response.status).toBe(201);
    });

    it('should validate workflow_execution_id is UUID', async () => {
      const response = await request(app)
        .post('/api/support-tickets')
        .send({
          title: 'Test Ticket',
          description: 'This is a test description',
          workflow_execution_id: 'invalid-uuid'
        });

      expect(response.status).toBe(400);
    });
  });

  /**
   * GET /api/support-tickets
   */
  describe('GET /api/support-tickets', () => {
    it('should get all support tickets', async () => {
      supportTicketsController.getTickets = jest.fn((req, res) => {
        res.json({ success: true, tickets: [] });
      });

      const response = await request(app)
        .get('/api/support-tickets');

      expect(response.status).toBe(200);
      expect(supportTicketsController.getTickets).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/support-tickets');

      expect(response.status).toBe(401);
    });

    it('should not require client role for admins', async () => {
      authenticate.mockImplementation((req, res, next) => {
        req.user = { id: 'admin-id', role: 'admin' };
        next();
      });

      supportTicketsController.getTickets = jest.fn((req, res) => {
        res.json({ success: true, tickets: [] });
      });

      const response = await request(app)
        .get('/api/support-tickets');

      expect(response.status).toBe(200);
    });
  });

  /**
   * GET /api/support-tickets/:ticket_id
   */
  describe('GET /api/support-tickets/:ticket_id', () => {
    it('should get ticket details', async () => {
      supportTicketsController.getTicket = jest.fn((req, res) => {
        res.json({ success: true, ticket: { id: 'ticket-1' } });
      });

      const response = await request(app)
        .get('/api/support-tickets/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
      expect(supportTicketsController.getTicket).toHaveBeenCalled();
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/support-tickets/invalid-uuid');

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/support-tickets/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(401);
    });
  });

  /**
   * PUT /api/support-tickets/:ticket_id
   */
  describe('PUT /api/support-tickets/:ticket_id', () => {
    it('should update ticket', async () => {
      supportTicketsController.updateTicket = jest.fn((req, res) => {
        res.json({ success: true, ticket: { id: 'ticket-1' } });
      });

      const response = await request(app)
        .put('/api/support-tickets/550e8400-e29b-41d4-a716-446655440000')
        .send({
          status: 'in_progress'
        });

      expect(response.status).toBe(200);
      expect(supportTicketsController.updateTicket).toHaveBeenCalled();
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .put('/api/support-tickets/invalid-uuid')
        .send({ status: 'open' });

      expect(response.status).toBe(400);
    });

    it('should validate status enum', async () => {
      const response = await request(app)
        .put('/api/support-tickets/550e8400-e29b-41d4-a716-446655440000')
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
    });

    it('should allow valid statuses', async () => {
      supportTicketsController.updateTicket = jest.fn((req, res) => {
        res.json({ success: true });
      });

      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];

      for (const status of validStatuses) {
        const response = await request(app)
          .put('/api/support-tickets/550e8400-e29b-41d4-a716-446655440000')
          .send({ status });

        expect(response.status).toBe(200);
      }
    });

    it('should allow optional assigned_to field', async () => {
      supportTicketsController.updateTicket = jest.fn((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/support-tickets/550e8400-e29b-41d4-a716-446655440000')
        .send({
          assigned_to: '550e8400-e29b-41d4-a716-446655440001'
        });

      expect(response.status).toBe(200);
    });

    it('should validate assigned_to is UUID', async () => {
      const response = await request(app)
        .put('/api/support-tickets/550e8400-e29b-41d4-a716-446655440000')
        .send({
          assigned_to: 'invalid-uuid'
        });

      expect(response.status).toBe(400);
    });

    it('should allow optional response field', async () => {
      supportTicketsController.updateTicket = jest.fn((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .put('/api/support-tickets/550e8400-e29b-41d4-a716-446655440000')
        .send({
          response: 'This is a response to the ticket'
        });

      expect(response.status).toBe(200);
    });

    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .put('/api/support-tickets/550e8400-e29b-41d4-a716-446655440000')
        .send({ status: 'open' });

      expect(response.status).toBe(401);
    });
  });
});
