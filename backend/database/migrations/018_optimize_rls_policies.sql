-- Migration: 018_optimize_rls_policies.sql
-- Description: Fix RLS performance warnings (auth_rls_initplan + multiple_permissive_policies)
-- Date: 2026-01-14
--
-- Issues fixed:
-- 1. auth_rls_initplan (37 warnings) - Replace auth.uid() with (select auth.uid())
-- 2. multiple_permissive_policies (68 warnings) - Consolidate duplicate policies
--
-- Tables affected: 15 (users, clients, workflows, workflow_executions, workflow_requests,
--                     audit_logs, support_tickets, workflow_batch_results, client_members,
--                     workflow_templates, client_workflows, contact_submissions, api_logs,
--                     smart_resizer_jobs, smart_resizer_results)

BEGIN;

-- ===========================================
-- SECTION 1: Update helper functions
-- ===========================================

-- Update current_user_role() to use (select auth.uid())
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = (select auth.uid());
$$;

-- Update current_user_client_id() to use (select auth.uid())
CREATE OR REPLACE FUNCTION current_user_client_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id FROM public.users WHERE id = (select auth.uid());
$$;

-- Update current_user_client_role() to use (select auth.uid())
CREATE OR REPLACE FUNCTION current_user_client_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_role FROM public.users WHERE id = (select auth.uid());
$$;

-- ===========================================
-- SECTION 2: Drop ALL existing policies
-- ===========================================

-- users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "users_view_own_profile" ON users;
DROP POLICY IF EXISTS "users_view_same_client_v3" ON users;
DROP POLICY IF EXISTS "admins_view_all_users_v3" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
DROP POLICY IF EXISTS "owners_manage_client_users_v3" ON users;
DROP POLICY IF EXISTS "admins_manage_all_users_v3" ON users;

-- clients table
DROP POLICY IF EXISTS "Clients view own data" ON clients;
DROP POLICY IF EXISTS "users_view_own_client_v3" ON clients;
DROP POLICY IF EXISTS "admins_view_all_clients_v3" ON clients;
DROP POLICY IF EXISTS "Clients update own data" ON clients;
DROP POLICY IF EXISTS "owners_update_own_client_v3" ON clients;
DROP POLICY IF EXISTS "Admins can insert clients" ON clients;
DROP POLICY IF EXISTS "admins_create_clients_v3" ON clients;
DROP POLICY IF EXISTS "admins_manage_all_clients_v3" ON clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON clients;

-- workflows table
DROP POLICY IF EXISTS "Clients view own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can view workflows they have access to" ON workflows;
DROP POLICY IF EXISTS "Admins manage workflows" ON workflows;

-- workflow_executions table
DROP POLICY IF EXISTS "Clients view own executions" ON workflow_executions;
DROP POLICY IF EXISTS "Clients create executions" ON workflow_executions;
DROP POLICY IF EXISTS "Admins manage executions" ON workflow_executions;

-- workflow_requests table
DROP POLICY IF EXISTS "Clients view own requests" ON workflow_requests;
DROP POLICY IF EXISTS "Clients create requests" ON workflow_requests;
DROP POLICY IF EXISTS "Clients update draft requests" ON workflow_requests;
DROP POLICY IF EXISTS "Admins manage requests" ON workflow_requests;

-- audit_logs table
DROP POLICY IF EXISTS "Clients view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role inserts audit logs" ON audit_logs;

-- support_tickets table
DROP POLICY IF EXISTS "Clients view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Clients create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins manage tickets" ON support_tickets;

-- workflow_batch_results table
DROP POLICY IF EXISTS "Clients view own batch results" ON workflow_batch_results;
DROP POLICY IF EXISTS "Admins view all batch results" ON workflow_batch_results;
DROP POLICY IF EXISTS "Service role inserts batch results" ON workflow_batch_results;
DROP POLICY IF EXISTS "Service role updates batch results" ON workflow_batch_results;

