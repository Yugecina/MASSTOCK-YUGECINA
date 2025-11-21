-- Migration: Seed Batch Nano Banana Workflow
-- Description: Creates a permanent "Batch Nano Banana" workflow for image generation
-- Date: 2025-01-18

-- Insert Batch Nano Banana workflow for Estee client
DO $$
DECLARE
    estee_client_id UUID;
    workflow_exists BOOLEAN;
BEGIN
    -- Get Estee's client ID
    SELECT id INTO estee_client_id
    FROM clients
    WHERE email = 'contact@estee-agency.com'
    LIMIT 1;

    IF estee_client_id IS NULL THEN
        RAISE NOTICE 'Estee client not found. Skipping workflow creation.';
        RETURN;
    END IF;

    -- Check if workflow already exists
    SELECT EXISTS(
        SELECT 1 FROM workflows
        WHERE client_id = estee_client_id
        AND name = 'Batch Nano Banana'
    ) INTO workflow_exists;

    IF workflow_exists THEN
        RAISE NOTICE 'Batch Nano Banana workflow already exists for Estee.';
        RETURN;
    END IF;

    -- Insert the workflow
    INSERT INTO workflows (
        client_id,
        name,
        description,
        status,
        config,
        cost_per_execution,
        revenue_per_execution,
        created_at,
        updated_at,
        deployed_at
    ) VALUES (
        estee_client_id,
        'Batch Nano Banana',
        'AI image generation using Google Gemini 2.5 Flash Image API. Generate multiple images from text prompts with optional reference images. Supports batch processing up to 100 images per execution.',
        'deployed',
        '{
            "workflow_type": "nano_banana",
            "model": "gemini-2.5-flash-image",
            "api_provider": "google_gemini",
            "max_prompts": 100,
            "max_reference_images": 3,
            "cost_per_image": 0.039,
            "supported_formats": ["png", "jpg", "webp"],
            "aspect_ratios": ["1:1", "16:9", "9:16", "4:3", "3:4"],
            "requires_api_key": true,
            "api_key_storage": "encrypted_ephemeral"
        }'::jsonb,
        0.039,
        0.10,
        NOW(),
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Successfully created Batch Nano Banana workflow for Estee.';
END $$;

-- Add comment
COMMENT ON TABLE workflows IS 'Workflows can have different types (workflow_type in config). nano_banana type uses Google Gemini for batch image generation.';
