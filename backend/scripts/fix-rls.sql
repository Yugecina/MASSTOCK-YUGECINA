-- Fix infinite recursion in RLS policy for users table

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create a new policy that uses a helper function to avoid recursion
-- This function will be created with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION auth.is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the policy using the helper function
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT
    USING (auth.is_admin_user());

-- Also fix the is_admin() function that has the same problem
DROP FUNCTION IF EXISTS is_admin();

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auth.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_admin_user() TO anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;
