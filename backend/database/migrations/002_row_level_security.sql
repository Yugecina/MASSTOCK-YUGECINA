-- ============================================================================
-- Row-Level Security (RLS) Policies
-- Description: Multi-tenant data isolation for MasStock
-- ============================================================================

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- CLIENTS TABLE POLICIES
-- ============================================================================

-- Clients can view their own data
CREATE POLICY "Clients view own data" ON clients
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Clients can update their own data (limited fields)
CREATE POLICY "Clients update own data" ON clients
    FOR UPDATE
    USING (user_id = auth.uid());

-- Admins can insert clients
CREATE POLICY "Admins can insert clients" ON clients
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete clients
CREATE POLICY "Admins can delete clients" ON clients
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- WORKFLOWS TABLE POLICIES
-- ============================================================================

-- Clients can view their own workflows
CREATE POLICY "Clients view own workflows" ON workflows
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can manage all workflows
CREATE POLICY "Admins manage workflows" ON workflows
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- WORKFLOW_EXECUTIONS TABLE POLICIES
-- ============================================================================

-- Clients can view their own executions
CREATE POLICY "Clients view own executions" ON workflow_executions
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Clients can create executions for their workflows
CREATE POLICY "Clients create executions" ON workflow_executions
    FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- Admins can manage all executions
CREATE POLICY "Admins manage executions" ON workflow_executions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- WORKFLOW_REQUESTS TABLE POLICIES
-- ============================================================================

-- Clients can view their own requests
CREATE POLICY "Clients view own requests" ON workflow_requests
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Clients can create requests
CREATE POLICY "Clients create requests" ON workflow_requests
    FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- Clients can update their own draft requests
CREATE POLICY "Clients update draft requests" ON workflow_requests
    FOR UPDATE
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
        AND status = 'draft'
    );

-- Admins can manage all requests
CREATE POLICY "Admins manage requests" ON workflow_requests
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- SUPPORT_TICKETS TABLE POLICIES
-- ============================================================================

-- Clients can view their own tickets
CREATE POLICY "Clients view own tickets" ON support_tickets
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Clients can create tickets
CREATE POLICY "Clients create tickets" ON support_tickets
    FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- Admins can manage all tickets
CREATE POLICY "Admins manage tickets" ON support_tickets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- AUDIT_LOGS TABLE POLICIES
-- ============================================================================

-- Clients can view their own audit logs
CREATE POLICY "Clients view own audit logs" ON audit_logs
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System can insert audit logs (using service role)
CREATE POLICY "System creates audit logs" ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Admins can view all audit logs
CREATE POLICY "Admins view all audit logs" ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- API_LOGS TABLE POLICIES
-- ============================================================================

-- Only admins can view API logs
CREATE POLICY "Admins view api logs" ON api_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System can insert API logs (using service role)
CREATE POLICY "System creates api logs" ON api_logs
    FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's client_id
CREATE OR REPLACE FUNCTION get_user_client_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM clients
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin' FROM users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
