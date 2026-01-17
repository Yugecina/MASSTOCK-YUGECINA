-- Migration: Fix Supabase security warnings
-- Date: 2026-01-10
-- Applied: YES (step-by-step via MCP)
--
-- This migration fixes 6 security warnings from Supabase advisors:
-- 1. function_search_path_mutable - Function update_contact_submissions_updated_at
-- 2-6. rls_policy_always_true - 5 RLS policies (api_logs, audit_logs, contact_submissions, workflow_batch_results x2)
--
-- Strategy: Replace generic policies with service_role-specific policies
-- This documents intent while maintaining exact same functionality (backend uses service_role)

-- =====================================================
-- 1. FIX: function_search_path_mutable
-- =====================================================
-- Set immutable search_path on trigger function
-- Prevents search_path manipulation attacks
CREATE OR REPLACE FUNCTION public.update_contact_submissions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 2. FIX: RLS Policy Always True - api_logs
-- =====================================================
-- Drop existing permissive policy
DROP POLICY IF EXISTS "System creates api logs" ON api_logs;

-- Create restrictive policy for service_role only
-- Backend middleware logs via supabaseAdmin (service_role key)
CREATE POLICY "Service role inserts api logs" ON api_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- =====================================================
-- 3. FIX: RLS Policy Always True - audit_logs
-- =====================================================
-- Drop existing permissive policy
DROP POLICY IF EXISTS "System creates audit logs" ON audit_logs;

-- Create restrictive policy for service_role only
-- Backend controllers (23 locations) log via supabaseAdmin
CREATE POLICY "Service role inserts audit logs" ON audit_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- =====================================================
-- 4. FIX: RLS Policy Always True - contact_submissions
-- =====================================================
-- Drop existing permissive policies (both old variations)
DROP POLICY IF EXISTS "Service role can insert contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Allow public insert on contact_submissions" ON contact_submissions;

-- Create restrictive policy for service_role only
-- Public contact form inserts via backend service_role (not direct client access)
CREATE POLICY "Service role inserts contact submissions" ON contact_submissions
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- =====================================================
-- 5. FIX: RLS Policy Always True - workflow_batch_results
-- =====================================================
-- Drop existing permissive policies
DROP POLICY IF EXISTS "System insert batch results" ON workflow_batch_results;
DROP POLICY IF EXISTS "System update batch results" ON workflow_batch_results;

-- Create restrictive policies for service_role only
-- Background workers (workflow-worker.ts) use supabaseAdmin
CREATE POLICY "Service role inserts batch results" ON workflow_batch_results
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Service role updates batch results" ON workflow_batch_results
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After this migration, run:
-- mcp__supabase__get_advisors(type="security")
-- Expected: Only 1 warning remaining (auth_leaked_password_protection)
-- This last warning requires manual activation in Supabase Dashboard:
-- Dashboard → Authentication → Policies → Enable "Leaked Password Protection"
