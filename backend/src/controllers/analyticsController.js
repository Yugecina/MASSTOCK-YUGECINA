/**
 * Analytics Controller
 * Provides analytics and reporting endpoints for admin dashboard
 *
 * Features:
 * - Overview KPIs (users, executions, revenue, success rates)
 * - Executions trend over time (7d, 30d, 90d)
 * - Workflow performance metrics
 * - Revenue breakdown (by client, by workflow)
 * - Recent failures analysis
 */

const { supabaseAdmin } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Helper: Parse period parameter to days
 */
function parsePeriod(period = '7d') {
  const periodMap = {
    '7d': 7,
    '30d': 30,
    '90d': 90
  };

  if (!periodMap[period]) {
    throw new ApiError(400, 'Invalid period. Must be 7d, 30d, or 90d', 'INVALID_PERIOD');
  }

  return periodMap[period];
}

/**
 * Helper: Calculate date range from period
 */
function getDateRange(days) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  return { startDate, endDate: now };
}

/**
 * Helper: Get start of month
 */
function getMonthStart(monthsAgo = 0) {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * GET /api/v1/admin/analytics/overview
 * Get analytics overview with key metrics
 */
async function getOverview(req, res) {
  try {
    // Get total users count
    const { data: usersCountData } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact' })
      .eq('status', 'active')
      .single();

    const totalUsers = usersCountData?.count || 0;

    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activeUsersCountData } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact' })
      .gte('last_login', thirtyDaysAgo.toISOString())
      .single();

    const activeUsers = activeUsersCountData?.count || 0;

    // Get executions stats (all time)
    const { data: executionsStatsData } = await supabaseAdmin
      .from('workflow_executions')
      .select('total:id.count(), successful:id.count(), failed:id.count()')
      .single();

    const totalExecutions = executionsStatsData?.total || 0;
    const successfulExecutions = executionsStatsData?.successful || 0;
    const failedExecutions = executionsStatsData?.failed || 0;

    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
    const failureRate = totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0;

    // Get revenue this month
    const thisMonthStart = getMonthStart(0);
    const nextMonthStart = getMonthStart(-1);

    const { data: revenueThisMonthData } = await supabaseAdmin
      .from('workflow_executions')
      .select('total_revenue:id.sum()')
      .eq('status', 'completed')
      .gte('created_at', thisMonthStart.toISOString())
      .lt('created_at', nextMonthStart.toISOString())
      .single();

    const revenueThisMonth = parseFloat(revenueThisMonthData?.total_revenue || 0);

    // Get revenue last month
    const lastMonthStart = getMonthStart(1);

    const { data: revenueLastMonthData } = await supabaseAdmin
      .from('workflow_executions')
      .select('total_revenue:id.sum()')
      .eq('status', 'completed')
      .gte('created_at', lastMonthStart.toISOString())
      .lt('created_at', thisMonthStart.toISOString())
      .single();

    const revenueLastMonth = parseFloat(revenueLastMonthData?.total_revenue || 0);

    // Calculate trends
    const successTrend = revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : 0;

    // Get executions this month vs last month for trend
    const { data: executionsThisMonthData } = await supabaseAdmin
      .from('workflow_executions')
      .select('count', { count: 'exact' })
      .gte('created_at', thisMonthStart.toISOString())
      .lt('created_at', nextMonthStart.toISOString())
      .single();

    const { data: executionsLastMonthData } = await supabaseAdmin
      .from('workflow_executions')
      .select('count', { count: 'exact' })
      .gte('created_at', lastMonthStart.toISOString())
      .lt('created_at', thisMonthStart.toISOString())
      .single();

    const executionsThisMonth = executionsThisMonthData?.count || 0;
    const executionsLastMonth = executionsLastMonthData?.count || 0;
    const executionsTrend = executionsLastMonth > 0
      ? ((executionsThisMonth - executionsLastMonth) / executionsLastMonth) * 100
      : 0;

    return res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalExecutions,
        successRate: parseFloat(successRate.toFixed(2)),
        failureRate: parseFloat(failureRate.toFixed(2)),
        revenueThisMonth: parseFloat(revenueThisMonth.toFixed(2)),
        revenueLastMonth: parseFloat(revenueLastMonth.toFixed(2)),
        successTrend: parseFloat(successTrend.toFixed(2)),
        executionsTrend: parseFloat(executionsTrend.toFixed(2))
      }
    });
  } catch (error) {
    throw new ApiError(500, 'Failed to fetch analytics overview', 'ANALYTICS_ERROR');
  }
}