-- client_members table
DROP POLICY IF EXISTS "Admins can manage all client_members" ON client_members;
DROP POLICY IF EXISTS "Owners can manage their client members" ON client_members;
DROP POLICY IF EXISTS "Collaborators can view client members" ON client_members;

-- workflow_templates table
DROP POLICY IF EXISTS "Admins can manage workflow_templates" ON workflow_templates;
DROP POLICY IF EXISTS "Users can view active templates" ON workflow_templates;

-- client_workflows table
DROP POLICY IF EXISTS "Admins can manage client_workflows" ON client_workflows;
DROP POLICY IF EXISTS "Members can view their client workflows" ON client_workflows;

-- contact_submissions table
DROP POLICY IF EXISTS "Admins can view all contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Admins can update contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Service role inserts contact submissions" ON contact_submissions;

-- api_logs table
DROP POLICY IF EXISTS "Admins view api logs" ON api_logs;
DROP POLICY IF EXISTS "Service role inserts api logs" ON api_logs;

-- smart_resizer_jobs table
DROP POLICY IF EXISTS "Users can view their client's smart resizer jobs" ON smart_resizer_jobs;
DROP POLICY IF EXISTS "Users can create smart resizer jobs for their client" ON smart_resizer_jobs;

-- smart_resizer_results table
DROP POLICY IF EXISTS "Users can view their smart resizer results" ON smart_resizer_results;

-- ===========================================
-- SECTION 3: Create optimized policies
-- ===========================================

-- ========== users table (3 policies) ==========

CREATE POLICY users_select_policy ON users
  FOR SELECT
  TO public
  USING (
    id = (select auth.uid())
    OR client_id = (select current_user_client_id())
    OR (select current_user_role()) = 'admin'
  );

CREATE POLICY users_update_policy ON users
  FOR UPDATE
  TO public
  USING (
    id = (select auth.uid())
    OR ((select current_user_role()) = 'admin')
    OR (client_id = (select current_user_client_id()) AND (select current_user_client_role()) = 'owner')
  )
  WITH CHECK (
    id = (select auth.uid())
    OR ((select current_user_role()) = 'admin')
    OR (client_id = (select current_user_client_id()) AND (select current_user_client_role()) = 'owner')
  );

CREATE POLICY admins_delete_users ON users
  FOR DELETE
  TO public
  USING ((select current_user_role()) = 'admin');

-- ========== clients table (4 policies) ==========

CREATE POLICY clients_select_policy ON clients
  FOR SELECT
  TO public
  USING (
    id = (select current_user_client_id())
    OR (select current_user_role()) = 'admin'
  );

CREATE POLICY clients_insert_policy ON clients
  FOR INSERT
  TO public
  WITH CHECK ((select current_user_role()) = 'admin');

CREATE POLICY clients_update_policy ON clients
  FOR UPDATE
  TO public
  USING (
    owner_id = (select auth.uid())
    OR (select current_user_role()) = 'admin'
  )
  WITH CHECK (
    owner_id = (select auth.uid())
    OR (select current_user_role()) = 'admin'
  );

CREATE POLICY clients_delete_policy ON clients
  FOR DELETE
  TO public
  USING ((select current_user_role()) = 'admin');

-- ========== workflows table (2 policies) ==========

CREATE POLICY workflows_select_policy ON workflows
  FOR SELECT
  TO public
  USING (
    (select current_user_role()) = 'admin'
    OR client_id IN (
      SELECT cm.client_id
      FROM client_members cm
      WHERE cm.user_id = (select auth.uid())
        AND cm.status = 'active'
    )
    OR (
      is_shared = true
      AND id IN (
        SELECT cw.workflow_id
        FROM client_workflows cw
        JOIN client_members cm ON cm.client_id = cw.client_id
        WHERE cm.user_id = (select auth.uid())
          AND cm.status = 'active'
          AND cw.is_active = true
      )
    )
  );

