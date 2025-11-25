-- Migration: Create client_members table for multi-user per client
-- Created: 2025-11-25
-- Description: Enables multiple users to belong to a single client with different roles (owner/collaborator)

-- ============================================
-- 1. CREATE client_members TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS client_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'collaborator')) DEFAULT 'collaborator',
  invited_by UUID,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'active', 'removed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_client_user UNIQUE (client_id, user_id)
);

-- ============================================
-- 2. ADD FOREIGN KEYS
-- ============================================

ALTER TABLE client_members
  ADD CONSTRAINT fk_client_members_client_id
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE client_members
  ADD CONSTRAINT fk_client_members_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE client_members
  ADD CONSTRAINT fk_client_members_invited_by
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_client_members_client_id ON client_members(client_id);
CREATE INDEX IF NOT EXISTS idx_client_members_user_id ON client_members(user_id);
CREATE INDEX IF NOT EXISTS idx_client_members_role ON client_members(role);
CREATE INDEX IF NOT EXISTS idx_client_members_status ON client_members(status);
CREATE INDEX IF NOT EXISTS idx_client_members_client_role ON client_members(client_id, role);

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE client_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES
-- ============================================

-- Admins can do everything
CREATE POLICY "Admins can manage all client_members"
  ON client_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Owners can manage members of their clients
CREATE POLICY "Owners can manage their client members"
  ON client_members FOR ALL
  USING (
    client_id IN (
      SELECT cm.client_id FROM client_members cm
      WHERE cm.user_id = auth.uid() AND cm.role = 'owner' AND cm.status = 'active'
    )
  );

-- Collaborators can view members of their clients (read-only)
CREATE POLICY "Collaborators can view client members"
  ON client_members FOR SELECT
  USING (
    client_id IN (
      SELECT cm.client_id FROM client_members cm
      WHERE cm.user_id = auth.uid() AND cm.status = 'active'
    )
  );

-- ============================================
-- 6. CREATE TRIGGER FOR updated_at
-- ============================================

CREATE TRIGGER set_client_members_updated_at
  BEFORE UPDATE ON client_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. GRANTS
-- ============================================

GRANT SELECT ON client_members TO authenticated;
GRANT ALL ON client_members TO service_role;

-- ============================================
-- 8. ADD user_id to workflow_executions (track who triggered)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_executions' AND column_name = 'triggered_by_user_id'
  ) THEN
    ALTER TABLE workflow_executions ADD COLUMN triggered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_workflow_executions_triggered_by ON workflow_executions(triggered_by_user_id);
  END IF;
END $$;

-- ============================================
-- 9. COMMENTS
-- ============================================

COMMENT ON TABLE client_members IS 'Junction table for multi-user per client. Roles: owner (full access including billing), collaborator (workflows/results only)';
COMMENT ON COLUMN client_members.role IS 'owner: full access to client data, billing, members. collaborator: access to workflows and execution results only';
COMMENT ON COLUMN client_members.status IS 'pending: invited but not accepted, active: full member, removed: soft-deleted';
