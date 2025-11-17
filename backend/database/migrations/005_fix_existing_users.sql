-- ============================================================================
-- MIGRATION 005: Fix Existing Users (Sync auth.users to public.users)
-- ============================================================================
--
-- This migration synchronizes existing users from auth.users to public.users
-- for users that were created via Supabase Dashboard before the trigger was
-- set up or if the trigger failed.
--
-- Problem: Users created via Supabase Dashboard exist in auth.users but not
-- in public.users, causing "User not found" errors during login.
--
-- Solution: Manually sync all auth.users to public.users using INSERT...SELECT
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify the trigger exists
-- ============================================================================
-- Run this query to check if triggers are in place
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Expected result: Should show 'on_auth_user_created', 'on_auth_user_updated', 'on_auth_user_deleted'
-- If empty, run migration 004_auth_sync_trigger.sql first!

-- ============================================================================
-- STEP 2: Diagnose the problem
-- ============================================================================
-- Find users that exist in auth.users but NOT in public.users

SELECT
  au.id,
  au.email,
  au.created_at as auth_created_at,
  au.email_confirmed_at,
  pu.id as public_user_id,
  CASE
    WHEN pu.id IS NULL THEN 'MISSING FROM public.users (NEEDS SYNC)'
    ELSE 'Already synced'
  END as sync_status
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
ORDER BY au.created_at DESC;

-- Users with sync_status = 'MISSING FROM public.users' need to be synced!

-- ============================================================================
-- STEP 3: Sync missing users from auth.users to public.users
-- ============================================================================
-- This will create public.users entries for all auth.users that don't have one

INSERT INTO public.users (
  id,
  email,
  role,
  status,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  'user' as role,  -- Default to 'user' role (can be updated manually later if needed)
  'active' as status,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL  -- Only insert users that don't exist in public.users
ON CONFLICT (id) DO NOTHING;  -- Safety: don't overwrite existing users

-- ============================================================================
-- STEP 4: Verify the sync worked
-- ============================================================================
-- Re-run the diagnostic query to verify all users are now synced

SELECT
  au.id,
  au.email,
  pu.role,
  pu.status,
  CASE
    WHEN pu.id IS NULL THEN 'ERROR: Still missing!'
    ELSE 'Synced successfully'
  END as sync_status
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
ORDER BY au.created_at DESC;

-- All users should now show 'Synced successfully'

-- ============================================================================
-- STEP 5: Manually update roles for admin users (if needed)
-- ============================================================================
-- If you need to make specific users admins, update their role:

-- Example: Make a specific user an admin
-- UPDATE public.users
-- SET role = 'admin', updated_at = NOW()
-- WHERE email = 'admin@masstock.com';

-- ============================================================================
-- STEP 6: Create clients for users who don't have one (if needed)
-- ============================================================================
-- Regular users should have a client. This query finds users without clients:

SELECT
  u.id,
  u.email,
  u.role,
  c.id as client_id,
  CASE
    WHEN u.role = 'user' AND c.id IS NULL THEN 'NEEDS CLIENT'
    WHEN u.role = 'admin' THEN 'Admin (no client needed)'
    ELSE 'Has client'
  END as client_status
FROM public.users u
LEFT JOIN public.clients c ON c.user_id = u.id
ORDER BY u.created_at DESC;

-- For users with 'NEEDS CLIENT' status, create a client manually:
-- Example:
-- INSERT INTO public.clients (
--   user_id,
--   name,
--   email,
--   company_name,
--   plan,
--   status,
--   subscription_amount,
--   subscription_start_date
-- ) VALUES (
--   'user-uuid-here',
--   'Client Name',
--   'client@email.com',
--   'Company Name',
--   'premium_custom',
--   'active',
--   0,
--   CURRENT_DATE
-- );

-- ============================================================================
-- STEP 7: Test that login now works
-- ============================================================================
-- After running this migration, test login via API:
--
-- curl -X POST http://localhost:3000/api/v1/auth/login \
--   -H "Content-Type: application/json" \
--   -d '{"email":"your-email@example.com","password":"your-password"}'
--
-- Should now return success instead of "User not found"!

-- ============================================================================
-- ROLLBACK (use with caution!)
-- ============================================================================
-- If you need to undo the sync (e.g., if you synced the wrong users):
--
-- WARNING: This will delete users from public.users that were just synced!
-- Only use if you know what you're doing!
--
-- DELETE FROM public.users
-- WHERE created_at = updated_at  -- Users synced by this script have matching timestamps
--   AND id IN (
--     SELECT id FROM auth.users
--   );
--
-- Better approach: Manually delete specific users:
-- DELETE FROM public.users WHERE email = 'specific-user@example.com';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. This migration is IDEMPOTENT - safe to run multiple times
-- 2. Uses ON CONFLICT DO NOTHING to avoid duplicates
-- 3. All synced users default to role='user', status='active'
-- 4. Admin users should be updated manually after sync
-- 5. Users without clients can still login, but may have limited functionality
-- 6. Consider creating clients for all 'user' role users
-- 7. The trigger should prevent this issue for new users going forward

-- ============================================================================
-- MONITORING
-- ============================================================================
-- Create a view to monitor auth sync status:

CREATE OR REPLACE VIEW auth_sync_status AS
SELECT
  au.id,
  au.email,
  au.created_at as auth_created,
  pu.id IS NOT NULL as has_public_user,
  pu.role,
  pu.status,
  c.id IS NOT NULL as has_client,
  c.name as client_name,
  c.status as client_status,
  CASE
    WHEN pu.id IS NULL THEN 'ERROR: Missing in public.users'
    WHEN pu.role = 'user' AND c.id IS NULL THEN 'WARNING: User without client'
    WHEN pu.role = 'admin' THEN 'OK: Admin user'
    ELSE 'OK: Fully synced'
  END as sync_status
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
LEFT JOIN public.clients c ON c.user_id = pu.id
ORDER BY au.created_at DESC;

-- Query the view:
-- SELECT * FROM auth_sync_status WHERE sync_status LIKE 'ERROR%' OR sync_status LIKE 'WARNING%';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
