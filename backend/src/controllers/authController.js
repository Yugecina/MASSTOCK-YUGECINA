/**
 * Authentication Controller
 * Handles user login, logout, token refresh, and profile
 */

const { createClient } = require('@supabase/supabase-js');
const { supabaseAdmin } = require('../config/database');
const { logAuth, logAudit } = require('../config/logger');
const { ApiError } = require('../middleware/errorHandler');

// Create a separate admin client for auth operations to avoid session contamination
function getCleanAdminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

/**
 * POST /api/auth/login
 * User login with email and password
 */
async function login(req, res) {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required', 'MISSING_CREDENTIALS');
  }

  // Authenticate with Supabase
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    logAuth('login_failed', null, { email, error: error.message });
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Fetch user details using a clean admin client (bypasses RLS and avoids session contamination)
  const cleanAdmin = getCleanAdminClient();
  const { data: user, error: userError } = await cleanAdmin
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (userError) {
    logAuth('login_failed', data.user.id, { email, error: userError.message, code: userError.code, details: userError.details });
    throw new ApiError(500, 'Failed to fetch user data: ' + userError.message, 'USER_FETCH_ERROR');
  }

  if (!user) {
    throw new ApiError(401, 'User not found', 'USER_NOT_FOUND');
  }

  // Check user status
  if (user.status === 'suspended') {
    throw new ApiError(403, 'Account suspended', 'ACCOUNT_SUSPENDED');
  }

  if (user.status === 'deleted') {
    throw new ApiError(403, 'Account deleted', 'ACCOUNT_DELETED');
  }

  // Fetch client information
  const { data: client } = await cleanAdmin
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Log successful login
  logAuth('login_success', user.id, { email, client_id: client?.id });

  // Create audit log
  await supabaseAdmin.from('audit_logs').insert([{
    client_id: client?.id,
    user_id: user.id,
    action: 'user_login',
    resource_type: 'user',
    resource_id: user.id,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  }]);

  res.json({
    success: true,
    data: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      },
      client: client || null
    }
  });
}

/**
 * POST /api/auth/logout
 * User logout (invalidate token)
 */
async function logout(req, res) {
  const { error } = await supabaseAdmin.auth.signOut(req.token);

  if (error) {
    logAuth('logout_failed', req.user.id, { error: error.message });
  } else {
    logAuth('logout_success', req.user.id);

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert([{
      client_id: req.client?.id,
      user_id: req.user.id,
      action: 'user_logout',
      resource_type: 'user',
      resource_id: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }]);
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
async function refreshToken(req, res) {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    throw new ApiError(400, 'Refresh token is required', 'MISSING_REFRESH_TOKEN');
  }

  const { data, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token
  });

  if (error) {
    logAuth('token_refresh_failed', null, { error: error.message });
    throw new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  logAuth('token_refreshed', data.user.id);

  res.json({
    success: true,
    data: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in
    }
  });
}

/**
 * GET /api/auth/me
 * Get current user profile and client info
 */
async function getMe(req, res) {
  // User and client already attached by auth middleware
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
        created_at: req.user.created_at,
        last_login: req.user.last_login
      },
      client: req.client ? {
        id: req.client.id,
        name: req.client.name,
        email: req.client.email,
        company_name: req.client.company_name,
        plan: req.client.plan,
        status: req.client.status,
        subscription_amount: req.client.subscription_amount,
        subscription_start_date: req.client.subscription_start_date,
        subscription_end_date: req.client.subscription_end_date,
        created_at: req.client.created_at
      } : null
    }
  });
}

/**
 * POST /api/auth/register (Admin only - for creating new clients)
 * Register new user account
 */
async function register(req, res) {
  const { email, password, name, company_name, plan, subscription_amount } = req.body;

  // Validate input
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required', 'MISSING_CREDENTIALS');
  }

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    throw new ApiError(400, authError.message, 'REGISTRATION_FAILED');
  }

  // Create user record
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .insert([{
      id: authData.user.id,
      email,
      role: 'user',
      status: 'active'
    }])
    .select()
    .single();

  if (userError) {
    // Rollback auth user creation
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw new ApiError(500, 'Failed to create user record', 'USER_CREATION_FAILED');
  }

  // Create client record
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .insert([{
      user_id: user.id,
      name: name || email.split('@')[0],
      email,
      company_name,
      plan: plan || 'premium_custom',
      status: 'active',
      subscription_amount: subscription_amount || 0,
      subscription_start_date: new Date().toISOString().split('T')[0]
    }])
    .select()
    .single();

  if (clientError) {
    throw new ApiError(500, 'Failed to create client record', 'CLIENT_CREATION_FAILED');
  }

  // Log registration
  logAuth('user_registered', user.id, { email, client_id: client.id });

  // Create audit log
  await supabaseAdmin.from('audit_logs').insert([{
    client_id: client.id,
    user_id: req.user?.id || user.id,
    action: 'user_registered',
    resource_type: 'user',
    resource_id: user.id,
    ip_address: req.ip,
    user_agent: req.get('user-agent')
  }]);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      },
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        plan: client.plan,
        status: client.status
      }
    }
  });
}

module.exports = {
  login,
  logout,
  refreshToken,
  getMe,
  register
};
