-- ============================================================================
-- Fix RLS Infinite Recursion Issue
-- Migration 006
-- Date: 2025-11-15
-- ============================================================================

-- PROBLEM: The RLS policy for users table causes infinite recursion because it
-- queries the users table itself to check if the user is an admin.

-- SOLUTION: Create helper functions with SECURITY DEFINER that bypass RLS,
-- then use those functions in the policies.

-- ============================================================================
-- Step 1: Drop problematic policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP FUNCTION IF EXISTS is_admin();

-- ============================================================================
-- Step 2: Create helper function with SECURITY DEFINER (bypasses RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION auth.is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Use SELECT with SECURITY DEFINER to bypass RLS
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 3: Recreate the admin policy using the helper function
-- ============================================================================

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT
    USING (auth.is_admin_user());

-- ============================================================================
-- Step 4: Recreate the is_admin() function for backwards compatibility
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.is_admin_user();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 5: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION auth.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_admin_user() TO anon;
GRANT EXECUTE ON FUNCTION auth.is_admin_user() TO service_role;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- ============================================================================
-- Verification
-- ============================================================================

-- You can verify the fix by running:
-- SELECT auth.is_admin_user();
-- This should return TRUE for admins, FALSE for regular users, without recursion.

COMMENT ON FUNCTION auth.is_admin_user() IS 'Checks if the current user is an admin. Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion.';
COMMENT ON FUNCTION public.is_admin() IS 'Wrapper for auth.is_admin_user() for backwards compatibility.';
