/**
 * Admin Workflow Controller
 * Workflow and workflow request management for administrators
 */

const { supabaseAdmin } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const { z } = require('zod');
const { updateWorkflowStageSchema } = require('../validation/schemas');

/**
 * Valid workflow request stages/statuses
 */
const VALID_STAGES = [
  'draft',
  'submitted',
  'reviewing',
  'negotiation',
  'contract_signed',
  'development',
  'deployed',
  'rejected'
];

/**
 * GET /api/v1/admin/workflows
 * Get all workflows with stats and filtering
 */
async function getWorkflows(req, res) {
  const {
    page = 1,
    limit = 50,
    offset,
    status,
    client_id,
    sort = 'created_at'
  } = req.query;

  // Calculate offset from page if not provided directly
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const calculatedOffset = offset !== undefined ? parseInt(offset) : (pageNum - 1) * limitNum;

  // Build query
  let query = supabaseAdmin
    .from('workflows')
    .select('*', { count: 'exact' });

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }

  if (client_id) {
    query = query.eq('client_id', client_id);
  }

  // Apply sorting and pagination
  query = query
    .order(sort, { ascending: false })
    .range(calculatedOffset, calculatedOffset + limitNum - 1);

  const { data: workflows, error, count } = await query;

  if (error) {
    throw new ApiError(500, 'Failed to fetch workflows', 'DATABASE_ERROR');
  }

  // Fetch execution stats for each workflow
  const workflowIds = workflows.map(w => w.id);
  let executionsData = [];

  if (workflowIds.length > 0) {
    const { data: executions } = await supabaseAdmin
      .from('workflow_executions')
      .select('workflow_id, status')
      .in('workflow_id', workflowIds);

    executionsData = executions || [];
  }

  // Enhance workflows with stats
  const workflowsWithStats = workflows.map(workflow => {
    const workflowExecutions = executionsData.filter(e => e.workflow_id === workflow.id);
    const totalExecutions = workflowExecutions.length;
    const successCount = workflowExecutions.filter(e => e.status === 'completed').length;
    const errorCount = workflowExecutions.filter(e => e.status === 'failed').length;
    const successRate = totalExecutions > 0
      ? ((successCount / totalExecutions) * 100).toFixed(2)
      : '0';

    const revenue = workflow.revenue_per_execution * successCount;

    return {
      ...workflow,
      stats: {
        total_executions: totalExecutions,
        success_count: successCount,
        error_count: errorCount,
        success_rate: successRate,
        revenue: revenue.toFixed(2)
      }
    };
  });

  res.json({
    success: true,
    data: {
      workflows: workflowsWithStats,
      total: count,
      limit: limitNum,
      offset: calculatedOffset,
      page: pageNum,
      totalPages: Math.ceil(count / limitNum)
    }
  });
}

/**
 * GET /api/v1/admin/workflows/:id
 * Get single workflow with detailed information
 */
async function getWorkflow(req, res) {
  const { id } = req.params;

  // Fetch workflow
  const { data: workflow, error } = await supabaseAdmin
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !workflow) {
    throw new ApiError(404, 'Workflow not found', 'WORKFLOW_NOT_FOUND');
  }

  // Fetch client details
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', workflow.client_id)
    .single();

  // Fetch execution stats
  const { data: executions } = await supabaseAdmin
    .from('workflow_executions')
    .select('*')
    .eq('workflow_id', id);

  const totalExecutions = executions?.length || 0;
  const successCount = executions?.filter(e => e.status === 'completed').length || 0;
  const failureCount = executions?.filter(e => e.status === 'failed').length || 0;

  // Calculate average duration
  const completedExecutions = executions?.filter(e => e.status === 'completed' && e.duration_seconds) || [];
  const avgDuration = completedExecutions.length > 0
    ? completedExecutions.reduce((sum, e) => sum + e.duration_seconds, 0) / completedExecutions.length
    : 0;

  res.json({
    success: true,
    data: {
      workflow,
      client: client || null,
      stats: {
        total_executions: totalExecutions,
        success_count: successCount,
        failure_count: failureCount,
        success_rate: totalExecutions > 0 ? ((successCount / totalExecutions) * 100).toFixed(2) : '0',
        avg_duration_seconds: avgDuration.toFixed(2)
      },
      recent_executions: executions?.slice(0, 10) || []
    }
  });
}

/**
 * GET /api/v1/admin/workflow-requests
 * Get all workflow requests with filtering
 */
async function getWorkflowRequests(req, res) {
  const {
    page = 1,
    limit = 50,
    offset,
    status,
    client_id,
    search,
    sort = 'created_at'
  } = req.query;

  // Calculate offset from page if not provided directly
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const calculatedOffset = offset !== undefined ? parseInt(offset) : (pageNum - 1) * limitNum;

  // Build query
  let query = supabaseAdmin
    .from('workflow_requests')
    .select('*', { count: 'exact' });

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }

  if (client_id) {
    query = query.eq('client_id', client_id);
  }

  // Apply search
  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  // Apply sorting and pagination
  query = query
    .order(sort, { ascending: false })
    .range(calculatedOffset, calculatedOffset + limitNum - 1);

  const { data: requests, error, count } = await query;

  if (error) {
    throw new ApiError(500, 'Failed to fetch workflow requests', 'DATABASE_ERROR');
  }

  res.json({
    success: true,
    data: {
      requests,
      total: count,
      limit: limitNum,
      offset: calculatedOffset,
      page: pageNum,
      totalPages: Math.ceil(count / limitNum)
    }
  });
}

