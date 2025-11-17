-- ============================================================================
-- Migration: Promote admin@masstock.com to Admin Role
-- Description: Set the admin@masstock.com user as an admin
-- ============================================================================

-- Update the user's role to admin
UPDATE users SET role = 'admin' WHERE email = 'admin@masstock.com';

-- Verify the update
SELECT id, email, role, status, created_at FROM users WHERE email = 'admin@masstock.com';

-- ============================================================================
-- Additional verification: Show all admin users
-- ============================================================================
SELECT id, email, role FROM users WHERE role = 'admin' ORDER BY created_at;
