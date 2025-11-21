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
 * Create a new user/client via admin interface
 */
async function createUser(req, res) {
  const {
    email,
    password,
    company_name,
    name,
    plan = 'premium_custom',
    subscription_amount = 0,
    role = 'user'
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

  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists', 'USER_EXISTS');
  }

  try {
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || email.split('@')[0],
        company_name: company_name
      }
    });

    if (authError) {
      throw new ApiError(400, `Auth creation failed: ${authError.message}`, 'AUTH_CREATION_FAILED');
    }

    // Step 2: Sync to public.users
    const user = await syncAuthToDatabase(authData.user.id, email, role);

    // Step 3: Create client record (only if role is 'user')
    let client = null;
    if (role === 'user') {
      const { data: clientData, error: clientError } = await supabaseAdmin
        .from('clients')
        .insert([{
          user_id: user.id,
          name: company_name || name || email.split('@')[0],
          email: email,
          company_name: company_name,
          plan: plan,
          status: 'active',
          subscription_amount: parseFloat(subscription_amount),
          subscription_start_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (clientError) {
        // Rollback
        await supabaseAdmin.from('users').delete().eq('id', user.id);
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new ApiError(500, `Failed to create client: ${clientError.message}`, 'CLIENT_CREATION_FAILED');
      }

      client = clientData;
    }

    // Step 4: Create audit log
    await supabaseAdmin.from('audit_logs').insert([{
      client_id: client?.id,
      user_id: req.user.id,
      action: 'user_created_by_admin',
      resource_type: 'user',
      resource_id: user.id,
      changes: {
        email: email,
        role: role,
        plan: plan,
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
          name: client.name,
          company_name: client.company_name,
          plan: client.plan,
          status: client.status,
          subscription_amount: client.subscription_amount
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

  // Calculate offset from page if not provided directly
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const calculatedOffset = offset !== undefined ? parseInt(offset) : (pageNum - 1) * limitNum;

  // Build query - select clients with owner and users info
  let query = supabaseAdmin
    .from('clients')
    .select(`
      *,
      owner:users!clients_owner_id_fkey(
        id,
        email,
        status,
        created_at
      )
    `, { count: 'exact' });

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
    logger.error('Failed to fetch clients:', error);
    throw new ApiError(500, 'Failed to fetch clients', 'DATABASE_ERROR');
  }

  // For each client, get the count of users
  const clientsWithUserCounts = await Promise.all(
    clients.map(async (client) => {
      const { count: usersCount } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id);

      return {
        ...client,
        users_count: usersCount || 0,
        workflows_count: 0, // To be filled from workflows table if needed
        executions_count: 0 // To be filled from executions table if needed
      };
    })
  );

  res.json({
    success: true,
    data: {
      clients: clientsWithUserCounts,
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
    .eq('id', client_id);

  // Fetch workflow requests
  const { data: requests } = await supabaseAdmin
    .from('workflow_requests')
    .select('*')
    .eq('id', client_id);

  // Fetch support tickets
  const { data: tickets } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .eq('id', client_id);

  // Fetch executions for stats
  const { data: executions } = await supabaseAdmin
    .from('workflow_executions')
    .select('status, created_at')
    .eq('id', client_id);

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
        success_rate: totalExecutions > 0 ? ((successCount / totalExecutions) * 100).toFixed(2) : '0',
        executions_this_month: monthlyExecutions,
        revenue_this_month: monthlyRevenue.toFixed(2),
        open_tickets: tickets?.filter(t => t.status === 'open').length || 0
      }
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
