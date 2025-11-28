/**
 * User Sync Helper
 * Shared helper for syncing auth.users to public.users
 */

const { supabaseAdmin } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Sync auth.users to public.users manually
 * This ensures the user exists in both auth.users and public.users
 *
 * @param {string} authUserId - The Supabase auth user ID
 * @param {string} email - The user's email address
 * @param {string} role - The user's role (default: 'user')
 * @returns {Object} The synced user data
 * @throws {ApiError} If sync fails
 */
async function syncAuthToDatabase(authUserId, email, role = 'user') {
  // Insert into public.users if not exists (upsert)
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

module.exports = {
  syncAuthToDatabase
};
