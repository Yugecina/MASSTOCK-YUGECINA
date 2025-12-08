/**
 * Admin Controller
 * Handles admin-only operations: client management, analytics, monitoring
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/database';
import { logAudit } from '../config/logger';
import { ApiError } from '../middleware/errorHandler';
import { syncAuthToDatabase } from '../helpers/userSync';
import {
  createAdminSchema,
  createClientSchema,
  updateClientSchema
} from '../validation/schemas';

/**
 * POST /api/v1/admin/create-admin
 * Create the first admin user (bootstrap endpoint)
 * Protection: Only works if no admin exists
 */
export async function createAdminUser(req: Request, res: Response): Promise<void> {
  // Validate input with Zod
  const validatedData = createAdminSchema.parse(req.body);
  const { email, password, name } = validatedData;

  // Check if any admin already exists (security measure)
  const { data: existingAdmins } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'admin');

  if (existingAdmins && existingAdmins.length > 0) {
    throw new ApiError(403, 'Admin user already exists. Use POST /api/v1/admin/users to create additional users.', 'ADMIN_EXISTS');
  }

  // Check if user with this email already exists
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists', 'USER_EXISTS');
  }

  try {
    // Step 1: Create user in Supabase Auth (auth.users)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: name || 'Admin'
      }
    });

    if (authError) {
      throw new ApiError(400, `Auth creation failed: ${authError.message}`, 'AUTH_CREATION_FAILED');
    }

    // Step 2: Manually insert into public.users (bypass trigger dependency)
    const user = await syncAuthToDatabase(authData.user.id, email, 'admin');

    // Step 3: Create a default admin client (optional, admin doesn't need client)
    // For now, we skip this - admins manage other clients

    // Step 4: Generate access token for immediate login
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError) {
      // User created but can't generate token - that's okay
      res.status(201).json({
        success: true,
        message: 'Admin user created successfully. Please login.',
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
      return;
    }

    // Set httpOnly cookies for tokens (same as login endpoint)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 15 * 60 * 1000 // 15 minutes
    };

    res.cookie('access_token', sessionData.session.access_token, cookieOptions);
    res.cookie('refresh_token', sessionData.session.refresh_token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      },
      session: {
        expires_at: sessionData.session.expires_at
      }
    });

  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
      return;
    }

    // If error is already ApiError, rethrow it
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, `Failed to create admin user: ${error.message}`, 'ADMIN_CREATION_FAILED');
  }
}

/**
 * GET /api/admin/clients
 * Get all clients with filtering and pagination
 */
export async function getClients(req: Request, res: Response): Promise<void> {
  const { limit = 50, offset = 0, status, sort = 'created_at' } = req.query;

  let query = supabaseAdmin
    .from('clients')
    .select('*', { count: 'exact' })
    .order(sort as string, { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

  if (status) {
    query = query.eq('status', status as string);
  }

  const { data: clients, error, count } = await query;

  if (error) {
    throw new ApiError(500, 'Failed to fetch clients', 'DATABASE_ERROR');
  }

  res.json({
    success: true,
    data: {
      clients,
      total: count,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1
    }
  });
}

/**
 * GET /api/admin/clients/:client_id
 * Get client details with workflows, requests, tickets, and stats
 */
export async function getClient(req: Request, res: Response): Promise<void> {
  const { client_id } = req.params;

  // Fetch client
  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', client_id)
    .single();

  if (error || !client) {
    throw new ApiError(404, 'Client not found', 'CLIENT_NOT_FOUND');
  }

  // Fetch workflows
  const { data: workflows } = await supabaseAdmin
    .from('workflows')
    .select('*')
    .eq('client_id', client_id);

  // Fetch workflow requests
  const { data: requests } = await supabaseAdmin
    .from('workflow_requests')
    .select('*')
    .eq('client_id', client_id);

  // Fetch support tickets
  const { data: tickets } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .eq('client_id', client_id);

  // Calculate stats
  const { data: executions } = await supabaseAdmin
    .from('workflow_executions')
    .select('status, created_at')
    .eq('client_id', client_id);

  const totalExecutions = executions?.length || 0;
  const successCount = executions?.filter((e: any) => e.status === 'completed').length || 0;

  // Calculate revenue this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyExecutions = executions?.filter((e: any) =>
    new Date(e.created_at) >= startOfMonth
  ).length || 0;

  const monthlyRevenue = workflows?.reduce((sum: number, w: any) =>
    sum + (w.revenue_per_execution * monthlyExecutions), 0
  ) || 0;

  res.json({
    success: true,
    data: {
      client,
      workflows: workflows || [],
      requests: requests || [],
      tickets: tickets || [],
      stats: {
        total_workflows: workflows?.length || 0,
        total_executions: totalExecutions,
        success_count: successCount,
        success_rate: totalExecutions > 0 ? ((successCount / totalExecutions) * 100).toFixed(2) : 0,
        executions_this_month: monthlyExecutions,
        revenue_this_month: monthlyRevenue.toFixed(2),
        open_tickets: tickets?.filter((t: any) => t.status === 'open').length || 0
      }
    }
  });
}

/**
 * POST /api/admin/clients
 * Create new client (entreprise)
 * Client = company with name, plan, subscription - members added separately
 */
export async function createClient(req: Request, res: Response): Promise<void> {
  try {
    // Validate input with Zod
    const { name, plan, subscription_amount } = createClientSchema.parse(req.body);

    // Check if client with same name already exists
    const { data: existing } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      throw new ApiError(400, 'Client with this name already exists', 'CLIENT_EXISTS');
    }

    // Create client (company)
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert([{
        name,
        plan,
        status: 'active',
        subscription_amount: parseFloat(String(subscription_amount)) || 0,
        subscription_start_date: new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (error) {
      throw new ApiError(500, `Failed to create client: ${error.message}`, 'DATABASE_ERROR');
    }

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert([{
      client_id: client.id,
      user_id: (req as any).user.id,
      action: 'client_created',
      resource_type: 'client',
      resource_id: client.id,
      changes: { name, plan, subscription_amount },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }]);

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client
    });

  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
      return;
    }

    // If error is already ApiError, rethrow it
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, `Failed to create client: ${error.message}`, 'CLIENT_CREATION_FAILED');
  }
}

