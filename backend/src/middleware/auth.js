/**
 * Authentication Middleware
 * JWT token validation and user context extraction
 */

const { createClient } = require('@supabase/supabase-js');
const { supabaseAdmin } = require('../config/database');
const { logger, logAuth, logError } = require('../config/logger');

// Create a clean admin client to avoid RLS issues
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
 * Verify JWT token and extract user
 */
async function authenticate(req, res, next) {
  try {
    // Extract token from httpOnly cookie or fallback to Authorization header
    let token = req.cookies?.access_token;

    if (!token) {
      // Fallback to Authorization header for backward compatibility
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization token',
        code: 'UNAUTHORIZED'
      });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logAuth('token_verification_failed', null, { error: error?.message });
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Fetch user from database using clean admin client (bypasses RLS)
    const cleanAdmin = getCleanAdminClient();
    const { data: dbUser, error: dbError } = await cleanAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (dbError || !dbUser) {
      logError(new Error('User not found in database'), { user_id: user.id, error: dbError?.message });
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is suspended or deleted
    if (dbUser.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account suspended',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    if (dbUser.status === 'deleted') {
      return res.status(403).json({
        success: false,
        error: 'Account deleted',
        code: 'ACCOUNT_DELETED'
      });
    }

    // Fetch client information using new structure (users.client_id -> clients.id)
    let client = null;
    if (dbUser.client_id) {
      const { data: clientData, error: clientError } = await cleanAdmin
        .from('clients')
        .select('*')
        .eq('id', dbUser.client_id)
        .maybeSingle();

      client = clientData;

      if (clientError) {
        logger.error('Failed to fetch client:', clientError);
      }
    }

    // Attach user and client to request
    req.user = dbUser;
    req.client = client || null;
    req.token = token;

    // Update last_login timestamp
    await cleanAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', dbUser.id);

    next();
  } catch (error) {
    logError(error, { middleware: 'authenticate' });
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Require admin role
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      code: 'FORBIDDEN'
    });
  }

  next();
}

/**
 * Require active client
 */
function requireClient(req, res, next) {
  if (!req.client) {
    return res.status(403).json({
      success: false,
      error: 'No active client account',
      code: 'NO_CLIENT_ACCOUNT'
    });
  }

  if (req.client.status !== 'active') {
    return res.status(403).json({
      success: false,
      error: `Client account is ${req.client.status}`,
      code: 'CLIENT_NOT_ACTIVE'
    });
  }

  next();
}

/**
 * Optional authentication (doesn't fail if no token)
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase (but don't fail if invalid)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      // Invalid token but continue without authentication
      return next();
    }

    // Fetch user from database using clean admin client
    const cleanAdmin = getCleanAdminClient();
    const { data: dbUser, error: dbError } = await cleanAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (dbError || !dbUser || dbUser.status !== 'active') {
      // User not found or not active, continue without authentication
      return next();
    }

    // Fetch client information using dbUser.client_id (same logic as authenticate)
    let client = null;
    if (dbUser.client_id) {
      const { data: clientData } = await cleanAdmin
        .from('clients')
        .select('*')
        .eq('id', dbUser.client_id)
        .maybeSingle();

      client = clientData;
    }

    // Attach user and client to request
    req.user = dbUser;
    req.client = client || null;
    req.token = token;

    next();
  } catch (error) {
    // Continue without authentication on any error
    next();
  }
}

module.exports = {
  authenticate,
  requireAdmin,
  requireClient,
  optionalAuth
};
