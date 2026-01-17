/**
 * Authentication Middleware
 * JWT token validation and user context extraction
 */

import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/database';
import { logger, logAuth, logError } from '../config/logger';

// Type definitions
interface AuthRequest extends Request {
  user?: any;
  client?: any;
  token?: string;
}

interface DbUser {
  id: string;
  email: string;
  role: string;
  status: string;
  client_id?: string;
  last_login?: string;
  [key: string]: any;
}

interface Client {
  id: string;
  status: string;
  [key: string]: any;
}

// Create a clean admin client to avoid RLS issues
function getCleanAdminClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // SECURITY: Extract token from httpOnly cookie (preferred) or Authorization header
    let token = req.cookies?.access_token;

    if (!token) {
      // Fallback to Authorization header for backward compatibility
      const authHeader = req.headers.authorization;
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const extractedToken = authHeader.substring(7).trim();

        // SECURITY: Validate JWT format (CodeQL fix - prevent user-controlled bypass)
        // JWT tokens have 3 parts separated by dots (header.payload.signature)
        // Each part is base64url-encoded (alphanumeric + - _ characters)
        const jwtPattern = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/;

        if (extractedToken && jwtPattern.test(extractedToken)) {
          token = extractedToken;
        } else {
          // Invalid JWT format - reject immediately
          res.status(401).json({
            success: false,
            error: 'Invalid token format',
            code: 'INVALID_TOKEN_FORMAT'
          });
          return;
        }
      }
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization token',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logAuth('token_verification_failed', null, { error: error?.message });
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
      return;
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
      res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Check if user is suspended or deleted
    if (dbUser.status === 'suspended') {
      res.status(403).json({
        success: false,
        error: 'Account suspended',
        code: 'ACCOUNT_SUSPENDED'
      });
      return;
    }

    if (dbUser.status === 'deleted') {
      res.status(403).json({
        success: false,
        error: 'Account deleted',
        code: 'ACCOUNT_DELETED'
      });
      return;
    }

    // Fetch client information using new structure (users.client_id -> clients.id)
    let client: Client | null = null;
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
    logError(error as Error, { middleware: 'authenticate' });
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Require admin role
 */
function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
      code: 'FORBIDDEN'
    });
    return;
  }

  next();
}

/**
 * Require active client
 */
function requireClient(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.client) {
    res.status(403).json({
      success: false,
      error: 'No active client account',
      code: 'NO_CLIENT_ACCOUNT'
    });
    return;
  }

  if (req.client.status !== 'active') {
    res.status(403).json({
      success: false,
      error: `Client account is ${req.client.status}`,
      code: 'CLIENT_NOT_ACTIVE'
    });
    return;
  }

  next();
}

/**
 * Optional authentication (doesn't fail if no token)
 */
async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase (but don't fail if invalid)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      // Invalid token but continue without authentication
      next();
      return;
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
      next();
      return;
    }

    // Fetch client information using dbUser.client_id (same logic as authenticate)
    let client: Client | null = null;
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

export {
  authenticate,
  requireAdmin,
  requireClient,
  optionalAuth
};
