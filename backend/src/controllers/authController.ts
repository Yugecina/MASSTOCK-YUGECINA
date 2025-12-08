import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { logger } from '../config/logger';
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export async function login(req: Request, res: Response): Promise<void> {
  try {
    // Validate input with Zod
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Authenticate with Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.error('Login failed', { email, error: error.message });
      res.status(401).json({
        message: 'Invalid credentials',
        status: 401
      });
      return;
    }

    // Check if session exists
    if (!data.session) {
      logger.error('No session returned from Supabase', { email });
      res.status(500).json({
        message: 'Authentication failed - no session',
        status: 500
      });
      return;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      logger.error('Failed to fetch user profile', { error: profileError.message });
    }

    // Set httpOnly cookies for tokens
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 15 * 60 * 1000 // 15 minutes
    };

    res.cookie('access_token', data.session.access_token, cookieOptions);
    res.cookie('refresh_token', data.session.refresh_token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile?.role || 'user',
        ...profile
      },
      session: {
        expires_at: data.session.expires_at
      }
    });

  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Validation failed',
        errors: error.issues ? error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })) : [],
        status: 400
      });
      return;
    }

    logger.error('Login error', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email
    });

    // In development, return more details
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({
        message: 'Internal server error',
        error: error.message,
        status: 500
      });
      return;
    }

    res.status(500).json({
      message: 'Internal server error',
      status: 500
    });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    // req.user is already populated by authenticate middleware
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        message: 'Unauthorized',
        status: 401
      });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
        ...user
      }
    });

  } catch (error: any) {
    logger.error('Get me error', { error: error.message });
    res.status(500).json({
      message: 'Internal server error',
      status: 500
    });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    // Get token from cookie or header
    const token = (req as any).cookies?.access_token || (req as any).token;

    if (token) {
      await supabaseAdmin.auth.signOut(token);
    }

    // Clear httpOnly cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.json({ message: 'Logged out successfully' });

  } catch (error: any) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({
      message: 'Internal server error',
      status: 500
    });
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    // Get refresh token from cookie
    const refreshToken = (req as any).cookies?.refresh_token;

    if (!refreshToken) {
      logger.warn('Refresh token missing in request');
      res.status(401).json({
        message: 'No refresh token provided',
        status: 401,
        code: 'NO_REFRESH_TOKEN'
      });
      return;
    }

    // Refresh session with Supabase
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data.session) {
      logger.error('Token refresh failed', {
        error: error?.message,
        hasSession: !!data?.session
      });

      // Clear invalid tokens
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      res.status(401).json({
        message: 'Invalid or expired refresh token',
        status: 401,
        code: 'INVALID_REFRESH_TOKEN'
      });
      return;
    }

    // Set new httpOnly cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 15 * 60 * 1000 // 15 minutes
    };

    res.cookie('access_token', data.session.access_token, cookieOptions);
    res.cookie('refresh_token', data.session.refresh_token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    logger.info('Token refreshed successfully', {
      userId: data.user?.id,
      expiresAt: data.session.expires_at
    });

    res.json({
      success: true,
      session: {
        expires_at: data.session.expires_at
      }
    });

  } catch (error: any) {
    logger.error('Refresh token error', {
      error: error.message,
      stack: error.stack
    });

    // Clear potentially corrupted tokens
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.status(500).json({
      message: 'Internal server error',
      status: 500
    });
  }
}
