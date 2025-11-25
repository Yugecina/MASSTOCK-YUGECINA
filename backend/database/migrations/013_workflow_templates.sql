-- Migration: Create workflow_templates table for predefined workflow types
-- Created: 2025-11-25
-- Description: Stores workflow templates that admins can assign to clients

-- ============================================
-- 1. CREATE workflow_templates TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  workflow_type VARCHAR(50) NOT NULL DEFAULT 'nano_banana',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  cost_per_execution DECIMAL(10, 2) DEFAULT 0.00,
  revenue_per_execution DECIMAL(10, 2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  icon VARCHAR(50) DEFAULT 'image',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_workflow_templates_is_active ON workflow_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_workflow_type ON workflow_templates(workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_display_order ON workflow_templates(display_order);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Admins can manage all templates
CREATE POLICY "Admins can manage workflow_templates"
  ON workflow_templates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- All authenticated users can view active templates
CREATE POLICY "Users can view active templates"
  ON workflow_templates FOR SELECT
  USING (is_active = true);

-- ============================================
-- 5. CREATE TRIGGER FOR updated_at
-- ============================================

CREATE TRIGGER set_workflow_templates_updated_at
  BEFORE UPDATE ON workflow_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. GRANTS
-- ============================================

GRANT SELECT ON workflow_templates TO authenticated;
GRANT ALL ON workflow_templates TO service_role;

-- ============================================
-- 7. SEED DEFAULT TEMPLATES
-- ============================================

INSERT INTO workflow_templates (name, description, workflow_type, config, cost_per_execution, revenue_per_execution, display_order, icon)
VALUES
  (
    'Image Factory - Flash',
    'Generate high-quality images with Gemini 2.5 Flash. Fast processing, economical pricing. Ideal for bulk image generation.',
    'nano_banana',
    '{
      "workflow_type": "nano_banana",
      "api_provider": "google_gemini",
      "default_model": "gemini-2.5-flash-image",
      "available_models": ["gemini-2.5-flash-image"],
      "max_prompts": 10000,
      "max_reference_images": 3,
      "supported_formats": ["png", "jpg", "webp"],
      "aspect_ratios": ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
      "default_aspect_ratio": "1:1",
      "available_resolutions": {"flash": ["1K"]},
      "pricing": {
        "flash": {"cost_per_image": 0.039, "revenue_per_image": 0.10}
      },
      "requires_api_key": true,
      "api_key_storage": "encrypted_ephemeral"
    }'::jsonb,
    0.039,
    0.10,
    1,
    'zap'
  ),
  (
    'Image Factory - Pro',
    'Premium image generation with Gemini 3 Pro. Superior quality, multiple resolutions (1K, 2K, 4K). Best for professional projects.',
    'nano_banana',
    '{
      "workflow_type": "nano_banana",
      "api_provider": "google_gemini",
      "default_model": "gemini-3-pro-image-preview",
      "available_models": ["gemini-3-pro-image-preview"],
      "max_prompts": 5000,
      "max_reference_images": 3,
      "supported_formats": ["png", "jpg", "webp"],
      "aspect_ratios": ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
      "default_aspect_ratio": "1:1",
      "available_resolutions": {"pro": ["1K", "2K", "4K"]},
      "pricing": {
        "pro": {
          "1K": {"cost_per_image": 0.03633, "revenue_per_image": 0.10},
          "2K": {"cost_per_image": 0.03633, "revenue_per_image": 0.10},
          "4K": {"cost_per_image": 0.06, "revenue_per_image": 0.15}
        }
      },
      "requires_api_key": true,
      "api_key_storage": "encrypted_ephemeral"
    }'::jsonb,
    0.05,
    0.15,
    2,
    'sparkles'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. COMMENTS
-- ============================================

COMMENT ON TABLE workflow_templates IS 'Predefined workflow templates that admins can assign to clients';
COMMENT ON COLUMN workflow_templates.workflow_type IS 'Type identifier: nano_banana, standard, etc.';
COMMENT ON COLUMN workflow_templates.config IS 'JSON configuration including models, pricing, limits';
COMMENT ON COLUMN workflow_templates.is_active IS 'Whether this template is available for assignment';
COMMENT ON COLUMN workflow_templates.display_order IS 'Order for display in UI (lower = first)';
