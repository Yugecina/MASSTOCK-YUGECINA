/**
 * Tests for Support Tickets Controller
 * Testing ticket creation, listing, and management
 */

import * as supportTicketsController from '../../controllers/supportTicketsController';
import {  supabaseAdmin  } from '../../config/database';
import {  ApiError  } from '../../middleware/errorHandler';

jest.mock('../../config/database');
jest.mock('../../config/logger', () => ({
  logAudit: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('SupportTicketsController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      query: {},
      params: {},
      user: {
        id: 'user-id',
        email: 'user@test.com',
        role: 'user'
      },
      client: {
        id: 'client-id',
        name: 'Test Client'
      },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0')
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('POST /api/support-tickets - createTicket', () => {
    it('should create ticket successfully', async () => {
      req.body = {
        title: 'Workflow not executing',
        description: 'My workflow fails with timeout error',
        priority: 'high'
      };

      const mockTicket = {
        id: 'ticket-1',
        client_id: 'client-id',
        title: 'Workflow not executing',
        description: 'My workflow fails with timeout error',
        priority: 'high',
        status: 'open'
      };

      supabaseAdmin.from = jest.fn((table) => {
        if (table === 'support_tickets') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockTicket, error: null })
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null })
          };
        }
      });

      await supportTicketsController.createTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockTicket
        })
      );
    });

    it('should require title and description', async () => {
      req.body = { title: 'Test' };

      await expect(supportTicketsController.createTicket(req, res)).rejects.toMatchObject({
        statusCode: 400,
        code: 'MISSING_REQUIRED_FIELDS'
      });
    });

    it('should validate priority values', async () => {
      req.body = {
        title: 'Test',
        description: 'Test description',
        priority: 'critical' // invalid
      };

      await expect(supportTicketsController.createTicket(req, res)).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_PRIORITY'
      });
    });

    it('should verify workflow execution belongs to client', async () => {
      req.body = {
        title: 'Test',
        description: 'Test description',
        workflow_execution_id: 'exec-123'
      };

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      }));

      await expect(supportTicketsController.createTicket(req, res)).rejects.toMatchObject({
        statusCode: 404,
        code: 'EXECUTION_NOT_FOUND'
      });
    });
  });

  describe('GET /api/support-tickets - getTickets', () => {
    it('should fetch client tickets for regular user', async () => {
      const mockTickets = [
        { id: 'ticket-1', title: 'Issue 1', status: 'open', clients: null }
      ];

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockTickets, error: null })
      }));

      await supportTicketsController.getTickets(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.total).toBe(1);
      expect(response.data.tickets[0]).toHaveProperty('client_name');
    });

    it('should fetch all tickets for admin', async () => {
      req.user.role = 'admin';
      req.client = null;

      const mockTickets = [
        { id: 'ticket-1', title: 'Issue 1', clients: null },
        { id: 'ticket-2', title: 'Issue 2', clients: null }
      ];

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockTickets, error: null })
      }));

      await supportTicketsController.getTickets(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.total).toBe(2);
      expect(response.data.tickets).toHaveLength(2);
    });
  });

  describe('GET /api/support-tickets/:ticket_id - getTicket', () => {
    it('should fetch ticket details', async () => {
      req.params = { ticket_id: 'ticket-1' };

      const mockTicket = {
        id: 'ticket-1',
        client_id: 'client-id',
        title: 'Test Issue',
        status: 'open'
      };

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockTicket, error: null })
      }));

      await supportTicketsController.getTicket(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockTicket
        })
      );
    });

    it('should return 404 if ticket not found', async () => {
      req.params = { ticket_id: 'non-existent' };

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      }));

      await expect(supportTicketsController.getTicket(req, res)).rejects.toMatchObject({
        statusCode: 404,
        code: 'TICKET_NOT_FOUND'
      });
    });
  });

  describe('PUT /api/support-tickets/:ticket_id - updateTicket', () => {
    it('should update ticket status (admin only)', async () => {
      req.user.role = 'admin';
      req.params = { ticket_id: 'ticket-1' };
      req.body = { status: 'resolved' };

      const mockTicket = {
        id: 'ticket-1',
        status: 'open',
        client_id: 'client-id'
      };

      const updatedTicket = {
        ...mockTicket,
        status: 'resolved',
        resolved_at: expect.any(String)
      };

      let callCount = 0;
      supabaseAdmin.from = jest.fn((table) => {
        if (table === 'support_tickets') {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: mockTicket, error: null })
            };
          } else {
            return {
              update: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: updatedTicket, error: null })
            };
          }
        }
        if (table === 'audit_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ data: {}, error: null })
          };
        }
      });

      await supportTicketsController.updateTicket(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: updatedTicket
        })
      );
    });

    it('should reject non-admin updates', async () => {
      req.params = { ticket_id: 'ticket-1' };
      req.body = { status: 'resolved' };

      await expect(supportTicketsController.updateTicket(req, res)).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN'
      });
    });

    it('should validate status enum', async () => {
      req.user.role = 'admin';
      req.params = { ticket_id: 'ticket-1' };
      req.body = { status: 'invalid_status' };

      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'ticket-1', status: 'open' },
          error: null
        })
      }));

      await expect(supportTicketsController.updateTicket(req, res)).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_STATUS'
      });
    });
  });
});
