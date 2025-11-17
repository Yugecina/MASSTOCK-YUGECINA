-- ============================================================================
-- Seed Data for MasStock MVP
-- Description: Create test data for Estee (first client)
-- ============================================================================

-- Note: User creation is handled by Supabase Auth
-- This seed assumes admin user already exists via Supabase Auth UI
-- You'll need to get the actual UUID from Supabase after user creation

-- ============================================================================
-- INSERT ADMIN USER (Example - adjust UUID from Supabase)
-- ============================================================================
-- This is a placeholder. In practice, create this user via Supabase Auth dashboard
-- Then update the role in the users table

-- Update admin role (replace with actual admin user ID from Supabase)
-- UPDATE users SET role = 'admin' WHERE email = 'admin@masstock.com';

-- ============================================================================
-- INSERT ESTEE CLIENT (First MVP Client)
-- ============================================================================

-- Create Estee user account (placeholder - will be created via Supabase Auth)
-- After creating via Auth, insert client record

INSERT INTO clients (
    id,
    name,
    email,
    company_name,
    plan,
    status,
    subscription_amount,
    subscription_start_date,
    subscription_end_date,
    metadata
) VALUES (
    uuid_generate_v4(),
    'Estee',
    'contact@estee-agency.com',
    'Estee - Agence de Génération d''Images IA',
    'premium_custom',
    'active',
    2500.00,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year',
    '{
        "industry": "AI Content Generation",
        "team_size": "5-10",
        "main_use_case": "Batch image generation for clients",
        "onboarding_date": "2024-11-14",
        "account_manager": "MasStock Team"
    }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Get Estee client ID for workflows
DO $$
DECLARE
    estee_client_id UUID;
BEGIN
    SELECT id INTO estee_client_id FROM clients WHERE email = 'contact@estee-agency.com';

    IF estee_client_id IS NOT NULL THEN
        -- ============================================================================
        -- INSERT 10 WORKFLOWS FOR ESTEE
        -- ============================================================================

        -- Workflow 1: Batch Image Generator
        INSERT INTO workflows (
            client_id,
            name,
            description,
            status,
            config,
            cost_per_execution,
            revenue_per_execution
        ) VALUES (
            estee_client_id,
            'Batch Image Generator',
            'Generate multiple AI images from a list of prompts using Midjourney API',
            'deployed',
            '{
                "model": "midjourney",
                "version": "v5.2",
                "style": "photorealistic",
                "max_images": 100,
                "timeout_seconds": 1800,
                "retry_count": 3,
                "output_format": "png",
                "resolution": "1024x1024"
            }'::jsonb,
            15.00,
            250.00
        );

        -- Workflow 2: Style Transfer Pipeline
        INSERT INTO workflows (
            client_id,
            name,
            description,
            status,
            config,
            cost_per_execution,
            revenue_per_execution
        ) VALUES (
            estee_client_id,
            'Style Transfer Pipeline',
            'Apply artistic styles to client images automatically',
            'deployed',
            '{
                "model": "stable-diffusion",
                "styles": ["watercolor", "oil-painting", "sketch", "anime"],
                "max_images": 50,
                "timeout_seconds": 1200,
                "retry_count": 2
            }'::jsonb,
            10.00,
            180.00
        );

        -- Workflow 3: Product Photo Enhancer
        INSERT INTO workflows (
            client_id,
            name,
            description,
            status,
            config,
            cost_per_execution,
            revenue_per_execution
        ) VALUES (
            estee_client_id,
            'Product Photo Enhancer',
            'AI-powered product photography enhancement and background removal',
            'deployed',
            '{
                "model": "clipdrop",
                "features": ["background_removal", "upscaling", "lighting_enhancement"],
                "max_images": 200,
                "timeout_seconds": 900,
                "output_quality": "high"
            }'::jsonb,
            8.00,
            150.00
        );

        -- Workflow 4: Social Media Content Generator
        INSERT INTO workflows (
            client_id,
            name,
            description,
            status,
            config,
            cost_per_execution,
            revenue_per_execution
        ) VALUES (
            estee_client_id,
            'Social Media Content Generator',
            'Generate branded social media visuals with text overlays',
            'deployed',
            '{
                "platforms": ["instagram", "facebook", "linkedin"],
                "formats": ["post", "story", "banner"],
                "max_images": 30,
                "timeout_seconds": 600,
                "branding": true
            }'::jsonb,
            12.00,
            200.00
        );

        -- Workflow 5: Logo Variation Creator
        INSERT INTO workflows (
            client_id,
            name,
            description,
            status,
            config,
            cost_per_execution,
            revenue_per_execution
        ) VALUES (
            estee_client_id,
            'Logo Variation Creator',
            'Generate multiple logo variations and color schemes',
            'deployed',
            '{
                "model": "dalle-3",
                "variations": 20,
                "color_schemes": ["monochrome", "vibrant", "pastel", "corporate"],
                "timeout_seconds": 1200,
                "vector_output": false
            }'::jsonb,
            20.00,
            350.00
        );

        -- Workflow 6: Moodboard Generator
        INSERT INTO workflows (
            client_id,
            name,
            description,
            status,
            config,
            cost_per_execution,
            revenue_per_execution
        ) VALUES (
            estee_client_id,
            'Moodboard Generator',
            'Create visual moodboards from keyword inputs',
            'deployed',
            '{
                "sources": ["unsplash", "pexels", "midjourney"],
                "images_per_board": 9,
                "layout": "grid",
                "timeout_seconds": 600
            }'::jsonb,
            5.00,
            120.00
        );

        -- Workflow 7: Image Upscaler Pro
        INSERT INTO workflows (
            client_id,
            name,
            description,
            status,
            config,
            cost_per_execution,
            revenue_per_execution
        ) VALUES (
            estee_client_id,
            'Image Upscaler Pro',
            'AI-powered image upscaling up to 4K resolution',
            'deployed',
            '{
                "model": "real-esrgan",
                "max_upscale": "4x",
                "denoise": true,
                "face_enhancement": true,
                "timeout_seconds": 1500,
                "max_images": 100
            }'::jsonb,
            6.00,
            100.00
        );

        -- Workflow 8: Portrait Background Replacer
        INSERT INTO workflows (
            client_id,
            name,
            description,
            status,
            config,
            cost_per_execution,
            revenue_per_execution
        ) VALUES (
            estee_client_id,
            'Portrait Background Replacer',
            'Replace portrait backgrounds with AI-generated scenes',
            'deployed',
            '{
                "model": "stable-diffusion-inpainting",
                "background_types": ["professional", "outdoor", "studio", "abstract"],
                "max_images": 50,
                "timeout_seconds": 1200
            }'::jsonb,
            11.00,
            190.00
        );

        -- Workflow 9: Batch Watermark Applier
        INSERT INTO workflows (
            client_id,
            name,
            description,
            status,
            config,
            cost_per_execution,
            revenue_per_execution
        ) VALUES (
            estee_client_id,
            'Batch Watermark Applier',
            'Apply custom watermarks to large image batches',
            'deployed',
            '{
                "positions": ["bottom-right", "center", "top-left"],
                "opacity": 0.7,
                "max_images": 500,
                "timeout_seconds": 300,
                "formats": ["png", "jpg", "webp"]
            }'::jsonb,
            2.00,
            50.00
        );

        -- Workflow 10: AI Avatar Generator
        INSERT INTO workflows (
            client_id,
            name,
            description,
            status,
            config,
            cost_per_execution,
            revenue_per_execution
        ) VALUES (
            estee_client_id,
            'AI Avatar Generator',
            'Generate professional AI avatars from photos',
            'deployed',
            '{
                "model": "midjourney",
                "styles": ["professional", "cartoon", "artistic", "3d-render"],
                "variations_per_photo": 4,
                "max_photos": 10,
                "timeout_seconds": 1800
            }'::jsonb,
            18.00,
            300.00
        );

    END IF;
