-- Migration: 019_fix_remaining_multiple_permissive_policies.sql
-- Description: Fix remaining multiple permissive policies warnings by splitting ALL policies
-- Date: 2026-01-14
--
-- Issue: Policies with "FOR ALL" overlap with specific SELECT policies, causing warnings
-- Solution: Split "FOR ALL" into separate INSERT, UPDATE, DELETE policies

BEGIN;

-- ===========================================
-- client_members: Split manage_policy
-- ===========================================

DROP POLICY IF EXISTS client_members_manage_policy ON client_members;

-- Create separate policies for INSERT, UPDATE, DELETE (admin or owner)
CREATE POLICY client_members_insert_policy ON client_members
  FOR INSERT
  TO public
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

CREATE POLICY client_members_update_policy ON client_members
  FOR UPDATE
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

CREATE POLICY client_members_delete_policy ON client_members
  FOR DELETE
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
  );

-- ===========================================
-- client_workflows: Split manage_policy
-- ===========================================

DROP POLICY IF EXISTS client_workflows_manage_policy ON client_workflows;

CREATE POLICY client_workflows_insert_policy ON client_workflows
  FOR INSERT
  TO public
  WITH CHECK ((select current_user_role()) = 'admin');

CREATE POLICY client_workflows_update_policy ON client_workflows
  FOR UPDATE
  TO public
  USING ((select current_user_role()) = 'admin')
  WITH CHECK ((select current_user_role()) = 'admin');

CREATE POLICY client_workflows_delete_policy ON client_workflows
  FOR DELETE
  TO public
  USING ((select current_user_role()) = 'admin');

-- ===========================================
-- support_tickets: Split manage_policy
-- ===========================================

DROP POLICY IF EXISTS tickets_manage_policy ON support_tickets;

CREATE POLICY tickets_update_policy ON support_tickets
  FOR UPDATE
  TO public
  USING ((select current_user_role()) = 'admin')
  WITH CHECK ((select current_user_role()) = 'admin');

CREATE POLICY tickets_delete_policy ON support_tickets
  FOR DELETE
  TO public
  USING ((select current_user_role()) = 'admin');

-- ===========================================
-- workflow_executions: Split manage_policy
-- ===========================================

DROP POLICY IF EXISTS executions_manage_policy ON workflow_executions;

CREATE POLICY executions_update_policy ON workflow_executions
  FOR UPDATE
  TO public
  USING ((select current_user_role()) = 'admin')
  WITH CHECK ((select current_user_role()) = 'admin');

CREATE POLICY executions_delete_policy ON workflow_executions
  FOR DELETE
  TO public
  USING ((select current_user_role()) = 'admin');

-- ===========================================
-- workflow_templates: Split manage_policy
-- ===========================================

DROP POLICY IF EXISTS templates_manage_policy ON workflow_templates;

CREATE POLICY templates_insert_policy ON workflow_templates
  FOR INSERT
  TO public
  WITH CHECK ((select current_user_role()) = 'admin');

CREATE POLICY templates_update_policy ON workflow_templates
  FOR UPDATE
  TO public
  USING ((select current_user_role()) = 'admin')
  WITH CHECK ((select current_user_role()) = 'admin');

CREATE POLICY templates_delete_policy ON workflow_templates
  FOR DELETE
  TO public
  USING ((select current_user_role()) = 'admin');

-- ===========================================
-- workflows: Split manage_policy
-- ===========================================

DROP POLICY IF EXISTS workflows_manage_policy ON workflows;

CREATE POLICY workflows_insert_policy ON workflows
  FOR INSERT
  TO public
  WITH CHECK ((select current_user_role()) = 'admin');

CREATE POLICY workflows_update_policy ON workflows
  FOR UPDATE
  TO public
  USING ((select current_user_role()) = 'admin')
  WITH CHECK ((select current_user_role()) = 'admin');

CREATE POLICY workflows_delete_policy ON workflows
  FOR DELETE
  TO public
  USING ((select current_user_role()) = 'admin');

COMMIT;