/**
 * PUT /api/admin/clients/:client_id
 * Update client
 */
export async function updateClient(req: Request, res: Response): Promise<void> {
  try {
    const { client_id } = req.params;

    // Validate input with Zod
    const { name, status, subscription_amount, metadata, plan } = updateClientSchema.parse(req.body);

    // Fetch existing client
    const { data: client, error: fetchError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single();

    if (fetchError || !client) {
      throw new ApiError(404, 'Client not found', 'CLIENT_NOT_FOUND');
    }

    // Build update object
    const updates: any = { updated_at: new Date().toISOString() };
    const changes: any = { before: {}, after: {} };

    if (name && name !== client.name) {
      updates.name = name;
      changes.before.name = client.name;
      changes.after.name = name;
    }

    if (status) {
      updates.status = status;
      changes.before.status = client.status;
      changes.after.status = status;
    }

    if (subscription_amount !== undefined) {
      updates.subscription_amount = parseFloat(String(subscription_amount));
      changes.before.subscription_amount = client.subscription_amount;
      changes.after.subscription_amount = parseFloat(String(subscription_amount));
    }

    if (plan) {
      updates.plan = plan;
      changes.before.plan = client.plan;
      changes.after.plan = plan;
    }

    if (metadata) {
      updates.metadata = { ...client.metadata, ...metadata };
    }

    // Perform update
    const { data: updatedClient, error: updateError } = await supabaseAdmin
      .from('clients')
      .update(updates)
      .eq('id', client_id)
      .select()
      .single();

    if (updateError) {
      throw new ApiError(500, 'Failed to update client', 'UPDATE_FAILED');
    }

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert([{
      client_id: client_id,
      user_id: (req as any).user.id,
      action: 'client_updated',
      resource_type: 'client',
      resource_id: client_id,
      changes,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }]);

    res.json({
      success: true,
      data: updatedClient
    });

  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
      return;
    }

    // If error is already ApiError, rethrow it
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, `Failed to update client: ${error.message}`, 'CLIENT_UPDATE_FAILED');
  }
}

/**
 * DELETE /api/admin/clients/:client_id
 * Delete client (soft delete by setting status to 'deleted')
 */
export async function deleteClient(req: Request, res: Response): Promise<void> {
  const { client_id } = req.params;

  // Update client status to deleted
  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .update({ status: 'suspended' })
    .eq('id', client_id)
    .select()
    .single();

  if (error || !client) {
    throw new ApiError(404, 'Client not found', 'CLIENT_NOT_FOUND');
  }

  // Create audit log
  await supabaseAdmin.from('audit_logs').insert([{
    client_id: client_id,
    user_id: (req as any).user.id,
    action: 'client_deleted',
    resource_type: 'client',
    resource_id: client_id,
    changes: { status: 'suspended' },
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  }]);

  res.json({
    success: true,
    message: 'Client suspended successfully'
  });
}