END $$;

-- ============================================================================
-- INSERT SAMPLE WORKFLOW EXECUTIONS (For testing dashboard)
-- ============================================================================

DO $$
DECLARE
    estee_client_id UUID;
    workflow_id UUID;
BEGIN
    SELECT id INTO estee_client_id FROM clients WHERE email = 'contact@estee-agency.com';

    IF estee_client_id IS NOT NULL THEN
        -- Get first workflow ID
        SELECT id INTO workflow_id FROM workflows
        WHERE client_id = estee_client_id
        LIMIT 1;

        IF workflow_id IS NOT NULL THEN
            -- Completed execution
            INSERT INTO workflow_executions (
                workflow_id,
                client_id,
                status,
                input_data,
                output_data,
                started_at,
                completed_at,
                duration_seconds
            ) VALUES (
                workflow_id,
                estee_client_id,
                'completed',
                '{"prompts": ["sunset over mountains", "city skyline at night"], "count": 2}'::jsonb,
                '{"images": ["https://example.com/img1.png", "https://example.com/img2.png"], "count": 2}'::jsonb,
                NOW() - INTERVAL '2 hours',
                NOW() - INTERVAL '1 hour 45 minutes',
                900
            );

            -- Pending execution
            INSERT INTO workflow_executions (
                workflow_id,
                client_id,
                status,
                input_data,
                started_at
            ) VALUES (
                workflow_id,
                estee_client_id,
                'pending',
                '{"prompts": ["abstract art"], "count": 1}'::jsonb,
                NOW()
            );
        END IF;
    END IF;
END $$;

-- ============================================================================
-- INSERT SAMPLE WORKFLOW REQUEST (For testing)
-- ============================================================================

DO $$
DECLARE
    estee_client_id UUID;
BEGIN
    SELECT id INTO estee_client_id FROM clients WHERE email = 'contact@estee-agency.com';

    IF estee_client_id IS NOT NULL THEN
        INSERT INTO workflow_requests (
            client_id,
            title,
            description,
            use_case,
            frequency,
            budget,
            status,
            timeline,
            estimated_cost,
            estimated_dev_days
        ) VALUES (
            estee_client_id,
            'Video Thumbnail Generator',
            'Automated thumbnail generation for YouTube videos with text overlays and branding',
            'Create eye-catching thumbnails for 50+ videos per month',
            'weekly',
            500.00,
            'submitted',
            '{
                "submitted_at": "2024-11-14T10:00:00Z",
                "estimate_sent_at": null,
                "negotiation_started_at": null,
                "contract_signed_at": null,
                "dev_started_at": null,
                "deployed_at": null
            }'::jsonb,
            1500.00,
            5
        );
    END IF;
END $$;

-- ============================================================================
-- VERIFY SEED DATA
-- ============================================================================

-- Show created client
SELECT
    name,
    email,
    plan,
    status,
    subscription_amount,
    (SELECT COUNT(*) FROM workflows WHERE client_id = clients.id) as workflow_count
FROM clients
WHERE email = 'contact@estee-agency.com';

-- Show workflows
SELECT
    name,
    status,
    cost_per_execution,
    revenue_per_execution
FROM workflows
WHERE client_id = (SELECT id FROM clients WHERE email = 'contact@estee-agency.com')
ORDER BY created_at;
