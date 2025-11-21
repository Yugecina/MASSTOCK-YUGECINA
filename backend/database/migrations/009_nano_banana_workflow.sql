-- ============================================================================
-- Migration: 009_nano_banana_workflow.sql
-- Description: Creates infrastructure for Batch Nano Banana workflow using
--              Google Gemini 2.5 Flash Image API
-- Date: 2025-11-17
-- ============================================================================

-- ============================================================================
-- EXTENSION: pgcrypto
-- Description: Enable encryption for API keys
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- TABLE: workflow_batch_results
-- Description: Stores individual results for each prompt in a batch execution
--              Used by Batch Nano Banana workflow to track per-prompt results
-- ============================================================================
CREATE TABLE IF NOT EXISTS workflow_batch_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE NOT NULL,
    batch_index INTEGER NOT NULL,
    prompt_text TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    result_url TEXT,
    result_storage_path TEXT,
    error_message TEXT,
    processing_time_ms INTEGER,
    api_cost DECIMAL(10, 4) DEFAULT 0.0390,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Ensure unique batch index per execution
    UNIQUE(execution_id, batch_index)
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================
CREATE INDEX idx_batch_results_execution_id ON workflow_batch_results(execution_id);
CREATE INDEX idx_batch_results_status ON workflow_batch_results(status);
CREATE INDEX idx_batch_results_created_at ON workflow_batch_results(created_at DESC);

-- Combined index for common query patterns
CREATE INDEX idx_batch_results_execution_status ON workflow_batch_results(execution_id, status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE workflow_batch_results ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own batch results
CREATE POLICY "Clients view own batch results" ON workflow_batch_results
    FOR SELECT
    USING (
        execution_id IN (
            SELECT id FROM workflow_executions
            WHERE client_id IN (
                SELECT id FROM clients WHERE user_id = auth.uid()
            )
        )
    );

-- Policy: Admins can view all batch results
CREATE POLICY "Admins view all batch results" ON workflow_batch_results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: System can insert batch results (for worker)
CREATE POLICY "System insert batch results" ON workflow_batch_results
    FOR INSERT
    WITH CHECK (true);

-- Policy: System can update batch results (for worker)
CREATE POLICY "System update batch results" ON workflow_batch_results
    FOR UPDATE
    USING (true);

-- ============================================================================
-- COMMENTS for documentation
-- ============================================================================
COMMENT ON TABLE workflow_batch_results IS 'Stores individual results for each prompt in a batch workflow execution';
COMMENT ON COLUMN workflow_batch_results.batch_index IS 'Zero-based index of this prompt in the batch (0, 1, 2, ...)';
COMMENT ON COLUMN workflow_batch_results.prompt_text IS 'The actual prompt text sent to the API';
COMMENT ON COLUMN workflow_batch_results.result_url IS 'Public URL to the generated image';
COMMENT ON COLUMN workflow_batch_results.result_storage_path IS 'Supabase Storage path if uploaded';
COMMENT ON COLUMN workflow_batch_results.api_cost IS 'Cost for this single image generation ($0.039 for Gemini)';

-- ============================================================================
-- FUNCTION: Get batch execution statistics
-- Description: Helper function to get summary stats for a batch execution
-- ============================================================================
CREATE OR REPLACE FUNCTION get_batch_execution_stats(p_execution_id UUID)
RETURNS TABLE (
    total_prompts BIGINT,
    successful BIGINT,
    failed BIGINT,
    pending BIGINT,
    processing BIGINT,
    total_cost DECIMAL,
    avg_processing_time_ms DECIMAL,
    completion_percentage DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_prompts,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as successful,
        COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending,
        COUNT(*) FILTER (WHERE status = 'processing')::BIGINT as processing,
        COALESCE(SUM(api_cost), 0) as total_cost,
        COALESCE(AVG(processing_time_ms), 0) as avg_processing_time_ms,
        CASE
            WHEN COUNT(*) > 0 THEN
                (COUNT(*) FILTER (WHERE status IN ('completed', 'failed'))::DECIMAL / COUNT(*)::DECIMAL) * 100
            ELSE 0
        END as completion_percentage
    FROM workflow_batch_results
    WHERE execution_id = p_execution_id;
END;
$$;

COMMENT ON FUNCTION get_batch_execution_stats IS 'Returns statistics for a batch execution including success/failure counts and costs';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Migration 009 completed successfully: Nano Banana workflow infrastructure created';
END $$;
