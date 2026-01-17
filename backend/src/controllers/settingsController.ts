/**
 * Settings Controller
 * Manages user settings, profile, and collaborator management
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import { inviteCollaboratorSchema, updatePreferencesSchema, changePasswordSchema } from '../validation/schemas';

// ============================================
// SECURITY: Log Injection Prevention
// ============================================

/**
 * Sanitize user input before logging to prevent log injection attacks
 *
 * @param input - User-controlled string to sanitize
 * @returns Sanitized string safe for logging
 */
const sanitizeForLog = (input: unknown): string => {
  if (input === null || input === undefined) return '[null]';
  const str = String(input);
  return str.replace(/[\n\r\t]/g, ' ').substring(0, 200);
};

/**
 * GET /api/v1/settings/profile
 * Get current user profile with client information
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.id;

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
  } catch (error: any) {
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
export async function getCollaborators(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.id;
  const clientId = (req as any).client?.id;

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
  } catch (error: any) {
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
export async function inviteCollaborator(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.id;
  const clientId = (req as any).client?.id;
  const userClientRole = (req as any).user.client_role;

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

    // SECURITY: Generate cryptographically secure temporary password (CodeQL fix)
    // Replace Math.random() with crypto.randomBytes() for security-sensitive operations
    const tempPassword = randomBytes(16).toString('base64').slice(0, 12) + 'Temp!123';
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
        invited_by: (req as any).user.email
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
  } catch (error: any) {
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
export async function removeCollaborator(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.id;
  const clientId = (req as any).client?.id;
  const userClientRole = (req as any).user.client_role;
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
    logger.debug('🗑️ removeCollaborator: Removing collaborator', sanitizeForLog(collaborator_id));

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
        removed_by: (req as any).user.email
      },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }]);

    logger.debug('✅ removeCollaborator: Successfully removed', collaborator.email);

    res.json({
      success: true,
      message: 'Collaborator removed successfully'
    });
  } catch (error: any) {
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
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.id;

  // Define inline schema for profile updates
  const updateProfileSchema = z.object({
    email: z.string().email().optional()
  });

  try {
    // Validate input with Zod
    const { email } = updateProfileSchema.parse(req.body);

    // Email updates not allowed through this endpoint
    if (email && email !== (req as any).user.email) {
      throw new ApiError(400, 'Email cannot be changed', 'EMAIL_IMMUTABLE');
    }

    // For now, just return success
    // In the future, add other updatable fields like name, preferences, etc.

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
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
    logger.error('❌ updateProfile: Error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to update profile', 'UPDATE_FAILED');
  }
}

/**
 * GET /api/v1/settings/preferences
 * Get user preferences
 */
export async function getPreferences(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.id;

  try {
    logger.debug('📋 getPreferences: Fetching preferences for user', userId);

    // Get user preferences
    const { data: preferences, error } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected for new users)
      logger.error('❌ getPreferences: Database error:', error);
      throw new ApiError(500, 'Failed to fetch preferences', 'DATABASE_ERROR');
    }

    // If no preferences exist, return defaults
    if (!preferences) {
      logger.debug('✅ getPreferences: No preferences found, returning defaults');
      res.json({
        success: true,
        data: {
          notifications_toast: true,
          notifications_sound: false,
          notifications_email: false,
          language: 'fr',
          date_format: 'DD/MM/YYYY',
          results_per_page: 25,
          theme: 'dark'
        }
      });
      return;
    }

    logger.debug('✅ getPreferences: Preferences fetched successfully');

    res.json({
      success: true,
      data: {
        notifications_toast: preferences.notifications_toast,
        notifications_sound: preferences.notifications_sound,
        notifications_email: preferences.notifications_email,
        language: preferences.language,
        date_format: preferences.date_format,
        results_per_page: preferences.results_per_page,
        theme: preferences.theme
      }
    });
  } catch (error: any) {
    logger.error('❌ getPreferences: Error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to fetch preferences', 'PREFERENCES_FETCH_FAILED');
  }
}

/**
 * PUT /api/v1/settings/preferences
 * Update user preferences
 */
export async function updatePreferences(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.id;

  try {
    // Validate input with Zod
    const validatedData = updatePreferencesSchema.parse(req.body);

    logger.debug('✏️ updatePreferences: Updating preferences for user', userId, validatedData);

    // Check if preferences exist
    const { data: existingPrefs } = await supabaseAdmin
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!existingPrefs) {
      // Create new preferences
      const { data: newPrefs, error: insertError } = await supabaseAdmin
        .from('user_preferences')
        .insert([{
          user_id: userId,
          ...validatedData
        }])
        .select()
        .single();

      if (insertError) {
        logger.error('❌ updatePreferences: Insert error:', insertError);
        throw new ApiError(500, 'Failed to create preferences', 'INSERT_FAILED');
      }

      logger.debug('✅ updatePreferences: Preferences created successfully');
      res.json({
        success: true,
        message: 'Preferences created successfully',
        data: newPrefs
      });
      return;
    }

    // Update existing preferences
    const { data: updatedPrefs, error: updateError } = await supabaseAdmin
      .from('user_preferences')
      .update(validatedData)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      logger.error('❌ updatePreferences: Update error:', updateError);
      throw new ApiError(500, 'Failed to update preferences', 'UPDATE_FAILED');
    }

    logger.debug('✅ updatePreferences: Preferences updated successfully');

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updatedPrefs
    });
  } catch (error: any) {
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
    logger.error('❌ updatePreferences: Error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to update preferences', 'PREFERENCES_UPDATE_FAILED');
  }
}

/**
 * POST /api/v1/settings/change-password
 * Change user password
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.id;
  const userEmail = (req as any).user.email;

  try {
    // Validate input with Zod
    const validatedData = changePasswordSchema.parse(req.body);
    const { current_password, new_password } = validatedData;

    logger.debug('🔐 changePassword: Changing password for user', userId);

    // 1. Verify current password
    const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
      email: userEmail,
      password: current_password
    });

    if (verifyError) {
      logger.error('❌ changePassword: Current password incorrect', { userId });
      throw new ApiError(401, 'Current password is incorrect', 'INVALID_PASSWORD');
    }

    // 2. Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: new_password }
    );

    if (updateError) {
      logger.error('❌ changePassword: Failed to update password:', updateError);
      throw new ApiError(500, 'Failed to update password', 'PASSWORD_UPDATE_FAILED');
    }

    // 3. Create audit log
    await supabaseAdmin.from('audit_logs').insert([{
      user_id: userId,
      action: 'password_changed',
      resource_type: 'user',
      resource_id: userId,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }]);

    logger.debug('✅ changePassword: Password changed successfully');

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
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
    logger.error('❌ changePassword: Error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to change password', 'PASSWORD_CHANGE_FAILED');
  }
}
