const { supabaseAdmin } = require('../config/database');
const { logger } = require('../config/logger');
const { z } = require('zod');

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

async function login(req, res) {
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
      return res.status(401).json({
        message: 'Invalid credentials',
        status: 401
      });
    }

    // Check if session exists
    if (!data.session) {
      logger.error('No session returned from Supabase', { email });
      return res.status(500).json({
        message: 'Authentication failed - no session',
        status: 500
      });
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
      sameSite: 'lax',
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

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.issues ? error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })) : [],
        status: 400
      });
    }

    logger.error('Login error', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email
    });

    // In development, return more details
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({
        message: 'Internal server error',
        error: error.message,
        status: 500
      });
    }

    res.status(500).json({
      message: 'Internal server error',
      status: 500
    });
  }
}

async function getMe(req, res) {
  try {
    // req.user is already populated by authenticate middleware
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: 'Unauthorized',
        status: 401
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
        ...user
      }
    });

  } catch (error) {
    logger.error('Get me error', { error: error.message });
    res.status(500).json({
      message: 'Internal server error',
      status: 500
    });
  }
}

async function logout(req, res) {
  try {
    // Get token from cookie or header
    const token = req.cookies?.access_token || req.token;

    if (token) {
      await supabaseAdmin.auth.signOut(token);
    }

    // Clear httpOnly cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({
      message: 'Internal server error',
      status: 500
    });
  }
}

module.exports = {
  login,
  getMe,
  logout
};