/**
 * GET /api/admin/dashboard
 * Get admin dashboard statistics
 */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  // Get active clients
  const { data: clients } = await supabaseAdmin
    .from('clients')
    .select('id, status')
    .eq('status', 'active');

  const activeClients = clients?.length || 0;

  // Get executions in last 24h
  const last24h = new Date();
  last24h.setHours(last24h.getHours() - 24);

  const { data: recentExecutions } = await supabaseAdmin
    .from('workflow_executions')
    .select('status')
    .gte('created_at', last24h.toISOString());

  const totalExecutions24h = recentExecutions?.length || 0;
  const errors24h = recentExecutions?.filter((e: any) => e.status === 'failed').length || 0;

  // Calculate uptime (success rate in last 24h)
  const uptimePercent = totalExecutions24h > 0
    ? (((totalExecutions24h - errors24h) / totalExecutions24h) * 100).toFixed(2)
    : 100;

  // Get revenue this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthExecutions } = await supabaseAdmin
    .from('workflow_executions')
    .select('workflow_id, status')
    .gte('created_at', startOfMonth.toISOString())
    .eq('status', 'completed');

  // Get workflows to calculate revenue
  const { data: workflows } = await supabaseAdmin
    .from('workflows')
    .select('id, revenue_per_execution');

  const workflowRevenueMap: any = {};
  workflows?.forEach((w: any) => {
    workflowRevenueMap[w.id] = w.revenue_per_execution;
  });

  const totalRevenueMonth = monthExecutions?.reduce((sum: number, e: any) =>
    sum + (workflowRevenueMap[e.workflow_id] || 0), 0
  ) || 0;

  // Get recent activity (audit logs) with user info
  const { data: recentActivity } = await supabaseAdmin
    .from('audit_logs')
    .select(`
      *,
      user:user_id (
        id,
        email,
        name
      ),
      client:client_id (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(15);

  res.json({
    success: true,
    data: {
      uptime_percent: parseFloat(uptimePercent as string),
      errors_24h: errors24h,
      total_executions_24h: totalExecutions24h,
      total_revenue_month: totalRevenueMonth.toFixed(2),
      active_clients: activeClients,
      recent_activity: recentActivity || []
    }
  });
}

/**
 * GET /api/admin/workflows/stats
 * Get workflow performance metrics
 */
export async function getWorkflowStats(req: Request, res: Response): Promise<void> {
  const { data: workflows } = await supabaseAdmin
    .from('workflows')
    .select('*');

  const workflowStats = await Promise.all(
    (workflows || []).map(async (workflow: any) => {
      const { data: executions } = await supabaseAdmin
        .from('workflow_executions')
        .select('status, duration_seconds')
        .eq('workflow_id', workflow.id);

      const total = executions?.length || 0;
      const successful = executions?.filter((e: any) => e.status === 'completed').length || 0;
      const avgDuration = executions?.length > 0
        ? executions.reduce((sum: number, e: any) => sum + (e.duration_seconds || 0), 0) / executions.length
        : 0;

      return {
        workflow_id: workflow.id,
        workflow_name: workflow.name,
        client_id: workflow.client_id,
        total_executions: total,
        success_count: successful,
        success_rate: total > 0 ? ((successful / total) * 100).toFixed(2) : 0,
        avg_duration_seconds: Math.round(avgDuration),
        revenue_per_execution: workflow.revenue_per_execution,
        cost_per_execution: workflow.cost_per_execution
      };
    })
  );

  res.json({
    success: true,
    data: {
      workflows: workflowStats,
      total: workflowStats.length
    }
  });
}

/**
 * GET /api/admin/errors
 * Get error logs
 */
export async function getErrors(req: Request, res: Response): Promise<void> {
  const { severity, limit = 50, offset = 0 } = req.query;

  // Get failed executions as errors
  let query = supabaseAdmin
    .from('workflow_executions')
    .select('*', { count: 'exact' })
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

  const { data: errors, error, count } = await query;

  if (error) {
    throw new ApiError(500, 'Failed to fetch errors', 'DATABASE_ERROR');
  }

  res.json({
    success: true,
    data: {
      errors: errors || [],
      total: count,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    }
  });
}

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filtering
 */
export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const { client_id, action, limit = 100, offset = 0 } = req.query;

  let query = supabaseAdmin
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

  if (client_id) {
    query = query.eq('client_id', client_id as string);
  }

  if (action) {
    query = query.eq('action', action as string);
  }

  const { data: logs, error, count } = await query;

  if (error) {
    throw new ApiError(500, 'Failed to fetch audit logs', 'DATABASE_ERROR');
  }

  res.json({
    success: true,
    data: {
      logs: logs || [],
      total: count,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    }
  });
}
