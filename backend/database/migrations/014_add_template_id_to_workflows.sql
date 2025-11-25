-- Migration: 014_add_template_id_to_workflows
-- Description: Add template_id column to workflows table for template tracking
-- Date: 2025-11-25

-- ============================================
-- Add template_id column to workflows table
-- ============================================

-- Add column with foreign key reference
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES workflow_templates(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workflows_template_id ON workflows(template_id);

-- Add comment explaining the column purpose
COMMENT ON COLUMN workflows.template_id IS
  'Reference to the workflow_template used to create this workflow instance. NULL for manually created workflows.';

-- ============================================
-- Backfill existing workflows (optional)
-- ============================================
-- If you have existing workflows that were created from templates,
-- you can backfill them by matching config.workflow_type

-- Example backfill (uncomment if needed):
-- UPDATE workflows w
-- SET template_id = (
--   SELECT t.id FROM workflow_templates t
--   WHERE t.config->>'workflow_type' = w.config->>'workflow_type'
--   LIMIT 1
-- )
-- WHERE w.template_id IS NULL
--   AND w.config->>'workflow_type' IS NOT NULL;
