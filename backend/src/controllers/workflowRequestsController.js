/**
 * Workflow Requests Controller
 * Handles client requests for new workflow development
 */

const { supabaseAdmin } = require('../config/database');
const { logAudit } = require('../config/logger');
const { ApiError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/workflow-requests
 * Create new workflow request
 */
async function createWorkflowRequest(req, res) {
  const { title, description, use_case, frequency, budget } = req.body;
  const clientId = req.client.id;

  // Validate input
  if (!title || !description) {
    throw new ApiError(400, 'Title and description are required', 'MISSING_REQUIRED_FIELDS');
  }

  // Create request
  const { data: request, error } = await supabaseAdmin
    .from('workflow_requests')
    .insert([{
      client_id: clientId,
      title,
      description,
      use_case,
      frequency,
      budget,
      status: 'submitted',
      timeline: {
        submitted_at: new Date().toISOString()
      }
    }])
    .select()
    .single();

  if (error) {
    throw new ApiError(500, 'Failed to create workflow request', 'DATABASE_ERROR');
  }

  // Create audit log
  await supabaseAdmin.from('audit_logs').insert([{
    client_id: clientId,
    user_id: req.user.id,
    action: 'workflow_request_created',
    resource_type: 'workflow_request',
    resource_id: request.id,
    changes: { status: 'submitted' },
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  }]);

  res.status(201).json({
    success: true,
    data: {
      request_id: request.id,
      status: request.status,
      message: 'Workflow request submitted successfully'
    }
  });
}

/**
 * GET /api/workflow-requests
 * Get all workflow requests for client
 */
async function getWorkflowRequests(req, res) {
  const clientId = req.client.id;

  const { data: requests, error } = await supabaseAdmin
    .from('workflow_requests')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new ApiError(500, 'Failed to fetch workflow requests', 'DATABASE_ERROR');
  }

  res.json({
    success: true,
    data: {
      requests,
      total: requests?.length || 0
    }
  });
}

/**
 * GET /api/workflow-requests/:request_id
 * Get workflow request details
 */
async function getWorkflowRequest(req, res) {
  const { request_id } = req.params;
  const clientId = req.client.id;

  const { data: request, error } = await supabaseAdmin
    .from('workflow_requests')
    .select('*')
    .eq('id', request_id)
    .eq('client_id', clientId)
    .single();

  if (error || !request) {
    throw new ApiError(404, 'Workflow request not found', 'REQUEST_NOT_FOUND');
  }

  res.json({
    success: true,
    data: request
  });
}

/**
 * PUT /api/workflow-requests/:request_id
 * Update workflow request (client can only update draft, admin can update any)
 */
async function updateWorkflowRequest(req, res) {
  const { request_id } = req.params;
  const { status, notes, timeline_update, estimated_cost, estimated_dev_days } = req.body;
  const isAdmin = req.user.role === 'admin';
  const clientId = req.client?.id;

  // Fetch existing request
  let query = supabaseAdmin
    .from('workflow_requests')
    .select('*')
    .eq('id', request_id);

  if (!isAdmin) {
    query = query.eq('client_id', clientId);
  }

  const { data: request, error } = await query.single();

  if (error || !request) {
    throw new ApiError(404, 'Workflow request not found', 'REQUEST_NOT_FOUND');
  }

  // Clients can only update draft requests
  if (!isAdmin && request.status !== 'draft') {
    throw new ApiError(403, 'Can only update draft requests', 'FORBIDDEN');
  }

  // Build update object
  const updates = {};
  const changes = { before: {}, after: {} };

  if (status && isAdmin) {
    updates.status = status;
    changes.before.status = request.status;
    changes.after.status = status;

    // Update timeline based on status
    const timeline = { ...request.timeline };
    const timestamp = new Date().toISOString();

    switch (status) {
      case 'reviewing':
        timeline.reviewing_started_at = timestamp;
        break;
      case 'negotiation':
        timeline.negotiation_started_at = timestamp;
        if (!timeline.estimate_sent_at) {
          timeline.estimate_sent_at = timestamp;
        }
        break;
      case 'contract_signed':
        timeline.contract_signed_at = timestamp;
        break;
      case 'development':
        timeline.dev_started_at = timestamp;
        break;
      case 'deployed':
        timeline.deployed_at = timestamp;
        break;
    }

    updates.timeline = timeline;
  }

  if (timeline_update && isAdmin) {
    updates.timeline = { ...request.timeline, ...timeline_update };
  }

  if (notes !== undefined) {
    updates.notes = notes;
  }

  if (estimated_cost !== undefined && isAdmin) {
    updates.estimated_cost = estimated_cost;
    changes.before.estimated_cost = request.estimated_cost;
    changes.after.estimated_cost = estimated_cost;
  }

  if (estimated_dev_days !== undefined && isAdmin) {
    updates.estimated_dev_days = estimated_dev_days;
  }

  // Perform update
  const { data: updatedRequest, error: updateError } = await supabaseAdmin
    .from('workflow_requests')
    .update(updates)
    .eq('id', request_id)
    .select()
    .single();

  if (updateError) {
    throw new ApiError(500, 'Failed to update workflow request', 'UPDATE_FAILED');
  }

  // Create audit log
  await supabaseAdmin.from('audit_logs').insert([{
    client_id: request.client_id,
    user_id: req.user.id,
    action: 'workflow_request_updated',
    resource_type: 'workflow_request',
    resource_id: request_id,
    changes,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  }]);

  res.json({
    success: true,
    data: updatedRequest
  });
}

module.exports = {
  createWorkflowRequest,
  getWorkflowRequests,
  getWorkflowRequest,
  updateWorkflowRequest
};
