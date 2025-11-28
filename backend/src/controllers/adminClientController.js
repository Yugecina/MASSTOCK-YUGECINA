/**
 * Admin Client Controller
 * Handles client management: members, workflows, executions, activity
 */

const { supabaseAdmin } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const { logger } = require('../config/logger');

// ============================================
// CLIENT MEMBERS ENDPOINTS
// ============================================

/**
 * GET /api/v1/admin/clients/:client_id/members
 * List all members of a client
 */
async function getClientMembers(req, res) {
  const { client_id } = req.params;

  logger.debug('AdminClientController.getClientMembers:', { client_id });

  // Verify client exists
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('id, name')
    .eq('id', client_id)
    .single();

  if (clientError || !client) {
    throw new ApiError(404, 'Client not found', 'CLIENT_NOT_FOUND');
  }

  // Get members with user details
  let members = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('client_members')
      .select(`
        id,
        role,
        status,
        invited_at,
        accepted_at,
        created_at,
        user:user_id (
          id,
          email,
          role,
          status,
          last_login,
          created_at
        ),
        invited_by_user:invited_by (
          id,
          email
        )
      `)
      .eq('client_id', client_id)
      .neq('status', 'removed')
      .order('role', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      // If table doesn't exist yet, return empty array
      if (error.code === 'PGRST205' || error.message?.includes('client_members')) {
        logger.warn('AdminClientController.getClientMembers: client_members table not found, returning empty');
        members = [];
      } else {
        logger.error('AdminClientController.getClientMembers error:', { error });
        throw new ApiError(500, 'Failed to fetch client members', 'DATABASE_ERROR');
      }
    } else {
      members = data || [];
    }
  } catch (err) {
    // Handle case where table doesn't exist
    logger.warn('AdminClientController.getClientMembers: Error fetching members, table may not exist', { error: err.message });
    members = [];
  }

  res.json({
    success: true,
    data: {
      client_id,
      client_name: client.name,
      members: members,
      total: members.length,
      owners_count: members.filter(m => m.role === 'owner').length,
      collaborators_count: members.filter(m => m.role === 'collaborator').length
    }
  });
}

/**
 * POST /api/v1/admin/clients/:client_id/members
 * Add a user to a client
 */
