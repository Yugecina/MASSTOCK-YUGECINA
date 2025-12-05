/**
 * Settings Controller
 * Manages user settings, profile, and collaborator management
 */

const { supabaseAdmin } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');
const { logger } = require('../config/logger');
const { z } = require('zod');
const { inviteCollaboratorSchema } = require('../validation/schemas');


/**
 * GET /api/v1/settings/profile
 * Get current user profile with client information
 */
async function getProfile(req, res) {
  const userId = req.user.id;

  try {
    logger.debug('📋 getProfile: Fetching profile for user', userId);

    // Get user with client info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        role,
        status,
        client_role,
        client_id,
        created_at,
        last_login,
        client:clients!users_client_id_fkey(
          id,
          name,
          company_name,
          email,
          plan,
          status,
          owner_id,
          created_at,
          owner:users!clients_owner_id_fkey(
            id,
            email
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      logger.error('❌ getProfile: Failed to fetch user:', userError);
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Get collaborators count for the client
    let collaborators_count = 0;
    if (user.client_id) {
      const { count } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', user.client_id);

      collaborators_count = count || 0;
    }

    logger.debug('✅ getProfile: Profile fetched successfully');

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          client_role: user.client_role,
          created_at: user.created_at,
          last_login: user.last_login
        },
        client: user.client ? {
          ...user.client,
          collaborators_count
        } : null
      }
    });
  } catch (error) {
    logger.error('❌ getProfile: Error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to fetch profile', 'PROFILE_FETCH_FAILED');
  }
}

/**
 * GET /api/v1/settings/collaborators
 * Get all collaborators for the user's client
 */
async function getCollaborators(req, res) {
  const userId = req.user.id;
  const clientId = req.client?.id;

  if (!clientId) {
    throw new ApiError(400, 'No client associated with user', 'NO_CLIENT');
  }

  try {
    logger.debug('👥 getCollaborators: Fetching collaborators for client', clientId);

    const { data: collaborators, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, status, client_role, created_at, last_login')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('❌ getCollaborators: Database error:', error);
      throw new ApiError(500, 'Failed to fetch collaborators', 'DATABASE_ERROR');
    }

    logger.debug(`✅ getCollaborators: Found ${collaborators.length} collaborators`);

    res.json({
      success: true,
      data: { collaborators }
    });
  } catch (error) {
    logger.error('❌ getCollaborators: Error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to fetch collaborators', 'COLLABORATORS_FETCH_FAILED');
  }
}

/**
 * POST /api/v1/settings/collaborators/invite
 * Invite a new collaborator (owner only)
 */
async function inviteCollaborator(req, res) {
  const userId = req.user.id;
  const clientId = req.client?.id;
  const userClientRole = req.user.client_role;

  if (!clientId) {
    throw new ApiError(400, 'No client associated with user', 'NO_CLIENT');
  }

  // Only owners can invite collaborators
  if (userClientRole !== 'owner') {
    throw new ApiError(403, 'Only client owners can invite collaborators', 'FORBIDDEN');
  }

  try {
    // Validate input with Zod
    const { email, role } = inviteCollaboratorSchema.parse(req.body);

    logger.debug('✉️ inviteCollaborator: Inviting', email, 'to client', clientId);

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, client_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      if (existingUser.client_id === clientId) {
        throw new ApiError(400, 'User is already a member of this client', 'USER_EXISTS');
      } else if (existingUser.client_id) {
        throw new ApiError(400, 'User is already associated with another client', 'USER_HAS_CLIENT');
      }
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'Temp!123';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false, // User will need to confirm email
      user_metadata: {
        invited_by: userId,
        client_id: clientId
      }
    });

    if (authError) {
      logger.error('❌ inviteCollaborator: Auth error:', authError);
      throw new ApiError(400, `Failed to create user: ${authError.message}`, 'AUTH_ERROR');
    }

    // Create user record in public.users
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: authData.user.id,
        email,
        password_hash: hashedPassword,
        role,
        status: 'active',
        client_id: clientId,
        client_role: 'collaborator'
      }])
      .select()
      .single();

    if (userError) {
      logger.error('❌ inviteCollaborator: User creation error:', userError);
      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new ApiError(500, 'Failed to create user record', 'USER_CREATION_FAILED');
    }

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert([{
      client_id: clientId,
      user_id: userId,
      action: 'collaborator_invited',
      resource_type: 'user',
      resource_id: newUser.id,
      changes: {
        email,
        invited_by: req.user.email
      },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }]);

    logger.debug('✅ inviteCollaborator: Successfully invited', email);

    res.status(201).json({
      success: true,
      message: 'Collaborator invited successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          client_role: newUser.client_role,
          status: newUser.status
        },
        temp_password: tempPassword // In production, this should be sent via email
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    logger.error('❌ inviteCollaborator: Error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to invite collaborator', 'INVITE_FAILED');
  }
}

