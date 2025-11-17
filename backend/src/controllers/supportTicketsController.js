/**
 * Support Tickets Controller
 * Handles customer support ticket management
 */

const { supabaseAdmin } = require('../config/database');
const { logAudit } = require('../config/logger');
const { ApiError } = require('../middleware/errorHandler');

/**
 * POST /api/support-tickets
 * Create new support ticket
 */
async function createTicket(req, res) {
  const { title, description, priority, workflow_execution_id } = req.body;
  const clientId = req.client.id;

  // Validate input
  if (!title || !description) {
    throw new ApiError(400, 'Title and description are required', 'MISSING_REQUIRED_FIELDS');
  }

  // Validate priority
  const validPriorities = ['urgent', 'high', 'medium', 'low'];
  if (priority && !validPriorities.includes(priority)) {
    throw new ApiError(400, 'Invalid priority value', 'INVALID_PRIORITY');
  }

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
    user_id: req.user.id,
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
}

/**
 * GET /api/support-tickets
 * Get support tickets (client sees own, admin sees all)
 */
async function getTickets(req, res) {
  const isAdmin = req.user.role === 'admin';
  const clientId = req.client?.id;

  let query = supabaseAdmin
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });

  // Filter by client if not admin
  if (!isAdmin) {
    query = query.eq('client_id', clientId);
  }

  const { data: tickets, error } = await query;

  if (error) {
    throw new ApiError(500, 'Failed to fetch support tickets', 'DATABASE_ERROR');
  }

  res.json({
    success: true,
    data: {
      tickets,
      total: tickets?.length || 0
    }
  });
}

/**
 * GET /api/support-tickets/:ticket_id
 * Get ticket details
 */
async function getTicket(req, res) {
  const { ticket_id } = req.params;
  const isAdmin = req.user.role === 'admin';
  const clientId = req.client?.id;

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
async function updateTicket(req, res) {
  const { ticket_id } = req.params;
  const { status, assigned_to, response } = req.body;
  const isAdmin = req.user.role === 'admin';

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
  const updates = {};
  const changes = { before: {}, after: {} };

  if (status) {
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid status value', 'INVALID_STATUS');
    }

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
    user_id: req.user.id,
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
}

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  updateTicket
};