/**
 * GET /api/v1/admin/workflow-requests/:id
 * Get single workflow request with client details
 */
async function getWorkflowRequest(req, res) {
  const { id } = req.params;

  // Fetch workflow request
  const { data: request, error } = await supabaseAdmin
    .from('workflow_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !request) {
    throw new ApiError(404, 'Workflow request not found', 'REQUEST_NOT_FOUND');
  }

  // Fetch client details
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', request.client_id)
    .single();

  res.json({
    success: true,
    data: {
      request,
      client: client || null
    }
  });
}

/**
 * PUT /api/v1/admin/workflow-requests/:id/stage
 * Update workflow request stage/status
 */
async function updateWorkflowRequestStage(req, res) {
  try {
    const { id } = req.params;

    // Validate input with Zod
    const validatedData = updateWorkflowStageSchema.parse(req.body);
    const { stage } = validatedData;

    // Fetch existing request
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('workflow_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      throw new ApiError(404, 'Workflow request not found', 'REQUEST_NOT_FOUND');
    }

    // Update stage
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('workflow_requests')
      .update({ status: stage })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new ApiError(500, 'Failed to update workflow request stage', 'UPDATE_FAILED');
    }

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert([{
      client_id: request.client_id,
      user_id: req.user.id,
      action: 'workflow_request_stage_updated',
      resource_type: 'workflow_request',
      resource_id: id,
      changes: {
        before: { status: request.status },
        after: { status: stage }
      },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }]);

    res.json({
      success: true,
      message: 'Workflow request stage updated successfully',
      data: updatedRequest
    });

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    // Re-throw ApiError to be handled by global error handler
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle unexpected errors
    throw new ApiError(500, 'Internal server error', 'INTERNAL_ERROR');
  }
}

/**
 * DELETE /api/v1/admin/workflows/:id
 * Archive workflow (soft delete)
 */
async function deleteWorkflow(req, res) {
  const { id } = req.params;

  // Fetch existing workflow
  const { data: workflow, error: fetchError } = await supabaseAdmin
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !workflow) {
    throw new ApiError(404, 'Workflow not found', 'WORKFLOW_NOT_FOUND');
  }

  // Archive workflow (set status to 'archived')
  const { data: archivedWorkflow, error: updateError } = await supabaseAdmin
    .from('workflows')
    .update({ status: 'archived' })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    throw new ApiError(500, 'Failed to archive workflow', 'ARCHIVE_FAILED');
  }

  // Create audit log
  await supabaseAdmin.from('audit_logs').insert([{
    client_id: workflow.client_id,
    user_id: req.user.id,
    action: 'workflow_archived',
    resource_type: 'workflow',
    resource_id: id,
    changes: {
      before: { status: workflow.status },
      after: { status: 'archived' }
    },
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  }]);

  res.json({
    success: true,
    message: 'Workflow archived successfully'
  });
}

/**
 * GET /api/v1/admin/workflows/:id/stats
 * Get detailed performance metrics for a workflow
 */
async function getWorkflowStats(req, res) {
  const { id } = req.params;

  // Fetch workflow
  const { data: workflow, error } = await supabaseAdmin
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !workflow) {
    throw new ApiError(404, 'Workflow not found', 'WORKFLOW_NOT_FOUND');
  }

  // Fetch all executions
  const { data: executions } = await supabaseAdmin
    .from('workflow_executions')
    .select('*')
    .eq('workflow_id', id);

  const allExecutions = executions || [];
  const totalExecutions = allExecutions.length;
  const successCount = allExecutions.filter(e => e.status === 'completed').length;
  const failureCount = allExecutions.filter(e => e.status === 'failed').length;
  const pendingCount = allExecutions.filter(e => e.status === 'pending').length;
  const processingCount = allExecutions.filter(e => e.status === 'processing').length;

  const successRate = totalExecutions > 0
    ? ((successCount / totalExecutions) * 100).toFixed(2)
    : '0';

  // Calculate average duration for completed executions
  const completedExecutions = allExecutions.filter(e => e.status === 'completed' && e.duration_seconds);
  const avgDuration = completedExecutions.length > 0
    ? completedExecutions.reduce((sum, e) => sum + e.duration_seconds, 0) / completedExecutions.length
    : 0;

  // Calculate financial metrics
  const totalRevenue = workflow.revenue_per_execution * successCount;
  const totalCost = workflow.cost_per_execution * successCount;
  const profit = totalRevenue - totalCost;

  // Calculate executions this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyExecutions = allExecutions.filter(e =>
    new Date(e.created_at) >= startOfMonth
  );

  const monthlySuccess = monthlyExecutions.filter(e => e.status === 'completed').length;
  const monthlyRevenue = workflow.revenue_per_execution * monthlySuccess;

  res.json({
    success: true,
    data: {
      workflow_id: id,
      workflow_name: workflow.name,
      total_executions: totalExecutions,
      success_count: successCount,
      failure_count: failureCount,
      pending_count: pendingCount,
      processing_count: processingCount,
      success_rate: successRate,
      avg_duration_seconds: avgDuration.toFixed(2),
      total_revenue: totalRevenue.toFixed(2),
      total_cost: totalCost.toFixed(2),
      profit: profit.toFixed(2),
      executions_this_month: monthlyExecutions.length,
      revenue_this_month: monthlyRevenue.toFixed(2)
    }
  });
}

module.exports = {
  getWorkflows,
  getWorkflow,
  getWorkflowRequests,
  getWorkflowRequest,
  updateWorkflowRequestStage,
  deleteWorkflow,
  getWorkflowStats
};
