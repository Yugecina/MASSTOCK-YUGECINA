-- Migration: Migrate existing client owners to client_members and remove user_id column
-- Created: 2025-11-25
-- Description: Moves ownership data from clients.user_id to client_members table, then drops the column

-- ============================================
-- 1. MIGRATE EXISTING OWNERS TO client_members
-- ============================================

INSERT INTO client_members (client_id, user_id, role, status, accepted_at, created_at, updated_at)
SELECT
  c.id as client_id,
  c.user_id as user_id,
  'owner' as role,
  'active' as status,
  c.created_at as accepted_at,
  c.created_at as created_at,
  NOW() as updated_at
FROM clients c
WHERE c.user_id IS NOT NULL
ON CONFLICT (client_id, user_id) DO NOTHING;

-- ============================================
-- 2. DROP user_id COLUMN FROM clients (clean break)
-- ============================================

-- First drop the foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'clients_user_id_fkey'
    AND table_name = 'clients'
  ) THEN
    ALTER TABLE clients DROP CONSTRAINT clients_user_id_fkey;
  END IF;
END $$;

-- Drop the index if it exists
DROP INDEX IF EXISTS idx_clients_user_id;

-- Now drop the column
ALTER TABLE clients DROP COLUMN IF EXISTS user_id;

-- ============================================
-- 3. UPDATE RLS POLICIES FOR clients TABLE
-- ============================================

-- Drop old policies that reference user_id
DROP POLICY IF EXISTS "Clients can view own data" ON clients;
DROP POLICY IF EXISTS "Clients can update own data" ON clients;

-- Create new policies using client_members
CREATE POLICY "Users can view their clients"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
    OR
    id IN (
      SELECT cm.client_id FROM client_members cm
      WHERE cm.user_id = auth.uid() AND cm.status = 'active'
    )
  );

CREATE POLICY "Owners can update their clients"
  ON clients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
    OR
    id IN (
      SELECT cm.client_id FROM client_members cm
      WHERE cm.user_id = auth.uid() AND cm.role = 'owner' AND cm.status = 'active'
    )
  );

-- ============================================
-- 4. UPDATE RLS POLICIES FOR workflows TABLE
-- ============================================

-- Drop old policy
DROP POLICY IF EXISTS "Clients can view own workflows" ON workflows;

-- Create new policy using client_members
CREATE POLICY "Users can view their client workflows"
  ON workflows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
    OR
    client_id IN (
      SELECT cm.client_id FROM client_members cm
      WHERE cm.user_id = auth.uid() AND cm.status = 'active'
    )
  );

-- ============================================
-- 5. UPDATE RLS POLICIES FOR workflow_executions TABLE
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Clients can view own executions" ON workflow_executions;
DROP POLICY IF EXISTS "Clients can create executions for their workflows" ON workflow_executions;

-- Create new policies
CREATE POLICY "Users can view their client executions"
  ON workflow_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
    OR
    client_id IN (
      SELECT cm.client_id FROM client_members cm
      WHERE cm.user_id = auth.uid() AND cm.status = 'active'
    )
  );

CREATE POLICY "Users can create executions for their clients"
  ON workflow_executions FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT cm.client_id FROM client_members cm
      WHERE cm.user_id = auth.uid() AND cm.status = 'active'
    )
  );

-- ============================================
-- 6. UPDATE RLS FOR OTHER TABLES
-- ============================================

-- workflow_requests
DROP POLICY IF EXISTS "Clients can view own requests" ON workflow_requests;
DROP POLICY IF EXISTS "Clients can create requests" ON workflow_requests;
DROP POLICY IF EXISTS "Clients can update draft requests" ON workflow_requests;

CREATE POLICY "Users can view their client requests"
  ON workflow_requests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    OR
    client_id IN (SELECT cm.client_id FROM client_members cm WHERE cm.user_id = auth.uid() AND cm.status = 'active')
  );

CREATE POLICY "Users can create requests for their clients"
  ON workflow_requests FOR INSERT
  WITH CHECK (
    client_id IN (SELECT cm.client_id FROM client_members cm WHERE cm.user_id = auth.uid() AND cm.status = 'active')
  );

CREATE POLICY "Users can update draft requests"
  ON workflow_requests FOR UPDATE
  USING (
    status = 'draft' AND
    client_id IN (SELECT cm.client_id FROM client_members cm WHERE cm.user_id = auth.uid() AND cm.status = 'active')
  );

-- support_tickets
DROP POLICY IF EXISTS "Clients can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Clients can create tickets" ON support_tickets;

CREATE POLICY "Users can view their client tickets"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    OR
    client_id IN (SELECT cm.client_id FROM client_members cm WHERE cm.user_id = auth.uid() AND cm.status = 'active')
  );

CREATE POLICY "Users can create tickets for their clients"
  ON support_tickets FOR INSERT
  WITH CHECK (
    client_id IN (SELECT cm.client_id FROM client_members cm WHERE cm.user_id = auth.uid() AND cm.status = 'active')
  );

-- audit_logs
DROP POLICY IF EXISTS "Clients can view own logs" ON audit_logs;

CREATE POLICY "Users can view their client audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    OR
    client_id IN (SELECT cm.client_id FROM client_members cm WHERE cm.user_id = auth.uid() AND cm.status = 'active')
  );

-- ============================================
-- 7. LOG MIGRATION
-- ============================================

DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM client_members WHERE role = 'owner';
  RAISE NOTICE 'Migration complete: % client owners migrated to client_members table', migrated_count;
END $$;
