-- Migration: Seed Image Factory Workflow
-- Description: Creates a permanent "Image Factory" workflow for image generation
-- Date: 2025-01-18

-- Insert Image Factory workflow for Estee client
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
        AND name = 'Image Factory'
    ) INTO workflow_exists;

    IF workflow_exists THEN
        RAISE NOTICE 'Image Factory workflow already exists for Estee.';
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
        'Image Factory',
        'Transformez vos idées en images. Production en masse jusqu''à 10 000 générations par batch.',
        'deployed',
        '{
            "workflow_type": "nano_banana",
            "api_provider": "google_gemini",
            "available_models": ["gemini-2.5-flash-image", "gemini-3-pro-image-preview"],
            "default_model": "gemini-2.5-flash-image",
            "max_prompts": 10000,
            "max_reference_images": 3,
            "supported_formats": ["png", "jpg", "webp"],
            "aspect_ratios": ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
            "default_aspect_ratio": "1:1",
            "available_resolutions": {
                "flash": ["1K"],
                "pro": ["1K", "2K", "4K"]
            },
            "default_resolution": {
                "flash": "1K",
                "pro": "1K"
            },
            "pricing": {
                "flash": {
                    "cost_per_image": 0.039,
                    "revenue_per_image": 0.10
                },
                "pro": {
                    "1K": {
                        "cost_per_image": 0.03633,
                        "revenue_per_image": 0.10
                    },
                    "2K": {
                        "cost_per_image": 0.03633,
                        "revenue_per_image": 0.10
                    },
                    "4K": {
                        "cost_per_image": 0.06,
                        "revenue_per_image": 0.15
                    }
                }
            },
            "requires_api_key": true,
            "api_key_storage": "encrypted_ephemeral"
        }'::jsonb,
        0.039,
        0.10,
        NOW(),
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Successfully created Image Factory workflow for Estee.';
END $$;

-- Add comment
COMMENT ON TABLE workflows IS 'Workflows can have different types (workflow_type in config). nano_banana type uses Google Gemini for batch image generation.';
