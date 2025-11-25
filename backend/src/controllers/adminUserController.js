/**
 * Admin User Controller
 * Enhanced user and client management with search and pagination
 */

const { supabaseAdmin } = require('../config/database');
const { logAudit } = require('../config/logger');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Helper function: Sync auth.users to public.users manually
 */
async function syncAuthToDatabase(authUserId, email, role = 'user') {
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .upsert(
      {
        id: authUserId,
        email: email,
        role: role,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        onConflict: ['id']
      }
    )
    .select()
    .single();

  if (userError) {
    throw new ApiError(500, `Failed to sync user to database: ${userError.message}`, 'USER_SYNC_FAILED');
  }

  return userData;
}

/**
 * POST /api/v1/admin/users
 * Create a new user via admin interface
 * - For role='user': client_id is REQUIRED, creates entry in client_members
 * - For role='admin': no client association needed
 */
async function createUser(req, res) {
  const {
    email,
    password,
    name,
    role = 'user',
    client_id,
    member_role = 'collaborator'
  } = req.body;

  // Validate input
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required', 'MISSING_REQUIRED_FIELDS');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters', 'WEAK_PASSWORD');
  }

  if (!['user', 'admin'].includes(role)) {
    throw new ApiError(400, 'Role must be either "user" or "admin"', 'INVALID_ROLE');
  }

  // For regular users, client_id is required
  if (role === 'user' && !client_id) {
    throw new ApiError(400, 'client_id is required for regular users', 'CLIENT_ID_REQUIRED');
  }

  // Validate member_role
  if (role === 'user' && !['owner', 'collaborator'].includes(member_role)) {
    throw new ApiError(400, 'member_role must be "owner" or "collaborator"', 'INVALID_MEMBER_ROLE');
  }

  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists', 'USER_EXISTS');
  }

  // If client_id provided, verify the client exists
  let client = null;
  if (client_id) {
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, name')
      .eq('id', client_id)
      .single();

    if (clientError || !clientData) {
      throw new ApiError(404, 'Client not found', 'CLIENT_NOT_FOUND');
    }
    client = clientData;
  }

  try {
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || email.split('@')[0]
      }
    });

    if (authError) {
      throw new ApiError(400, `Auth creation failed: ${authError.message}`, 'AUTH_CREATION_FAILED');
    }

    // Step 2: Sync to public.users
    const user = await syncAuthToDatabase(authData.user.id, email, role);

    // Step 3: Create client_members entry (only if role is 'user' and client_id provided)
    let membership = null;
    if (role === 'user' && client_id) {
      const { data: memberData, error: memberError } = await supabaseAdmin
        .from('client_members')
        .insert([{
          client_id: client_id,
          user_id: user.id,
          role: member_role,
          status: 'active',
          invited_by: req.user.id,
          invited_at: new Date().toISOString(),
          accepted_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (memberError) {
        // Rollback
        await supabaseAdmin.from('users').delete().eq('id', user.id);
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new ApiError(500, `Failed to add user to client: ${memberError.message}`, 'MEMBER_CREATION_FAILED');
      }

      membership = memberData;
    }

    // Step 4: Create audit log
    await supabaseAdmin.from('audit_logs').insert([{
      client_id: client_id || null,
      user_id: req.user.id,
      action: 'user_created_by_admin',
      resource_type: 'user',
      resource_id: user.id,
      changes: {
        email: email,
        role: role,
        client_id: client_id,
        member_role: member_role,
        created_by: req.user.email
      },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status
        },
        client: client ? {
          id: client.id,
          name: client.name
        } : null,
        membership: membership ? {
          id: membership.id,
          role: membership.role,
          status: membership.status
        } : null,
        credentials: {
          email: email,
          note: 'User created successfully. Credentials have been sent to the user via secure channel.'
        }
      }
    });

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to create user: ${error.message}`, 'USER_CREATION_FAILED');
  }
}

/**
 * GET /api/v1/admin/users
 * Get all users with their client information
 */
async function getUsers(req, res) {
  const {
    page = 1,
    limit = 50,
    offset,
    role,
    client_role,
    status,
    search,
    sort = 'created_at'
  } = req.query;

  // Calculate offset from page if not provided directly
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const calculatedOffset = offset !== undefined ? parseInt(offset) : (pageNum - 1) * limitNum;

  // Build query - select users with client info
  let query = supabaseAdmin
    .from('users')
    .select(`
      *,
      client:clients!users_client_id_fkey(
        id,
        name,
        company_name,
        email,
        plan,
        status
      )
    `, { count: 'exact' });

  // Apply filters
  if (role) {
    query = query.eq('role', role);
  }

  if (client_role) {
    query = query.eq('client_role', client_role);
  }

  if (status) {
    query = query.eq('status', status);
  }

  // Apply search (email only for users)
  if (search) {
    query = query.ilike('email', `%${search}%`);
  }

  // Apply sorting and pagination
  query = query
    .order(sort, { ascending: false })
    .range(calculatedOffset, calculatedOffset + limitNum - 1);

  const { data: users, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch users:', error);
    throw new ApiError(500, 'Failed to fetch users', 'DATABASE_ERROR');
  }

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        total: count,
        limit: limitNum,
        offset: calculatedOffset,
        page: pageNum,
        totalPages: Math.ceil(count / limitNum)
      }
    }
  });
}

/**
 * GET /api/v1/admin/clients
 * Get all clients with filtering, pagination, and search
 */
async function getClients(req, res) {
  const {
    page = 1,
    limit = 50,
    offset,
    status,
    plan,
    search,
    sort = 'created_at'
  } = req.query;

  console.log('📊 AdminUserController.getClients: Loading clients list', {
    page, limit, status, plan, search, sort
  });

  // Calculate offset from page if not provided directly
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const calculatedOffset = offset !== undefined ? parseInt(offset) : (pageNum - 1) * limitNum;

  // Build query - select clients (no more owner FK since user_id was dropped)
  let query = supabaseAdmin
    .from('clients')
    .select('*', { count: 'exact' });

  // Apply filters first
  if (status) {
    query = query.eq('status', status);
  }

  if (plan) {
    query = query.eq('plan', plan);
  }

  // Apply search (email or company_name)
  if (search) {
    query = query.or(`email.ilike.%${search}%,company_name.ilike.%${search}%,name.ilike.%${search}%`);
  }

  // Apply sorting and pagination last
  query = query
    .order(sort, { ascending: false })
    .range(calculatedOffset, calculatedOffset + limitNum - 1);

  const { data: clients, error, count } = await query;

  if (error) {
    console.error('❌ AdminUserController.getClients: Database error', { error });
    throw new ApiError(500, 'Failed to fetch clients', 'DATABASE_ERROR');
  }

  console.log('✅ AdminUserController.getClients: Clients fetched', {
    count: clients?.length || 0,
    total: count
  });

  // For each client, get owner (from client_members), users count, workflows count, executions count
  const clientsWithCounts = await Promise.all(
    (clients || []).map(async (client) => {
      // Get owner from client_members
      const { data: owners } = await supabaseAdmin
        .from('client_members')
        .select(`
          id,
          user:user_id (
            id,
            email,
            status,
            created_at
          )
        `)
        .eq('client_id', client.id)
        .eq('role', 'owner')
        .eq('status', 'active')
        .limit(1);

      // Get total members count
      const { count: membersCount } = await supabaseAdmin
        .from('client_members')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('status', 'active');

      // Get workflows count
      const { count: workflowsCount } = await supabaseAdmin
        .from('workflows')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .neq('status', 'archived');

      // Get executions count
      const { count: executionsCount } = await supabaseAdmin
        .from('workflow_executions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id);

      return {
        ...client,
        owner: owners?.[0]?.user || null,
        users_count: membersCount || 0,
        workflows_count: workflowsCount || 0,
        executions_count: executionsCount || 0
      };
    })
  );

  console.log('✅ AdminUserController.getClients: Response ready', {
    clientsCount: clientsWithCounts.length,
    pagination: { total: count, page: pageNum, limit: limitNum }
  });

  res.json({
    success: true,
    data: {
      clients: clientsWithCounts,
      pagination: {
        total: count,
        limit: limitNum,
        offset: calculatedOffset,
        page: pageNum,
        totalPages: Math.ceil(count / limitNum)
      }
    }
  });
}

/**
 * GET /api/v1/admin/clients/:client_id
 * Get client details with aggregated stats
 */
async function getClient(req, res) {
  const { client_id } = req.params;

  console.log('📊 AdminUserController.getClient: Loading client details', { client_id });

  // Fetch client
  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', client_id)
    .single();

  if (error || !client) {
    console.error('❌ AdminUserController.getClient: Client not found', { client_id, error });
    throw new ApiError(404, 'Client not found', 'CLIENT_NOT_FOUND');
  }

  console.log('✅ AdminUserController.getClient: Client found', {
    clientId: client.id,
    name: client.name
  });

  // Fetch workflows - FIX: use client_id not id
  const { data: workflows, error: workflowsError } = await supabaseAdmin
    .from('workflows')
    .select('*')
    .eq('client_id', client_id);

  console.log('📦 AdminUserController.getClient: Workflows fetched', {
    count: workflows?.length || 0,
    error: workflowsError?.message
  });

  // Fetch workflow requests - FIX: use client_id not id
  const { data: requests, error: requestsError } = await supabaseAdmin
    .from('workflow_requests')
    .select('*')
    .eq('client_id', client_id);

  console.log('📦 AdminUserController.getClient: Requests fetched', {
    count: requests?.length || 0,
    error: requestsError?.message
  });

  // Fetch support tickets - FIX: use client_id not id
  const { data: tickets, error: ticketsError } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .eq('client_id', client_id);

  console.log('📦 AdminUserController.getClient: Tickets fetched', {
    count: tickets?.length || 0,
    error: ticketsError?.message
  });

  // Fetch executions for stats - FIX: use client_id not id
  const { data: executions, error: executionsError } = await supabaseAdmin
    .from('workflow_executions')
    .select('status, created_at')
    .eq('client_id', client_id);

  console.log('📦 AdminUserController.getClient: Executions fetched', {
    count: executions?.length || 0,
    error: executionsError?.message
  });

  const totalExecutions = executions?.length || 0;
  const successCount = executions?.filter(e => e.status === 'completed').length || 0;

  // Calculate revenue this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyExecutions = executions?.filter(e =>
    new Date(e.created_at) >= startOfMonth
  ).length || 0;

  const monthlyRevenue = workflows?.reduce((sum, w) =>
    sum + ((w.revenue_per_execution || 0) * monthlyExecutions), 0
  ) || 0;

  // Fetch members count
  const { data: members, error: membersError } = await supabaseAdmin
    .from('client_members')
    .select('id, role')
    .eq('client_id', client_id)
    .eq('status', 'active');

  console.log('📦 AdminUserController.getClient: Members fetched', {
    count: members?.length || 0,
    error: membersError?.message
  });

  const stats = {
    total_workflows: workflows?.length || 0,
    total_executions: totalExecutions,
    success_count: successCount,
    success_rate: totalExecutions > 0 ? ((successCount / totalExecutions) * 100).toFixed(2) : '0',
    executions_this_month: monthlyExecutions,
    revenue_this_month: monthlyRevenue.toFixed(2),
    open_tickets: tickets?.filter(t => t.status === 'open').length || 0,
    total_members: members?.length || 0,
    owners_count: members?.filter(m => m.role === 'owner').length || 0,
    collaborators_count: members?.filter(m => m.role === 'collaborator').length || 0
  };

  console.log('✅ AdminUserController.getClient: Response ready', {
    clientId: client.id,
    stats
  });

  res.json({
    success: true,
    data: {
      client,
      workflows: workflows || [],
      requests: requests || [],
      tickets: tickets || [],
      stats
    }
  });
}

/**
 * PUT /api/v1/admin/clients/:client_id
 * Update client details
 */
async function updateClient(req, res) {
  const { client_id } = req.params;
  const { status, subscription_amount, metadata, plan, name, company_name } = req.body;

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
  const updates = {};
  const changes = { before: {}, after: {} };

  if (status) {
    updates.status = status;
    changes.before.status = client.status;
    changes.after.status = status;
  }

  if (subscription_amount !== undefined) {
    updates.subscription_amount = subscription_amount;
    changes.before.subscription_amount = client.subscription_amount;
    changes.after.subscription_amount = subscription_amount;
  }

  if (plan) {
    updates.plan = plan;
    changes.before.plan = client.plan;
    changes.after.plan = plan;
  }

  if (name) {
    updates.name = name;
    changes.before.name = client.name;
    changes.after.name = name;
  }

  if (company_name) {
    updates.company_name = company_name;
    changes.before.company_name = client.company_name;
    changes.after.company_name = company_name;
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
    user_id: req.user.id,
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
}

/**
 * DELETE /api/v1/admin/clients/:client_id
 * Soft delete client (set status to suspended)
 */
async function deleteClient(req, res) {
  const { client_id } = req.params;

  // Update client status to suspended
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
    user_id: req.user.id,
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

module.exports = {
  createUser,
  getUsers,
  getClients,
  getClient,
  updateClient,
  deleteClient
};