CREATE POLICY workflows_manage_policy ON workflows
  FOR ALL
  TO public
  USING ((select current_user_role()) = 'admin')
  WITH CHECK ((select current_user_role()) = 'admin');

-- ========== workflow_executions table (3 policies) ==========

CREATE POLICY executions_select_policy ON workflow_executions
  FOR SELECT
  TO public
  USING (
    (select current_user_role()) = 'admin'
    OR client_id IN (
      SELECT client_id
      FROM users
      WHERE id = (select auth.uid())
    )
  );

CREATE POLICY executions_insert_policy ON workflow_executions
  FOR INSERT
  TO public
  WITH CHECK (
    client_id IN (
      SELECT client_id
      FROM users
      WHERE id = (select auth.uid())
    )
    OR (select current_user_role()) = 'admin'
  );

CREATE POLICY executions_manage_policy ON workflow_executions
  FOR ALL
  TO public
  USING ((select current_user_role()) = 'admin')
  WITH CHECK ((select current_user_role()) = 'admin');

-- ========== workflow_requests table (4 policies) ==========

CREATE POLICY requests_select_policy ON workflow_requests
  FOR SELECT
  TO public
  USING (
    (select current_user_role()) = 'admin'
    OR client_id IN (
      SELECT client_id
      FROM users
      WHERE id = (select auth.uid())
    )
  );

CREATE POLICY requests_insert_policy ON workflow_requests
  FOR INSERT
  TO public
  WITH CHECK (
    client_id IN (
      SELECT client_id
      FROM users
      WHERE id = (select auth.uid())
    )
    OR (select current_user_role()) = 'admin'
  );

CREATE POLICY requests_update_policy ON workflow_requests
  FOR UPDATE
  TO public
  USING (
    (select current_user_role()) = 'admin'
    OR (
      client_id IN (
        SELECT client_id
        FROM users
        WHERE id = (select auth.uid())
      )
      AND status = 'draft'
    )
  )
  WITH CHECK (
    (select current_user_role()) = 'admin'
    OR (
      client_id IN (
        SELECT client_id
        FROM users
        WHERE id = (select auth.uid())
      )
      AND status = 'draft'
    )
  );

CREATE POLICY requests_delete_policy ON workflow_requests
  FOR DELETE
  TO public
  USING ((select current_user_role()) = 'admin');

-- ========== audit_logs table (2 policies) ==========

CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT
  TO public
  USING (
    (select current_user_role()) = 'admin'
    OR client_id IN (
      SELECT client_id
      FROM users
      WHERE id = (select auth.uid())
    )
  );

CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ========== support_tickets table (3 policies) ==========

CREATE POLICY tickets_select_policy ON support_tickets
  FOR SELECT
  TO public
  USING (
    (select current_user_role()) = 'admin'
    OR client_id IN (
      SELECT client_id
      FROM users
      WHERE id = (select auth.uid())
    )
  );

CREATE POLICY tickets_insert_policy ON support_tickets
  FOR INSERT
  TO public
  WITH CHECK (
    client_id IN (
      SELECT client_id
      FROM users
      WHERE id = (select auth.uid())
    )
    OR (select current_user_role()) = 'admin'
  );

CREATE POLICY tickets_manage_policy ON support_tickets
  FOR ALL
  TO public
  USING ((select current_user_role()) = 'admin')
  WITH CHECK ((select current_user_role()) = 'admin');

-- ========== workflow_batch_results table (3 policies) ==========

CREATE POLICY batch_results_select_policy ON workflow_batch_results
  FOR SELECT
  TO public
  USING (
    (select current_user_role()) = 'admin'
    OR execution_id IN (
      SELECT id
      FROM workflow_executions
      WHERE client_id IN (
        SELECT client_id
        FROM users
        WHERE id = (select auth.uid())
      )
    )
  );

