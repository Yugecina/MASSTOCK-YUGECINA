/**
 * Workflows Controller
 * Handles workflow management and execution
 */

const { supabaseAdmin } = require('../config/database');
const { createClient } = require('@supabase/supabase-js');
const { logWorkflowExecution, logAudit } = require('../config/logger');
const { ApiError } = require('../middleware/errorHandler');
const { addWorkflowJob } = require('../queues/workflowQueue');
const { v4: uuidv4 } = require('uuid');
const { parsePrompts, validatePrompts } = require('../utils/promptParser');
const { filesToBase64 } = require('../middleware/upload');
const { encryptApiKey } = require('../utils/encryption');

// Create a fresh admin client for each query to avoid auth context contamination
function getCleanAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * GET /api/workflows
 * Get all workflows for authenticated client
 */
async function getWorkflows(req, res) {
  const clientId = req.client?.id;

  logger.debug('🔍 getWorkflows called:', {
    hasClient: !!req.client,
    clientId: clientId,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  if (!clientId) {
    logger.error('❌ No client ID in request');
    throw new ApiError(403, 'No client account', 'NO_CLIENT');
  }

  // Use a fresh admin client to avoid auth context issues
  const admin = getCleanAdmin();

  const { data: workflows, error } = await admin
    .from('workflows')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('❌ Workflows query error:', error);
    throw new ApiError(500, `Failed to fetch workflows: ${error.message}`, 'DATABASE_ERROR');
  }

  logger.debug(`✅ Found ${workflows.length} workflows for client ${clientId}`);

  res.json({
    success: true,
    data: {
      workflows,
      total: workflows.length
    }
  });
}

/**
 * GET /api/workflows/:workflow_id
 * Get workflow details with stats and recent executions
 */
async function getWorkflow(req, res) {
  const { workflow_id } = req.params;
  const clientId = req.client.id;

  // Fetch workflow
  const { data: workflow, error } = await supabaseAdmin
    .from('workflows')
    .select('*')
    .eq('id', workflow_id)
    .eq('client_id', clientId)
    .single();

  if (error || !workflow) {
    throw new ApiError(404, 'Workflow not found', 'WORKFLOW_NOT_FOUND');
  }

  // Fetch execution stats
  const { data: executions } = await supabaseAdmin
    .from('workflow_executions')
    .select('status, duration_seconds, created_at')
    .eq('workflow_id', workflow_id)
    .order('created_at', { ascending: false })
    .limit(10);

  const totalExecutions = executions?.length || 0;
  const successCount = executions?.filter(e => e.status === 'completed').length || 0;
  const failedCount = executions?.filter(e => e.status === 'failed').length || 0;
  const avgDuration = executions?.length > 0
    ? executions.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / executions.length
    : 0;

  res.json({
    success: true,
    data: {
      workflow,
      stats: {
        total_executions: totalExecutions,
        success_count: successCount,
        failed_count: failedCount,
        success_rate: totalExecutions > 0 ? (successCount / totalExecutions * 100).toFixed(2) : 0,
        avg_duration_seconds: Math.round(avgDuration)
      },
      recent_executions: executions || []
    }
  });
}

/**
 * POST /api/workflows/:workflow_id/execute
 * Execute workflow asynchronously
 * Supports both JSON (standard workflows) and multipart/form-data (nano_banana)
 */
async function executeWorkflow(req, res) {
  const { workflow_id } = req.params;
  const clientId = req.client.id;

  // Fetch workflow
  const { data: workflow, error } = await supabaseAdmin
    .from('workflows')
    .select('*')
    .eq('id', workflow_id)
    .eq('client_id', clientId)
    .single();

  if (error || !workflow) {
    throw new ApiError(404, 'Workflow not found', 'WORKFLOW_NOT_FOUND');
  }

  // Check if workflow is deployed
  if (workflow.status !== 'deployed') {
    throw new ApiError(400, 'Workflow is not deployed', 'WORKFLOW_NOT_DEPLOYED');
  }

  // Prepare input_data based on workflow type
  let input_data;
  let updatedConfig = workflow.config;

  if (workflow.config.workflow_type === 'nano_banana') {
    // Nano Banana workflow: multipart form data with prompts and images
    // Use default values if not provided
    const prompts_text = req.body.prompts_text || process.env.DEFAULT_NANO_BANANA_PROMPT;
    const api_key = req.body.api_key || process.env.DEFAULT_GEMINI_API_KEY;
    const files = req.files || [];

    logger.debug('📥 Received workflow execution request:', {
      hasPromptsText: !!req.body.prompts_text,
      hasApiKey: !!req.body.api_key,
      filesCount: files.length,
      usingDefaultPrompt: !req.body.prompts_text && !!process.env.DEFAULT_NANO_BANANA_PROMPT,
      usingDefaultApiKey: !req.body.api_key && !!process.env.DEFAULT_GEMINI_API_KEY
    });

    // Validate required fields (after applying defaults)
    if (!prompts_text) {
      throw new ApiError(400, 'prompts_text is required and no default is configured', 'MISSING_PROMPTS_TEXT');
    }

    if (!api_key) {
      throw new ApiError(400, 'api_key is required and no default is configured', 'MISSING_API_KEY');
    }

    // Parse and validate prompts
    const prompts = parsePrompts(prompts_text);
    const validation = validatePrompts(prompts, {
      maxPrompts: workflow.config.max_prompts || 100
    });

    if (!validation.valid) {
      throw new ApiError(400, 'Invalid prompts', 'INVALID_PROMPTS', validation.errors);
    }

    // Convert files to base64
    const referenceImages = filesToBase64(files);

    if (referenceImages.length > (workflow.config.max_reference_images || 3)) {
      throw new ApiError(400, `Maximum ${workflow.config.max_reference_images || 3} reference images allowed`, 'TOO_MANY_FILES');
    }

    // Encrypt API key
    const encryptedApiKey = encryptApiKey(api_key);

    // Update workflow config with encrypted API key (ephemeral for this execution)
    updatedConfig = {
      ...workflow.config,
      api_key_encrypted: encryptedApiKey
    };

    // Update workflow with encrypted key
    await supabaseAdmin
      .from('workflows')
      .update({ config: updatedConfig })
      .eq('id', workflow_id);

    // Prepare input data
    input_data = {
      prompts,
      reference_images: referenceImages,
      total_prompts: prompts.length
    };
  } else {
    // Standard workflow: JSON input
    input_data = req.body.input_data;

    if (!input_data) {
      throw new ApiError(400, 'input_data is required', 'MISSING_INPUT_DATA');
    }
  }

  // Create execution record
  const executionId = uuidv4();
  const { data: execution, error: execError } = await supabaseAdmin
    .from('workflow_executions')
    .insert([{
      id: executionId,
      workflow_id: workflow_id,
      client_id: clientId,
      status: 'pending',
      input_data,
      started_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (execError) {
    throw new ApiError(500, 'Failed to create execution', 'EXECUTION_CREATION_FAILED');
  }

  // Add job to queue
  try {
    await addWorkflowJob({
      executionId,
      workflowId: workflow_id,
      clientId,
      inputData: input_data,
      config: updatedConfig
    });

    logWorkflowExecution(executionId, workflow_id, clientId, 'queued');
  } catch (queueError) {
    // Update execution status to failed
    await supabaseAdmin
      .from('workflow_executions')
      .update({
        status: 'failed',
        error_message: 'Failed to queue job',
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId);

    throw new ApiError(500, 'Failed to queue workflow execution', 'QUEUE_ERROR');
  }

  // Create audit log
  await supabaseAdmin.from('audit_logs').insert([{
    client_id: clientId,
    user_id: req.user.id,
    action: 'workflow_executed',
    resource_type: 'workflow_execution',
    resource_id: executionId,
    changes: { workflow_id, status: 'pending' },
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  }]);

  res.status(202).json({
    success: true,
    data: {
      execution_id: executionId,
      status: 'pending',
      message: 'Workflow execution queued successfully'
    }
  });
}

/**
 * GET /api/executions/:execution_id
 * Get execution status and results
 */
async function getExecution(req, res) {
  const { execution_id } = req.params;
  const clientId = req.client.id;

  const { data: execution, error } = await supabaseAdmin
    .from('workflow_executions')
    .select('*')
    .eq('id', execution_id)
    .eq('client_id', clientId)
    .single();

  if (error || !execution) {
    throw new ApiError(404, 'Execution not found', 'EXECUTION_NOT_FOUND');
  }

  // Calculate progress based on status
  let progress = 0;
  switch (execution.status) {
    case 'pending':
      progress = 10;
      break;
    case 'processing':
      progress = 50;
      break;
    case 'completed':
      progress = 100;
      break;
    case 'failed':
      progress = 0;
      break;
  }

  res.json({
    success: true,
    data: {
      id: execution.id,
      workflow_id: execution.workflow_id,
      status: execution.status,
      progress,
      input_data: execution.input_data,
      output_data: execution.output_data,
      error_message: execution.error_message,
      started_at: execution.started_at,
      completed_at: execution.completed_at,
      duration_seconds: execution.duration_seconds,
      retry_count: execution.retry_count
    }
  });
}

/**
 * GET /api/workflows/:workflow_id/executions
 * Get execution history for a workflow
 */
async function getWorkflowExecutions(req, res) {
  const { workflow_id } = req.params;
  const clientId = req.client.id;
  const { limit = 50, offset = 0, status } = req.query;

  // Verify workflow belongs to client
  const { data: workflow } = await supabaseAdmin
    .from('workflows')
    .select('id')
    .eq('id', workflow_id)
    .eq('client_id', clientId)
    .single();

  if (!workflow) {
    throw new ApiError(404, 'Workflow not found', 'WORKFLOW_NOT_FOUND');
  }

  // Build query
  let query = supabaseAdmin
    .from('workflow_executions')
    .select('*', { count: 'exact' })
    .eq('workflow_id', workflow_id)
    .order('created_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: executions, error, count } = await query;

  if (error) {
    throw new ApiError(500, 'Failed to fetch executions', 'DATABASE_ERROR');
  }

  res.json({
    success: true,
    data: {
      executions,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
}

/**
 * GET /api/workflows/:workflow_id/stats
 * Get workflow statistics
 */
async function getWorkflowStats(req, res) {
  const { workflow_id } = req.params;
  const clientId = req.client.id;

  // Verify workflow belongs to client
  const { data: workflow } = await supabaseAdmin
    .from('workflows')
    .select('*')
    .eq('id', workflow_id)
    .eq('client_id', clientId)
    .single();

  if (!workflow) {
    throw new ApiError(404, 'Workflow not found', 'WORKFLOW_NOT_FOUND');
  }

  // Get all executions
  const { data: allExecutions } = await supabaseAdmin
    .from('workflow_executions')
    .select('status, duration_seconds, created_at')
    .eq('workflow_id', workflow_id);

  // Get executions this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthExecutions } = await supabaseAdmin
    .from('workflow_executions')
    .select('status')
    .eq('workflow_id', workflow_id)
    .gte('created_at', startOfMonth.toISOString());

  const totalExecutions = allExecutions?.length || 0;
  const successCount = allExecutions?.filter(e => e.status === 'completed').length || 0;
  const failedCount = allExecutions?.filter(e => e.status === 'failed').length || 0;
  const avgDuration = allExecutions?.length > 0
    ? allExecutions.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / allExecutions.length
    : 0;

  const monthlyExecutions = monthExecutions?.length || 0;
  const monthlyRevenue = monthlyExecutions * (workflow.revenue_per_execution || 0);

  res.json({
    success: true,
    data: {
      total_executions: totalExecutions,
      success_count: successCount,
      failed_count: failedCount,
      success_rate: totalExecutions > 0 ? ((successCount / totalExecutions) * 100).toFixed(2) : 0,
      avg_duration_seconds: Math.round(avgDuration),
      executions_this_month: monthlyExecutions,
      revenue_this_month: monthlyRevenue.toFixed(2)
    }
  });
}

/**
 * GET /api/executions/:execution_id/batch-results
 * Get batch results for an execution (for workflows like nano_banana)
 */
async function getExecutionBatchResults(req, res) {
  const { execution_id } = req.params;
  const clientId = req.client.id;

  // Verify execution belongs to client
  const { data: execution } = await supabaseAdmin
    .from('workflow_executions')
    .select('id, workflow_id')
    .eq('id', execution_id)
    .eq('client_id', clientId)
    .single();

  if (!execution) {
    throw new ApiError(404, 'Execution not found', 'EXECUTION_NOT_FOUND');
  }

  // Fetch batch results
  const { data: batchResults, error } = await supabaseAdmin
    .from('workflow_batch_results')
    .select('*')
    .eq('execution_id', execution_id)
    .order('batch_index', { ascending: true });

  if (error) {
    throw new ApiError(500, 'Failed to fetch batch results', 'DATABASE_ERROR');
  }

  // Fetch stats using the database function
  const { data: stats } = await supabaseAdmin
    .rpc('get_batch_execution_stats', { p_execution_id: execution_id });

  res.json({
    success: true,
    data: {
      execution_id,
      results: batchResults || [],
      stats: stats?.[0] || {
        total_prompts: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        processing: 0,
        total_cost: 0
      },
      total_results: batchResults?.length || 0
    }
  });
}

module.exports = {
  getWorkflows,
  getWorkflow,
  executeWorkflow,
  getExecution,
  getWorkflowExecutions,
  getWorkflowStats,
  getExecutionBatchResults,
  getDashboardStats
};

/**
 * GET /api/workflows/stats/dashboard
 * Get aggregated stats for client dashboard
 */
async function getDashboardStats(req, res) {
  const clientId = req.client.id;

  // Use a fresh admin client to avoid auth context issues
  const admin = getCleanAdmin();

  // 1. Get Active Workflows Count
  const { count: activeWorkflowsCount, error: workflowError } = await admin
    .from('workflows')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('status', 'deployed'); // Assuming 'deployed' means active

  if (workflowError) {
    throw new ApiError(500, `Failed to fetch workflow stats: ${workflowError.message}`, 'DATABASE_ERROR');
  }

  // 2. Get Total Executions Count
  const { count: totalExecutionsCount, error: executionError } = await admin
    .from('workflow_executions')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  if (executionError) {
    throw new ApiError(500, `Failed to fetch execution stats: ${executionError.message}`, 'DATABASE_ERROR');
  }

  // 3. Calculate Success Rate
  const { count: successCount } = await admin
    .from('workflow_executions')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('status', 'completed');

  const successRate = totalExecutionsCount > 0
    ? ((successCount / totalExecutionsCount) * 100).toFixed(1)
    : 0;

  // 4. Calculate Time Saved (Estimate: e.g., 5 mins per execution)
  // This is a placeholder logic, can be refined based on actual business logic
  const estimatedMinutesSavedPerExecution = 5;
  const totalMinutesSaved = (successCount || 0) * estimatedMinutesSavedPerExecution;
  const hoursSaved = Math.floor(totalMinutesSaved / 60);

  res.json({
    success: true,
    data: {
      active_workflows: activeWorkflowsCount || 0,
      total_executions: totalExecutionsCount || 0,
      success_rate: `${successRate}%`,
      time_saved: `${hoursSaved}h`
    }
  });
}