/**
 * DELETE /api/v1/settings/collaborators/:collaborator_id
 * Remove a collaborator (owner only)
 */
async function removeCollaborator(req, res) {
  const userId = req.user.id;
  const clientId = req.client?.id;
  const userClientRole = req.user.client_role;
  const { collaborator_id } = req.params;

  if (!clientId) {
    throw new ApiError(400, 'No client associated with user', 'NO_CLIENT');
  }

  // Only owners can remove collaborators
  if (userClientRole !== 'owner') {
    throw new ApiError(403, 'Only client owners can remove collaborators', 'FORBIDDEN');
  }

  // Cannot remove yourself
  if (collaborator_id === userId) {
    throw new ApiError(400, 'Cannot remove yourself', 'CANNOT_REMOVE_SELF');
  }

  try {
    logger.debug('🗑️ removeCollaborator: Removing collaborator', collaborator_id);

    // Verify collaborator belongs to same client
    const { data: collaborator } = await supabaseAdmin
      .from('users')
      .select('id, email, client_id, client_role')
      .eq('id', collaborator_id)
      .single();

    if (!collaborator) {
      throw new ApiError(404, 'Collaborator not found', 'COLLABORATOR_NOT_FOUND');
    }

    if (collaborator.client_id !== clientId) {
      throw new ApiError(403, 'Collaborator does not belong to your client', 'FORBIDDEN');
    }

    // Cannot remove owner
    if (collaborator.client_role === 'owner') {
      throw new ApiError(400, 'Cannot remove the client owner', 'CANNOT_REMOVE_OWNER');
    }

    // Remove client association
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        client_id: null,
        client_role: null,
        status: 'suspended'
      })
      .eq('id', collaborator_id);

    if (updateError) {
      logger.error('❌ removeCollaborator: Update error:', updateError);
      throw new ApiError(500, 'Failed to remove collaborator', 'UPDATE_FAILED');
    }

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert([{
      client_id: clientId,
      user_id: userId,
      action: 'collaborator_removed',
      resource_type: 'user',
      resource_id: collaborator_id,
      changes: {
        removed_user: collaborator.email,
        removed_by: req.user.email
      },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }]);

    logger.debug('✅ removeCollaborator: Successfully removed', collaborator.email);

    res.json({
      success: true,
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    logger.error('❌ removeCollaborator: Error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to remove collaborator', 'REMOVE_FAILED');
  }
}

/**
 * PUT /api/v1/settings/profile
 * Update user profile (limited fields)
 */
async function updateProfile(req, res) {
  const userId = req.user.id;

  // Define inline schema for profile updates
  const updateProfileSchema = z.object({
    email: z.string().email().optional()
  });

  try {
    // Validate input with Zod
    const { email } = updateProfileSchema.parse(req.body);

    // Email updates not allowed through this endpoint
    if (email && email !== req.user.email) {
      throw new ApiError(400, 'Email cannot be changed', 'EMAIL_IMMUTABLE');
    }

    // For now, just return success
    // In the future, add other updatable fields like name, preferences, etc.

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    logger.error('❌ updateProfile: Error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to update profile', 'UPDATE_FAILED');
  }
}

module.exports = {
  getProfile,
  getCollaborators,
  inviteCollaborator,
  removeCollaborator,
  updateProfile
};