/**
 * GET /api/v1/admin/analytics/executions-trend
 * Get daily executions trend (last N days)
 */
async function getExecutionsTrend(req, res) {
  const { period = '7d' } = req.query;
  const days = parsePeriod(period);

  // Call RPC function (we'll create this as a database function)
  const { data, error } = await supabaseAdmin.rpc('get_executions_trend', { days });

  if (error) {
    throw new ApiError(500, 'Failed to fetch executions trend', 'DATABASE_ERROR');
  }

  return res.json({
    success: true,
    period,
    data: data || []
  });
}

/**
 * GET /api/v1/admin/analytics/workflow-performance
 * Get top workflows by performance
 */
async function getWorkflowPerformance(req, res) {
  const { period = '30d' } = req.query;
  const days = parsePeriod(period);

  // Call RPC function for workflow performance
  const { data, error } = await supabaseAdmin.rpc('get_workflow_performance', { days });

  if (error) {
    throw new ApiError(500, 'Failed to fetch workflow performance', 'DATABASE_ERROR');
  }

  // Transform data and calculate success rates
  const transformedData = (data || []).map(workflow => ({
    id: workflow.id,
    name: workflow.name,
    executions: workflow.executions,
    successRate: workflow.executions > 0
      ? parseFloat(((workflow.successful / workflow.executions) * 100).toFixed(2))
      : 0,
    avgDuration: workflow.avg_duration,
    revenue: workflow.total_revenue
  }));

  return res.json({
    success: true,
    period,
    data: transformedData
  });
}

/**
 * GET /api/v1/admin/analytics/revenue-breakdown
 * Get revenue breakdown by client or workflow
 */
async function getRevenueBreakdown(req, res) {
  const { type = 'client', period = '30d' } = req.query;
  const days = parsePeriod(period);

  // Validate type
  if (!['client', 'workflow'].includes(type)) {
    throw new ApiError(400, 'Invalid type. Must be "client" or "workflow"', 'INVALID_TYPE');
  }

  // Call appropriate RPC function
  const rpcFunction = type === 'client' ? 'get_revenue_by_client' : 'get_revenue_by_workflow';
  const { data, error } = await supabaseAdmin.rpc(rpcFunction, { days });

  if (error) {
    throw new ApiError(500, 'Failed to fetch revenue breakdown', 'DATABASE_ERROR');
  }

  return res.json({
    success: true,
    type,
    period,
    data: data || []
  });
}

/**
 * GET /api/v1/admin/analytics/failures
 * Get recent failed executions with details
 */
async function getFailures(req, res) {
  const { period = '30d', limit = 100 } = req.query;
  const days = parsePeriod(period);
  const { startDate } = getDateRange(days);

  const { data, error } = await supabaseAdmin
    .from('workflow_executions')
    .select(`
      id,
      workflow_id,
      workflows(name),
      client_id,
      clients(name),
      error_message,
      error_stack_trace,
      created_at,
      duration_seconds,
      retry_count
    `)
    .eq('status', 'failed')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(parseInt(limit));

  if (error) {
    throw new ApiError(500, 'Failed to fetch failures', 'DATABASE_ERROR');
  }

  // Transform data to flatten nested objects
  const transformedData = (data || []).map(failure => ({
    id: failure.id,
    workflow_id: failure.workflow_id,
    workflow_name: failure.workflows?.name || 'Unknown',
    client_id: failure.client_id,
    client_name: failure.clients?.name || 'Unknown',
    error_message: failure.error_message,
    error_stack_trace: failure.error_stack_trace,
    created_at: failure.created_at,
    duration_seconds: failure.duration_seconds,
    retry_count: failure.retry_count
  }));

  return res.json({
    success: true,
    period,
    data: transformedData,
    total: transformedData.length
  });
}

module.exports = {
  getOverview,
  getExecutionsTrend,
  getWorkflowPerformance,
  getRevenueBreakdown,
  getFailures
};