CREATE POLICY batch_results_insert_policy ON workflow_batch_results
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY batch_results_update_policy ON workflow_batch_results
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========== client_members table (2 policies) ==========

CREATE POLICY client_members_select_policy ON client_members
  FOR SELECT
  TO public
  USING (
    (select current_user_role()) = 'admin'
    OR client_id IN (
      SELECT cm.client_id
      FROM client_members cm
      WHERE cm.user_id = (select auth.uid())
        AND cm.status = 'active'
    )
  );

CREATE POLICY client_members_manage_policy ON client_members
  FOR ALL
  TO public
  USING (
    (select current_user_role()) = 'admin'
    OR client_id IN (
      SELECT cm.client_id
      FROM client_members cm
      WHERE cm.user_id = (select auth.uid())
        AND cm.role = 'owner'
        AND cm.status = 'active'
    )
  )
  WITH CHECK (
    (select current_user_role()) = 'admin'
    OR client_id IN (
      SELECT cm.client_id
      FROM client_members cm
      WHERE cm.user_id = (select auth.uid())
        AND cm.role = 'owner'
        AND cm.status = 'active'
    )
  );

-- ========== workflow_templates table (2 policies) ==========

CREATE POLICY templates_select_policy ON workflow_templates
  FOR SELECT
  TO public
  USING (
    is_active = true
    OR (select current_user_role()) = 'admin'
  );

CREATE POLICY templates_manage_policy ON workflow_templates
  FOR ALL
  TO public
  USING ((select current_user_role()) = 'admin')
  WITH CHECK ((select current_user_role()) = 'admin');

-- ========== client_workflows table (2 policies) ==========

CREATE POLICY client_workflows_select_policy ON client_workflows
  FOR SELECT
  TO public
  USING (
    (select current_user_role()) = 'admin'
    OR client_id IN (
      SELECT cm.client_id
      FROM client_members cm
      WHERE cm.user_id = (select auth.uid())
        AND cm.status = 'active'
    )
  );

CREATE POLICY client_workflows_manage_policy ON client_workflows
  FOR ALL
  TO public
  USING ((select current_user_role()) = 'admin')
  WITH CHECK ((select current_user_role()) = 'admin');

-- ========== contact_submissions table (3 policies) ==========

CREATE POLICY contact_select_policy ON contact_submissions
  FOR SELECT
  TO public
  USING ((select current_user_role()) = 'admin');

CREATE POLICY contact_update_policy ON contact_submissions
  FOR UPDATE
  TO public
  USING ((select current_user_role()) = 'admin')
  WITH CHECK ((select current_user_role()) = 'admin');

CREATE POLICY contact_insert_policy ON contact_submissions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ========== api_logs table (2 policies) ==========

CREATE POLICY api_logs_select_policy ON api_logs
  FOR SELECT
  TO public
  USING ((select current_user_role()) = 'admin');

CREATE POLICY api_logs_insert_policy ON api_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ========== smart_resizer_jobs table (2 policies) ==========

CREATE POLICY resizer_jobs_select_policy ON smart_resizer_jobs
  FOR SELECT
  TO public
  USING (
    client_id IN (
      SELECT client_id
      FROM users
      WHERE id = (select auth.uid())
    )
  );

CREATE POLICY resizer_jobs_insert_policy ON smart_resizer_jobs
  FOR INSERT
  TO public
  WITH CHECK (
    client_id IN (
      SELECT client_id
      FROM users
      WHERE id = (select auth.uid())
    )
  );

-- ========== smart_resizer_results table (1 policy) ==========

CREATE POLICY resizer_results_select_policy ON smart_resizer_results
  FOR SELECT
  TO public
  USING (
    job_id IN (
      SELECT id
      FROM smart_resizer_jobs
      WHERE client_id IN (
        SELECT client_id
        FROM users
        WHERE id = (select auth.uid())
      )
    )
  );

COMMIT;