async function addClientMember(req, res) {
  const { client_id } = req.params;
  const { user_id, role = 'collaborator' } = req.body;

  logger.debug('AdminClientController.addClientMember:', { client_id, user_id, role });

  // Validate role
  if (!['owner', 'collaborator'].includes(role)) {
    throw new ApiError(400, 'Invalid role. Must be owner or collaborator', 'INVALID_ROLE');
  }

  // Verify client exists
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('id, name')
    .eq('id', client_id)
    .single();

  if (clientError || !client) {
    throw new ApiError(404, 'Client not found', 'CLIENT_NOT_FOUND');
  }

  // Verify user exists
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, status')
    .eq('id', user_id)
    .single();

  if (userError || !user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  if (user.status !== 'active') {
    throw new ApiError(400, 'User is not active', 'USER_NOT_ACTIVE');
  }

  // Check if already a member
  const { data: existingMember } = await supabaseAdmin
    .from('client_members')
    .select('id, status')
    .eq('client_id', client_id)
    .eq('user_id', user_id)
    .single();

  if (existingMember && existingMember.status === 'active') {
    throw new ApiError(400, 'User is already a member of this client', 'ALREADY_MEMBER');
  }

  // If previously removed, reactivate
  if (existingMember && existingMember.status === 'removed') {
    const { data: reactivated, error: reactivateError } = await supabaseAdmin
      .from('client_members')
      .update({
        role,
        status: 'active',
        invited_by: req.user.id,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingMember.id)
      .select()
      .single();

    if (reactivateError) {
      logger.error('AdminClientController.addClientMember reactivate error:', { error: reactivateError });
      throw new ApiError(500, 'Failed to reactivate member', 'DATABASE_ERROR');
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert([{
      client_id,
      user_id: req.user.id,
      action: 'member_reactivated',
      resource_type: 'client_member',
      resource_id: reactivated.id,
      changes: { user_email: user.email, role, reactivated: true },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }]);

    return res.status(200).json({
      success: true,
      message: 'Member reactivated successfully',
      data: reactivated
    });
  }

  // Add new member
  const { data: member, error: insertError } = await supabaseAdmin
    .from('client_members')
    .insert([{
      client_id,
      user_id,
      role,
      status: 'active',
      invited_by: req.user.id,
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (insertError) {
    logger.error('AdminClientController.addClientMember insert error:', { error: insertError });
    throw new ApiError(500, 'Failed to add member', 'DATABASE_ERROR');
  }

  // Audit log
  await supabaseAdmin.from('audit_logs').insert([{
    client_id,
    user_id: req.user.id,
    action: 'member_added',
    resource_type: 'client_member',
    resource_id: member.id,
    changes: { user_email: user.email, role },
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  }]);

  res.status(201).json({
    success: true,
    message: 'Member added successfully',
    data: member
  });
}

/**
 * PUT /api/v1/admin/clients/:client_id/members/:member_id
 * Update member role
 */
async function updateClientMemberRole(req, res) {
  const { client_id, member_id } = req.params;
  const { role } = req.body;

  logger.debug('AdminClientController.updateClientMemberRole:', { client_id, member_id, role });

  // Validate role
  if (!['owner', 'collaborator'].includes(role)) {
    throw new ApiError(400, 'Invalid role. Must be owner or collaborator', 'INVALID_ROLE');
  }

  // Get existing member
  const { data: member, error: fetchError } = await supabaseAdmin
    .from('client_members')
    .select(`
      *,
      user:user_id (email)
    `)
    .eq('id', member_id)
    .eq('client_id', client_id)
    .single();

  if (fetchError || !member) {
    throw new ApiError(404, 'Member not found', 'MEMBER_NOT_FOUND');
  }

  if (member.status !== 'active') {
    throw new ApiError(400, 'Member is not active', 'MEMBER_NOT_ACTIVE');
  }

  // Don't update if same role
  if (member.role === role) {
    return res.json({
      success: true,
      message: 'Member role unchanged',
      data: member
    });
  }

  // Check if this is the last owner (can't demote last owner)
  if (member.role === 'owner' && role === 'collaborator') {
    const { data: owners } = await supabaseAdmin
      .from('client_members')
      .select('id')
      .eq('client_id', client_id)
      .eq('role', 'owner')
      .eq('status', 'active');

    if (owners?.length === 1) {
      throw new ApiError(400, 'Cannot demote the last owner. Promote another member first.', 'LAST_OWNER');
    }
  }

  // Update role
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('client_members')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', member_id)
    .select()
    .single();

  if (updateError) {
    logger.error('AdminClientController.updateClientMemberRole error:', { error: updateError });
    throw new ApiError(500, 'Failed to update member role', 'DATABASE_ERROR');
  }

  // Audit log
  await supabaseAdmin.from('audit_logs').insert([{
    client_id,
    user_id: req.user.id,
    action: 'member_role_updated',
    resource_type: 'client_member',
    resource_id: member_id,
    changes: {
      user_email: member.user?.email,
      before: { role: member.role },
      after: { role }
    },
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  }]);

  res.json({
    success: true,
    message: `Member role updated to ${role}`,
    data: updated
  });
}

/**
 * DELETE /api/v1/admin/clients/:client_id/members/:member_id
 * Remove member from client (soft delete)
 */
async function removeClientMember(req, res) {
  const { client_id, member_id } = req.params;

  logger.debug('AdminClientController.removeClientMember:', { client_id, member_id });

  // Get existing member
  const { data: member, error: fetchError } = await supabaseAdmin
    .from('client_members')
    .select(`
      *,
      user:user_id (email)
    `)
    .eq('id', member_id)
    .eq('client_id', client_id)
    .single();

  if (fetchError || !member) {
    throw new ApiError(404, 'Member not found', 'MEMBER_NOT_FOUND');
  }

  if (member.status === 'removed') {
    throw new ApiError(400, 'Member already removed', 'ALREADY_REMOVED');
  }

  // Check if this is the last owner
  if (member.role === 'owner') {
    const { data: owners } = await supabaseAdmin
      .from('client_members')
      .select('id')
      .eq('client_id', client_id)
      .eq('role', 'owner')
      .eq('status', 'active');

    if (owners?.length === 1) {
      throw new ApiError(400, 'Cannot remove the last owner. Add another owner first.', 'LAST_OWNER');
    }
  }

  // Soft delete
  const { error: updateError } = await supabaseAdmin
    .from('client_members')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('id', member_id);

  if (updateError) {
    logger.error('AdminClientController.removeClientMember error:', { error: updateError });
    throw new ApiError(500, 'Failed to remove member', 'DATABASE_ERROR');
  }

  // Audit log
  await supabaseAdmin.from('audit_logs').insert([{
    client_id,
    user_id: req.user.id,
    action: 'member_removed',
    resource_type: 'client_member',
    resource_id: member_id,
    changes: { user_email: member.user?.email, role: member.role },
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  }]);

  res.json({
    success: true,
    message: 'Member removed successfully'
  });
}

// ============================================
// CLIENT WORKFLOWS ENDPOINTS
// ============================================

/**
 * GET /api/v1/admin/clients/:client_id/workflows
 * List all workflows of a client with stats
 */
async function getClientWorkflows(req, res) {
  const { client_id } = req.params;

  logger.debug('AdminClientController.getClientWorkflows:', { client_id });

  // Verify client exists
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('id, name')
    .eq('id', client_id)
    .single();

  if (clientError || !client) {
    throw new ApiError(404, 'Client not found', 'CLIENT_NOT_FOUND');
  }

  // Get workflows via client_workflows junction table
  const { data: accessList, error } = await supabaseAdmin
    .from('client_workflows')
    .select(`
      workflow_id,
      is_active,
      assigned_at,
      workflow:workflows (*)
    `)
    .eq('client_id', client_id)
    .eq('is_active', true);

  if (error) {
    logger.error('AdminClientController.getClientWorkflows error:', { error });
    throw new ApiError(500, 'Failed to fetch workflows', 'DATABASE_ERROR');
  }

  // Extract workflows and filter out archived ones
  const workflows = accessList
    ?.map(a => a.workflow)
    .filter(w => w && w.status !== 'archived')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || [];

  // Get execution stats for each workflow
  const workflowsWithStats = await Promise.all(
    (workflows || []).map(async (workflow) => {
      const { data: executions } = await supabaseAdmin
        .from('workflow_executions')
        .select('status, created_at')
        .eq('workflow_id', workflow.id);

      const total = executions?.length || 0;
      const completed = executions?.filter(e => e.status === 'completed').length || 0;
      const failed = executions?.filter(e => e.status === 'failed').length || 0;

      return {
        ...workflow,
        stats: {
          total_executions: total,
          completed,
          failed,
          success_rate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
          total_revenue: (completed * (workflow.revenue_per_execution || 0)).toFixed(2)
        }
      };
    })
  );

  res.json({
    success: true,
    data: {
      client_id,
      client_name: client.name,
      workflows: workflowsWithStats,
      total: workflowsWithStats.length
    }
  });
}

/**
 * POST /api/v1/admin/clients/:client_id/workflows
 * Assign a workflow template to a client
 */
async function assignWorkflowToClient(req, res) {
  const { client_id } = req.params;
  const { template_id, name: customName } = req.body;

  logger.debug('AdminClientController.assignWorkflowToClient:', { client_id, template_id });

  // Verify client exists
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('id, name')
    .eq('id', client_id)
    .single();

  if (clientError || !client) {
    throw new ApiError(404, 'Client not found', 'CLIENT_NOT_FOUND');
  }

  // Get template
  const { data: template, error: templateError } = await supabaseAdmin
    .from('workflow_templates')
    .select('*')
    .eq('id', template_id)
    .eq('is_active', true)
    .single();

  if (templateError || !template) {
    throw new ApiError(404, 'Workflow template not found or inactive', 'TEMPLATE_NOT_FOUND');
  }

  // NEW ARCHITECTURE: Check if shared workflow exists for this template
  let { data: sharedWorkflow } = await supabaseAdmin
    .from('workflows')
    .select('id, name')
    .eq('template_id', template_id)
    .is('client_id', null)
    .eq('is_shared', true)
    .eq('status', 'deployed')
    .maybeSingle();

  let workflowId;
  let workflowName = customName || template.name;

  if (!sharedWorkflow) {
    // Create shared workflow (first time for this template)
    logger.debug('Creating new shared workflow for template:', template_id);

    const { data: newWorkflow, error: insertError } = await supabaseAdmin
      .from('workflows')
      .insert([{
        client_id: null,  // SHARED workflow
        template_id,
        name: workflowName,
        description: template.description,
        status: 'deployed',
        config: template.config,
        cost_per_execution: template.cost_per_execution,
        revenue_per_execution: template.revenue_per_execution,
        is_shared: true,
        created_by_user_id: req.user.id,
        deployed_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) {
      logger.error('AdminClientController.assignWorkflowToClient error:', { error: insertError });
      throw new ApiError(500, 'Failed to create shared workflow', 'DATABASE_ERROR');
    }

    workflowId = newWorkflow.id;
  } else {
    // Use existing shared workflow
    logger.debug('Using existing shared workflow:', sharedWorkflow.id);
    workflowId = sharedWorkflow.id;
  }

  // Check if access already exists
  const { data: existingAccess } = await supabaseAdmin
    .from('client_workflows')
    .select('id, is_active')
    .eq('client_id', client_id)
    .eq('workflow_id', workflowId)
    .maybeSingle();

  if (existingAccess) {
    if (existingAccess.is_active) {
      throw new ApiError(400, 'Client already has access to this workflow', 'ALREADY_ASSIGNED');
    } else {
      // Reactivate access
      await supabaseAdmin
        .from('client_workflows')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', existingAccess.id);
    }
  } else {
    // Grant access via client_workflows junction table
    const { error: accessError } = await supabaseAdmin
      .from('client_workflows')
      .insert([{
        client_id,
        workflow_id: workflowId,
        assigned_by: req.user.id,
        is_active: true
      }]);

    if (accessError) {
      logger.error('AdminClientController.assignWorkflowToClient - access error:', { error: accessError });
      throw new ApiError(500, 'Failed to grant workflow access', 'DATABASE_ERROR');
    }
  }

  // Audit log
  await supabaseAdmin.from('audit_logs').insert([{
    client_id,
    user_id: req.user.id,
    action: 'workflow_assigned',
    resource_type: 'workflow',
    resource_id: workflowId,
    changes: {
      template_name: template.name,
      workflow_name: workflowName,
      shared: true
    },
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  }]);

  res.status(201).json({
    success: true,
    message: 'Workflow access granted successfully',
    data: { workflow_id: workflowId, client_id }
  });
}

/**
 * DELETE /api/v1/admin/clients/:client_id/workflows/:workflow_id
 * Remove workflow access from client (NEW ARCHITECTURE: deactivate in junction table)
 */
async function removeClientWorkflow(req, res) {
  const { client_id, workflow_id } = req.params;

  logger.debug('AdminClientController.removeClientWorkflow:', { client_id, workflow_id });

  // Check if access exists
  const { data: access, error: fetchError } = await supabaseAdmin
    .from('client_workflows')
    .select('*')
    .eq('client_id', client_id)
    .eq('workflow_id', workflow_id)
    .single();

  if (fetchError || !access) {
    throw new ApiError(404, 'Workflow access not found', 'ACCESS_NOT_FOUND');
  }

  if (!access.is_active) {
    throw new ApiError(400, 'Workflow access already removed', 'ALREADY_REMOVED');
  }

  // Deactivate access (don't archive the shared workflow itself)
  const { error: updateError } = await supabaseAdmin
    .from('client_workflows')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', access.id);

  if (updateError) {
    logger.error('AdminClientController.removeClientWorkflow error:', { error: updateError });
    throw new ApiError(500, 'Failed to remove workflow access', 'DATABASE_ERROR');
  }

  // Get workflow name for audit log
  const { data: workflow } = await supabaseAdmin
    .from('workflows')
    .select('name')
    .eq('id', workflow_id)
    .single();

  // Audit log
  await supabaseAdmin.from('audit_logs').insert([{
    client_id,
    user_id: req.user.id,
    action: 'workflow_access_removed',
    resource_type: 'workflow',
    resource_id: workflow_id,
    changes: { workflow_name: workflow?.name || 'Unknown' },
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  }]);

  res.json({
    success: true,
    message: 'Workflow access removed successfully'
  });
}

// ============================================
// CLIENT EXECUTIONS ENDPOINTS
// ============================================

/**
 * GET /api/v1/admin/clients/:client_id/executions
 * List all executions of a client with filters
 */
async function getClientExecutions(req, res) {
  const { client_id } = req.params;
  const {
    workflow_id,
    user_id: triggered_by,
    status,
    date_from,
    date_to,
    page = 1,
    limit = 20
  } = req.query;

  logger.debug('AdminClientController.getClientExecutions:', {
    client_id, workflow_id, triggered_by, status, date_from, date_to
  });

  // Verify client exists
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('id, name')
    .eq('id', client_id)
    .single();

  if (clientError || !client) {
    throw new ApiError(404, 'Client not found', 'CLIENT_NOT_FOUND');
  }

  // Build query
  let query = supabaseAdmin
    .from('workflow_executions')
    .select(`
      *,
      workflow:workflow_id (
        id,
        name,
        workflow_type:config->workflow_type
      ),
      triggered_by_user:triggered_by_user_id (
        id,
        email
      )
    `, { count: 'exact' })
    .eq('client_id', client_id)
    .order('created_at', { ascending: false });

  // Apply filters
  if (workflow_id) {
    query = query.eq('workflow_id', workflow_id);
  }
  if (triggered_by) {
    query = query.eq('triggered_by_user_id', triggered_by);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (date_from) {
    query = query.gte('created_at', date_from);
  }
  if (date_to) {
    query = query.lte('created_at', date_to);
  }

  // Pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query = query.range(offset, offset + parseInt(limit) - 1);

  const { data: executions, error, count } = await query;

  if (error) {
    logger.error('AdminClientController.getClientExecutions error:', { error });
    throw new ApiError(500, 'Failed to fetch executions', 'DATABASE_ERROR');
  }

  // Calculate summary stats
  const { data: allExecutions } = await supabaseAdmin
    .from('workflow_executions')
    .select('status')
    .eq('client_id', client_id);

  const stats = {
    total: allExecutions?.length || 0,
    completed: allExecutions?.filter(e => e.status === 'completed').length || 0,
    failed: allExecutions?.filter(e => e.status === 'failed').length || 0,
    pending: allExecutions?.filter(e => e.status === 'pending').length || 0,
    processing: allExecutions?.filter(e => e.status === 'processing').length || 0
  };

  res.json({
    success: true,
    data: {
      client_id,
      client_name: client.name,
      executions: executions || [],
      stats,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(count / parseInt(limit))
      }
    }
  });
}

// ============================================
// CLIENT ACTIVITY ENDPOINTS
// ============================================

/**
 * GET /api/v1/admin/clients/:client_id/activity
 * Get audit logs for a client
 */
async function getClientActivity(req, res) {
  const { client_id } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  logger.debug('AdminClientController.getClientActivity:', { client_id, limit, offset });

  // Verify client exists
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('id, name')
    .eq('id', client_id)
    .single();

  if (clientError || !client) {
    throw new ApiError(404, 'Client not found', 'CLIENT_NOT_FOUND');
  }

  // Get audit logs
  const { data: logs, error, count } = await supabaseAdmin
    .from('audit_logs')
    .select(`
      *,
      user:user_id (
        id,
        email
      )
    `, { count: 'exact' })
    .eq('client_id', client_id)
    .order('created_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (error) {
    logger.error('AdminClientController.getClientActivity error:', { error });
    throw new ApiError(500, 'Failed to fetch activity', 'DATABASE_ERROR');
  }

  res.json({
    success: true,
    data: {
      client_id,
      client_name: client.name,
      activity: logs || [],
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
}

// ============================================
// SEARCH USERS (for adding members)
// ============================================

/**
 * GET /api/v1/admin/users/search
 * Search users for adding to clients
 */
async function searchUsersForMember(req, res) {
  const { q, exclude_client_id } = req.query;

  logger.debug('🔍 AdminClientController.searchUsersForMember: Request received', { 
    q, 
    exclude_client_id,
    qLength: q?.length,
    qType: typeof q
  });

  if (!q || q.length < 2) {
    logger.debug('⚠️  AdminClientController.searchUsersForMember: Query too short, returning empty', { q });
    return res.json({
      success: true,
      data: {
        users: [],
        total: 0
      }
    });
  }

  // Search users by email
  logger.debug('🔎 AdminClientController.searchUsersForMember: Querying database', {
    searchTerm: `%${q}%`,
    filters: { status: 'active', role: 'user' }
  });

  let query = supabaseAdmin
    .from('users')
    .select('id, email, role, status, created_at')
    .eq('status', 'active')
    .eq('role', 'user') // Only regular users, not admins
    .ilike('email', `%${q}%`)
    .limit(10);

  const { data: users, error } = await query;

  logger.debug('📦 AdminClientController.searchUsersForMember: Database response', {
    users,
    usersCount: users?.length,
    error,
    firstUser: users?.[0]
  });

  if (error) {
    logger.error('AdminClientController.searchUsersForMember error:', { error });
    throw new ApiError(500, 'Failed to search users', 'DATABASE_ERROR');
  }

  // If exclude_client_id is provided, filter out existing members
  let filteredUsers = users || [];
  if (exclude_client_id) {
    logger.debug('🔍 AdminClientController.searchUsersForMember: Filtering existing members', { exclude_client_id });
    const { data: existingMembers } = await supabaseAdmin
      .from('client_members')
      .select('user_id')
      .eq('client_id', exclude_client_id)
      .eq('status', 'active');

    logger.debug('📦 AdminClientController.searchUsersForMember: Existing members', {
      existingMembers,
      count: existingMembers?.length
    });

    const existingUserIds = new Set(existingMembers?.map(m => m.user_id) || []);
    filteredUsers = filteredUsers.filter(u => !existingUserIds.has(u.id));
    logger.debug('✂️  AdminClientController.searchUsersForMember: After filtering', {
      filteredCount: filteredUsers.length,
      filteredUsers
    });
  }

  const responseData = {
    success: true,
    data: {
      users: filteredUsers,
      total: filteredUsers.length
    }
  };

  logger.debug('✅ AdminClientController.searchUsersForMember: Sending response', {
    responseData,
    responseKeys: Object.keys(responseData),
    dataKeys: Object.keys(responseData.data),
    usersArray: responseData.data.users,
    usersLength: responseData.data.users.length
  });

  res.json(responseData);
}

module.exports = {
  // Members
  getClientMembers,
  addClientMember,
  updateClientMemberRole,
  removeClientMember,
  // Workflows
  getClientWorkflows,
  assignWorkflowToClient,
  removeClientWorkflow,
  // Executions
  getClientExecutions,
  // Activity
  getClientActivity,
  // Search
  searchUsersForMember
};
