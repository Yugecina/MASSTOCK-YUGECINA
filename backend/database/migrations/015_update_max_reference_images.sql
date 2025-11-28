-- Migration: Update max_reference_images from 3 to 14
-- Date: 2025-11-28
-- Description: Aligns the application with Gemini API's actual limit of 14 reference images
--              (6 objects + 5 humans for character consistency)

-- Update existing workflows that have max_reference_images: 3
UPDATE workflows
SET config = jsonb_set(config, '{max_reference_images}', '14')
WHERE config->>'workflow_type' = 'nano_banana'
  AND config->>'max_reference_images' = '3';

-- Update existing workflow templates (if they exist)
UPDATE workflow_templates
SET config = jsonb_set(config, '{max_reference_images}', '14')
WHERE config->>'workflow_type' = 'nano_banana'
  AND config->>'max_reference_images' = '3';
