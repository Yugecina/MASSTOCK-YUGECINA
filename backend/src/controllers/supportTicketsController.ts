/**
 * Support Tickets Controller
 * Handles customer support ticket management
 */

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { logAudit } from '../config/logger';
import { ApiError } from '../middleware/errorHandler';
import { z } from 'zod';
import {
  createTicketSchema,
  updateTicketSchema
} from '../validation/schemas';

/**
 * POST /api/support-tickets
 * Create new support ticket
 */
export async function createTicket(req: Request, res: Response): Promise<void> {
  try {
    // Validate input with Zod
    const validatedData = createTicketSchema.parse(req.body);
    const { title, description, priority, workflow_execution_id } = validatedData;
    const clientId = (req as any).client.id;

    // If workflow_execution_id provided, verify it belongs to client
    if (workflow_execution_id) {
      const { data: execution } = await supabaseAdmin
        .from('workflow_executions')
        .select('id')
        .eq('id', workflow_execution_id)
        .eq('client_id', clientId)
        .single();

      if (!execution) {
        throw new ApiError(404, 'Workflow execution not found', 'EXECUTION_NOT_FOUND');
      }
    }

    // Create ticket
    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .insert([{
        client_id: clientId,
        workflow_execution_id: workflow_execution_id || null,
        title,
        description,
        priority: priority || 'medium',
        status: 'open'
      }])
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'Failed to create support ticket', 'DATABASE_ERROR');
    }

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert([{
      client_id: clientId,
      user_id: (req as any).user.id,
      action: 'support_ticket_created',
      resource_type: 'support_ticket',
      resource_id: ticket.id,
      changes: { status: 'open', priority: ticket.priority },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }]);

    res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
      return;
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to create ticket: ${error.message}`, 'CREATE_TICKET_ERROR');
  }
}

/**
 * GET /api/support-tickets
 * Get support tickets (client sees own, admin sees all)
 */
export async function getTickets(req: Request, res: Response): Promise<void> {
  const isAdmin = (req as any).user.role === 'admin';
  const clientId = (req as any).client?.id;

  let query = supabaseAdmin
    .from('support_tickets')
    .select(`
      *,
      clients:client_id (
        name,
        company_name
      )
    `)
    .order('created_at', { ascending: false });

  // Filter by client if not admin
  if (!isAdmin) {
    query = query.eq('client_id', clientId);
  }

  const { data: tickets, error } = await query;

  if (error) {
    throw new ApiError(500, 'Failed to fetch support tickets', 'DATABASE_ERROR');
  }

  // Transform tickets to include client_name
  const transformedTickets = tickets?.map((ticket: any) => ({
    ...ticket,
    client_name: ticket.clients?.company_name || ticket.clients?.name || 'Unknown Client'
  })) || [];

  res.json({
    success: true,
    data: {
      tickets: transformedTickets,
      total: transformedTickets.length
    }
  });
}

/**
 * GET /api/support-tickets/:ticket_id
 * Get ticket details
 */
export async function getTicket(req: Request, res: Response): Promise<void> {
  const { ticket_id } = req.params;
  const isAdmin = (req as any).user.role === 'admin';
  const clientId = (req as any).client?.id;

  let query = supabaseAdmin
    .from('support_tickets')
    .select('*')
    .eq('id', ticket_id);

  // Filter by client if not admin
  if (!isAdmin) {
    query = query.eq('client_id', clientId);
  }

  const { data: ticket, error } = await query.single();

  if (error || !ticket) {
    throw new ApiError(404, 'Support ticket not found', 'TICKET_NOT_FOUND');
  }

  res.json({
    success: true,
    data: ticket
  });
}

/**
 * PUT /api/support-tickets/:ticket_id
 * Update ticket (admin only for status changes)
 */
export async function updateTicket(req: Request, res: Response): Promise<void> {
  try {
    // Validate input with Zod
    const validatedData = updateTicketSchema.parse(req.body);
    const { status, assigned_to, response } = validatedData;

    const { ticket_id } = req.params;
    const isAdmin = (req as any).user.role === 'admin';

    if (!isAdmin) {
      throw new ApiError(403, 'Only admins can update tickets', 'FORBIDDEN');
    }

    // Fetch existing ticket
    const { data: ticket, error: fetchError } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', ticket_id)
      .single();

    if (fetchError || !ticket) {
      throw new ApiError(404, 'Support ticket not found', 'TICKET_NOT_FOUND');
    }

    // Build update object
    const updates: any = {};
    const changes: any = { before: {}, after: {} };

    if (status) {
      updates.status = status;
      changes.before.status = ticket.status;
      changes.after.status = status;

      // Set resolved_at timestamp if status is resolved or closed
      if ((status === 'resolved' || status === 'closed') && !ticket.resolved_at) {
        updates.resolved_at = new Date().toISOString();
      }
    }

    if (assigned_to !== undefined) {
      updates.assigned_to_admin_id = assigned_to;
      changes.before.assigned_to = ticket.assigned_to_admin_id;
      changes.after.assigned_to = assigned_to;
    }

    // Perform update
    const { data: updatedTicket, error: updateError } = await supabaseAdmin
      .from('support_tickets')
      .update(updates)
      .eq('id', ticket_id)
      .select()
      .single();

    if (updateError) {
      throw new ApiError(500, 'Failed to update support ticket', 'UPDATE_FAILED');
    }

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert([{
      client_id: ticket.client_id,
      user_id: (req as any).user.id,
      action: 'support_ticket_updated',
      resource_type: 'support_ticket',
      resource_id: ticket_id,
      changes,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }]);

    res.json({
      success: true,
      data: updatedTicket
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
      return;
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to update ticket: ${error.message}`, 'UPDATE_TICKET_ERROR');
  }
}
