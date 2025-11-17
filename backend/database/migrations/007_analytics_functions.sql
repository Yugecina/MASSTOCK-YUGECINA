-- ============================================================================
-- Analytics RPC Functions
-- Version: 1.0.0
-- Description: Database functions for analytics reporting
-- ============================================================================

-- ============================================================================
-- FUNCTION: get_executions_trend
-- Description: Get daily execution counts for the last N days
-- Parameters: days (integer) - number of days to retrieve
-- Returns: Table with date, total, successful, failed counts
-- ============================================================================
CREATE OR REPLACE FUNCTION get_executions_trend(days INTEGER DEFAULT 7)
RETURNS TABLE (
    date DATE,
    total BIGINT,
    successful BIGINT,
    failed BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            CURRENT_DATE - days + 1,
            CURRENT_DATE,
            '1 day'::interval
        )::date AS date
    )
    SELECT
        ds.date,
        COALESCE(COUNT(we.id), 0)::BIGINT AS total,
        COALESCE(SUM(CASE WHEN we.status = 'completed' THEN 1 ELSE 0 END), 0)::BIGINT AS successful,
        COALESCE(SUM(CASE WHEN we.status = 'failed' THEN 1 ELSE 0 END), 0)::BIGINT AS failed
    FROM date_series ds
    LEFT JOIN workflow_executions we ON DATE(we.created_at) = ds.date
    GROUP BY ds.date
    ORDER BY ds.date DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: get_workflow_performance
-- Description: Get workflow performance metrics for the last N days
-- Parameters: days (integer) - number of days to analyze
-- Returns: Table with workflow stats
-- ============================================================================
CREATE OR REPLACE FUNCTION get_workflow_performance(days INTEGER DEFAULT 30)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    executions BIGINT,
    successful BIGINT,
    failed BIGINT,
    avg_duration NUMERIC,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.id,
        w.name,
        COUNT(we.id)::BIGINT AS executions,
        SUM(CASE WHEN we.status = 'completed' THEN 1 ELSE 0 END)::BIGINT AS successful,
        SUM(CASE WHEN we.status = 'failed' THEN 1 ELSE 0 END)::BIGINT AS failed,
        ROUND(AVG(we.duration_seconds)::NUMERIC, 2) AS avg_duration,
        ROUND((COUNT(CASE WHEN we.status = 'completed' THEN 1 END) * w.revenue_per_execution)::NUMERIC, 2) AS total_revenue
    FROM workflows w
    LEFT JOIN workflow_executions we ON w.id = we.workflow_id
        AND we.created_at >= CURRENT_DATE - days
    WHERE w.status = 'deployed'
    GROUP BY w.id, w.name, w.revenue_per_execution
    HAVING COUNT(we.id) > 0
    ORDER BY executions DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: get_revenue_by_client
-- Description: Get revenue breakdown by client for the last N days
-- Parameters: days (integer) - number of days to analyze
-- Returns: Table with client revenue stats
-- ============================================================================
CREATE OR REPLACE FUNCTION get_revenue_by_client(days INTEGER DEFAULT 30)
RETURNS TABLE (
    client_id UUID,
    client_name VARCHAR(255),
    total_revenue NUMERIC,
    executions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS client_id,
        c.name AS client_name,
        ROUND(SUM(w.revenue_per_execution)::NUMERIC, 2) AS total_revenue,
        COUNT(we.id)::BIGINT AS executions
    FROM clients c
    LEFT JOIN workflow_executions we ON c.id = we.client_id
        AND we.status = 'completed'
        AND we.created_at >= CURRENT_DATE - days
    LEFT JOIN workflows w ON we.workflow_id = w.id
    WHERE c.status = 'active'
    GROUP BY c.id, c.name
    HAVING COUNT(we.id) > 0
    ORDER BY total_revenue DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: get_revenue_by_workflow
-- Description: Get revenue breakdown by workflow for the last N days
-- Parameters: days (integer) - number of days to analyze
-- Returns: Table with workflow revenue stats
-- ============================================================================
CREATE OR REPLACE FUNCTION get_revenue_by_workflow(days INTEGER DEFAULT 30)
RETURNS TABLE (
    workflow_id UUID,
    workflow_name VARCHAR(255),
    total_revenue NUMERIC,
    executions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.id AS workflow_id,
        w.name AS workflow_name,
        ROUND((COUNT(CASE WHEN we.status = 'completed' THEN 1 END) * w.revenue_per_execution)::NUMERIC, 2) AS total_revenue,
        COUNT(we.id)::BIGINT AS executions
    FROM workflows w
    LEFT JOIN workflow_executions we ON w.id = we.workflow_id
        AND we.created_at >= CURRENT_DATE - days
    WHERE w.status = 'deployed'
    GROUP BY w.id, w.name, w.revenue_per_execution
    HAVING COUNT(we.id) > 0
    ORDER BY total_revenue DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS: Documentation for functions
-- ============================================================================

COMMENT ON FUNCTION get_executions_trend IS 'Get daily execution counts for the last N days with success/failure breakdown';
COMMENT ON FUNCTION get_workflow_performance IS 'Get top workflows by execution count with performance metrics';
COMMENT ON FUNCTION get_revenue_by_client IS 'Get revenue breakdown by client for the last N days';
COMMENT ON FUNCTION get_revenue_by_workflow IS 'Get revenue breakdown by workflow for the last N days';
