const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const workflows = [
  {
    name: 'Batch Image Generator',
    description: 'Generate multiple AI images from a list of prompts using Midjourney API',
    status: 'deployed',
    config: {
      model: 'midjourney',
      version: 'v5.2',
      style: 'photorealistic',
      max_images: 100,
      timeout_seconds: 1800,
      retry_count: 3,
      output_format: 'png',
      resolution: '1024x1024'
    },
    cost_per_execution: 15.00,
    revenue_per_execution: 250.00
  },
  {
    name: 'Style Transfer Pipeline',
    description: 'Apply artistic styles to client images automatically',
    status: 'deployed',
    config: {
      model: 'stable-diffusion',
      styles: ['watercolor', 'oil-painting', 'sketch', 'anime'],
      max_images: 50,
      timeout_seconds: 1200,
      retry_count: 2
    },
    cost_per_execution: 10.00,
    revenue_per_execution: 180.00
  },
  {
    name: 'Product Photo Enhancer',
    description: 'AI-powered product photography enhancement and background removal',
    status: 'deployed',
    config: {
      model: 'clipdrop',
      features: ['background_removal', 'upscaling', 'lighting_enhancement'],
      max_images: 200,
      timeout_seconds: 900,
      output_quality: 'high'
    },
    cost_per_execution: 8.00,
    revenue_per_execution: 150.00
  },
  {
    name: 'Social Media Content Generator',
    description: 'Generate branded social media visuals with text overlays',
    status: 'deployed',
    config: {
      platforms: ['instagram', 'facebook', 'linkedin'],
      formats: ['post', 'story', 'banner'],
      max_images: 30,
      timeout_seconds: 600,
      branding: true
    },
    cost_per_execution: 12.00,
    revenue_per_execution: 200.00
  },
  {
    name: 'Logo Variation Creator',
    description: 'Generate multiple logo variations and color schemes',
    status: 'deployed',
    config: {
      model: 'dalle-3',
      variations: 20,
      color_schemes: ['monochrome', 'vibrant', 'pastel', 'corporate'],
      timeout_seconds: 1200,
      vector_output: false
    },
    cost_per_execution: 20.00,
    revenue_per_execution: 350.00
  },
  {
    name: 'Moodboard Generator',
    description: 'Create visual moodboards from keyword inputs',
    status: 'deployed',
    config: {
      sources: ['unsplash', 'pexels', 'midjourney'],
      images_per_board: 9,
      layout: 'grid',
      timeout_seconds: 600
    },
    cost_per_execution: 5.00,
    revenue_per_execution: 120.00
  },
  {
    name: 'Image Upscaler Pro',
    description: 'AI-powered image upscaling up to 4K resolution',
    status: 'deployed',
    config: {
      model: 'real-esrgan',
      max_upscale: '4x',
      denoise: true,
      face_enhancement: true,
      timeout_seconds: 1500,
      max_images: 100
    },
    cost_per_execution: 6.00,
    revenue_per_execution: 100.00
  },
  {
    name: 'Portrait Background Replacer',
    description: 'Replace portrait backgrounds with AI-generated scenes',
    status: 'deployed',
    config: {
      model: 'stable-diffusion-inpainting',
      background_types: ['professional', 'outdoor', 'studio', 'abstract'],
      max_images: 50,
      timeout_seconds: 1200
    },
    cost_per_execution: 11.00,
    revenue_per_execution: 190.00
  },
  {
    name: 'Batch Watermark Applier',
    description: 'Apply custom watermarks to large image batches',
    status: 'deployed',
    config: {
      positions: ['bottom-right', 'center', 'top-left'],
      opacity: 0.7,
      max_images: 500,
      timeout_seconds: 300,
      formats: ['png', 'jpg', 'webp']
    },
    cost_per_execution: 2.00,
    revenue_per_execution: 50.00
  },
  {
    name: 'AI Avatar Generator',
    description: 'Generate professional AI avatars from photos',
    status: 'deployed',
    config: {
      model: 'midjourney',
      styles: ['professional', 'cartoon', 'artistic', '3d-render'],
      variations_per_photo: 4,
      max_photos: 10,
      timeout_seconds: 1800
    },
    cost_per_execution: 18.00,
    revenue_per_execution: 300.00
  }
];

async function seedWorkflows() {
  try {
    // Get Estee client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('email', 'estee@masstock.com')
      .single();

    if (clientError || !client) {
      console.error('Client not found:', clientError);
      return;
    }

    console.log('Found client:', client.id);

    // Insert workflows
    for (const workflow of workflows) {
      const { data, error } = await supabase
        .from('workflows')
        .insert([{
          client_id: client.id,
          ...workflow
        }])
        .select();

      if (error) {
        console.error('Error creating workflow:', workflow.name, error);
      } else {
        console.log('Created workflow:', workflow.name);
      }
    }

    // Verify
    const { data: allWorkflows } = await supabase
      .from('workflows')
      .select('id, name')
      .eq('client_id', client.id);

    console.log('\n✓ Total workflows created:', allWorkflows?.length || 0);
    console.log(allWorkflows);
  } catch (error) {
    console.error('Error:', error);
  }
}

seedWorkflows().then(() => process.exit(0));
