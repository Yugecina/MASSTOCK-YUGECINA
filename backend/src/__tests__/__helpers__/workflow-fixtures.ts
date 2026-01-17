/**
 * Test data fixtures for all workflows
 * Provides valid, edge, and error test cases for Nano Banana, Smart Resizer, and Room Redesigner
 *
 * Usage:
 * import { nanoBananaFixtures, MOCK_USER_ID } from '../../__helpers__/workflow-fixtures';
 *
 * const testData = nanoBananaFixtures.singlePrompt;
 */

import { v4 as uuidv4 } from 'uuid';

// Mock UUIDs for consistent testing
export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';
export const MOCK_CLIENT_ID = '00000000-0000-0000-0000-000000000002';
export const MOCK_WORKFLOW_ID = '00000000-0000-0000-0000-000000000003';

// Deterministic 1x1 transparent PNG (valid base64)
export const MOCK_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// ============================================================================
// NANO BANANA (Image Factory) FIXTURES
// ============================================================================

export const nanoBananaFixtures = {
  // ===== VALID CASES =====
  singlePrompt: {
    prompts: ['A modern minimalist living room with large windows'],
    model: 'gemini-2.5-flash-image',
    aspect_ratio: '16:9',
    resolution: '1K'
  },

  multiplePrompts: {
    prompts: [
      'A cozy bedroom with warm lighting',
      'A spacious kitchen with marble countertops',
      'A luxurious bathroom with gold fixtures'
    ],
    model: 'gemini-2.5-flash-image',
    aspect_ratio: '1:1',
    resolution: '1K'
  },

  withReferenceImages: {
    prompts: ['A room in this style'],
    model: 'gemini-2.5-flash-image',
    aspect_ratio: '16:9',
    resolution: '1K',
    reference_images: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        mime_type: 'image/png',
        name: 'reference1.png'
      }
    ]
  },

  proModel4K: {
    prompts: ['Ultra high quality architectural photo'],
    model: 'gemini-3-pro-image-preview',
    aspect_ratio: '16:9',
    resolution: '4K'
  },

  proModel2K: {
    prompts: ['High quality interior design'],
    model: 'gemini-3-pro-image-preview',
    aspect_ratio: '16:9',
    resolution: '2K'
  },

  proModel1K: {
    prompts: ['Standard quality room photo'],
    model: 'gemini-3-pro-image-preview',
    aspect_ratio: '16:9',
    resolution: '1K'
  },

  // ===== EDGE CASES =====
  emptyPromptsList: {
    prompts: [],
    model: 'gemini-2.5-flash-image',
    aspect_ratio: '16:9'
  },

  longPrompt: {
    prompts: ['A'.repeat(5000)], // Very long prompt (5000 chars)
    model: 'gemini-2.5-flash-image',
    aspect_ratio: '16:9'
  },

  largeBatch: {
    prompts: Array(100).fill('Test prompt'), // Max batch size
    model: 'gemini-2.5-flash-image',
    aspect_ratio: '16:9'
  },

  specialCharacters: {
    prompts: ['Prompt with émojis 🏠 and spëcial çhars & symbols @#$%'],
    model: 'gemini-2.5-flash-image',
    aspect_ratio: '16:9'
  },

  multipleReferenceImages: {
    prompts: ['Generate in this style'],
    model: 'gemini-2.5-flash-image',
    aspect_ratio: '16:9',
    reference_images: Array(14).fill(null).map((_, i) => ({
      image_base64: MOCK_IMAGE_BASE64,
      mime_type: 'image/png',
      name: `reference${i + 1}.png`
    }))
  },

  // ===== ERROR CASES =====
  missingApiKey: {
    prompts: ['Test prompt'],
    model: 'gemini-2.5-flash-image',
    aspect_ratio: '16:9'
    // api_key intentionally missing
  },

  invalidModel: {
    prompts: ['Test prompt'],
    model: 'invalid-model-name',
    aspect_ratio: '16:9'
  },

  invalidAspectRatio: {
    prompts: ['Test prompt'],
    model: 'gemini-2.5-flash-image',
    aspect_ratio: '99:99' // Invalid ratio
  },

  invalidResolution: {
    prompts: ['Test prompt'],
    model: 'gemini-3-pro-image-preview',
    aspect_ratio: '16:9',
    resolution: '8K' // Invalid resolution
  },

  tooManyReferenceImages: {
    prompts: ['Test prompt'],
    model: 'gemini-2.5-flash-image',
    aspect_ratio: '16:9',
    reference_images: Array(20).fill(null).map((_, i) => ({ // Max is 14
      image_base64: MOCK_IMAGE_BASE64,
      mime_type: 'image/png',
      name: `reference${i + 1}.png`
    }))
  }
};

// ============================================================================
// SMART RESIZER FIXTURES
// ============================================================================

export const smartResizerFixtures = {
  // ===== VALID CASES =====
  singleImageMultipleFormats: {
    batch: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: 'test.png',
        formats: ['instagram_feed', 'tiktok_video', 'facebook_post']
      }
    ],
    ai_regeneration: false
  },

  multipleImagesWithAI: {
    batch: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: 'image1.png',
        formats: ['instagram_story']
      },
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/jpeg',
        image_name: 'image2.jpg',
        formats: ['youtube_thumbnail']
      }
    ],
    ai_regeneration: true
  },

  allFormats: {
    batch: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: 'test-all-formats.png',
        formats: [
          'instagram_feed',
          'instagram_story',
          'tiktok_video',
          'facebook_post',
          'facebook_story',
          'youtube_thumbnail',
          'linkedin_post',
          'twitter_post'
        ]
      }
    ],
    ai_regeneration: false
  },

  // ===== EDGE CASES =====
  emptyBatch: {
    batch: [],
    ai_regeneration: false
  },

  largeImageBatch: {
    batch: Array(50).fill(null).map((_, i) => ({
      image_base64: MOCK_IMAGE_BASE64,
      image_mime: 'image/png',
      image_name: `image${i + 1}.png`,
      formats: ['instagram_feed']
    })),
    ai_regeneration: false
  },

  // ===== ERROR CASES =====
  invalidFormat: {
    batch: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: 'test.png',
        formats: ['invalid_format_name']
      }
    ],
    ai_regeneration: false
  },

  invalidBase64: {
    batch: [
      {
        image_base64: 'not-valid-base64!!!',
        image_mime: 'image/png',
        image_name: 'test.png',
        formats: ['instagram_feed']
      }
    ],
    ai_regeneration: false
  },

  invalidMimeType: {
    batch: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'application/pdf', // Not an image
        image_name: 'test.pdf',
        formats: ['instagram_feed']
      }
    ],
    ai_regeneration: false
  }
};

// ============================================================================
// ROOM REDESIGNER FIXTURES
// ============================================================================

export const roomRedesignerFixtures = {
  // ===== VALID CASES =====
  emptyRoomModern: {
    room_images: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: 'empty-room.png',
        design_style: 'modern',
        budget_level: 'medium'
      }
    ]
  },

  furnishedRoomMinimalist: {
    room_images: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: 'furnished-room.png',
        design_style: 'minimalist',
        budget_level: 'high',
        season: 'noel'
      }
    ]
  },

  batchMultipleRooms: {
    room_images: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: 'living-room.png',
        design_style: 'modern',
        budget_level: 'medium'
      },
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/jpeg',
        image_name: 'bedroom.jpg',
        design_style: 'scandinavian',
        budget_level: 'low'
      },
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: 'kitchen.png',
        design_style: 'industrial',
        budget_level: 'luxury',
        season: 'spring'
      }
    ]
  },

  allDesignStyles: [
    'modern',
    'minimalist',
    'industrial',
    'scandinavian',
    'contemporary',
    'coastal',
    'farmhouse',
    'midcentury',
    'traditional'
  ].map(style => ({
    room_images: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: `room-${style}.png`,
        design_style: style,
        budget_level: 'medium'
      }
    ]
  })),

  allBudgetLevels: [
    'low',
    'medium',
    'high',
    'luxury'
  ].map(budget => ({
    room_images: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: `room-${budget}.png`,
        design_style: 'modern',
        budget_level: budget
      }
    ]
  })),

  allSeasons: [
    'spring',
    'summer',
    'autumn',
    'winter',
    'noel'
  ].map(season => ({
    room_images: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: `room-${season}.png`,
        design_style: 'modern',
        budget_level: 'medium',
        season: season
      }
    ]
  })),

  // ===== EDGE CASES =====
  emptyArray: {
    room_images: []
  },

  noSeason: {
    room_images: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: 'room.png',
        design_style: 'modern',
        budget_level: 'medium'
        // season omitted (should be allowed)
      }
    ]
  },

  // ===== ERROR CASES =====
  missingStyle: {
    room_images: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: 'room.png',
        // design_style missing
        budget_level: 'medium'
      }
    ]
  },

  missingBudget: {
    room_images: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: 'room.png',
        design_style: 'modern'
        // budget_level missing
      }
    ]
  },

  invalidStyle: {
    room_images: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: 'room.png',
        design_style: 'invalid-style-name',
        budget_level: 'medium'
      }
    ]
  },

  invalidBudget: {
    room_images: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: 'room.png',
        design_style: 'modern',
        budget_level: 'ultra-luxury' // Invalid budget level
      }
    ]
  },

  invalidSeason: {
    room_images: [
      {
        image_base64: MOCK_IMAGE_BASE64,
        image_mime: 'image/png',
        image_name: 'room.png',
        design_style: 'modern',
        budget_level: 'medium',
        season: 'monsoon' // Invalid season
      }
    ]
  }
};

// ============================================================================
// MOCK WORKFLOW CONFIGS
// ============================================================================

export const mockWorkflowConfig = {
  nano_banana: {
    workflow_type: 'nano_banana',
    api_key_encrypted: {
      iv: 'bW9jay1pdi0xMjM0NTY3ODkw', // Base64 mock
      encryptedData: 'bW9jay1lbmNyeXB0ZWQtYXBpLWtleQ==', // Base64 mock
      authTag: 'bW9jay1hdXRoLXRhZy0xNmI=' // Base64 mock
    },
    model: 'gemini-2.5-flash-image',
    aspect_ratio: '16:9',
    resolution: '1K',
    available_models: ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'],
    aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    pricing: {
      flash: {
        cost_per_image: 0.0025,
        revenue_per_image: 0.05
      },
      pro: {
        '1K': { cost_per_image: 0.01, revenue_per_image: 0.2 },
        '2K': { cost_per_image: 0.02, revenue_per_image: 0.4 },
        '4K': { cost_per_image: 0.04, revenue_per_image: 0.8 }
      }
    },
    max_prompts: 100,
    max_reference_images: 14
  },

  smart_resizer: {
    workflow_type: 'smart_resizer',
    pricing: {
      cost_per_format: 0.005,
      revenue_per_format: 0.1
    },
    available_formats: [
      { id: 'instagram_feed', name: 'Instagram Feed', width: 1080, height: 1080 },
      { id: 'instagram_story', name: 'Instagram Story', width: 1080, height: 1920 },
      { id: 'tiktok_video', name: 'TikTok Video', width: 1080, height: 1920 },
      { id: 'facebook_post', name: 'Facebook Post', width: 1200, height: 630 },
      { id: 'facebook_story', name: 'Facebook Story', width: 1080, height: 1920 },
      { id: 'youtube_thumbnail', name: 'YouTube Thumbnail', width: 1280, height: 720 },
      { id: 'linkedin_post', name: 'LinkedIn Post', width: 1200, height: 627 },
      { id: 'twitter_post', name: 'Twitter Post', width: 1200, height: 675 }
    ]
  },

  room_redesigner: {
    workflow_type: 'room_redesigner',
    api_key_encrypted: {
      iv: 'bW9jay1pdi0xMjM0NTY3ODkw',
      encryptedData: 'bW9jay1lbmNyeXB0ZWQtYXBpLWtleQ==',
      authTag: 'bW9jay1hdXRoLXRhZy0xNmI='
    },
    pricing: {
      cost_per_image: 0.015,
      revenue_per_image: 0.3
    },
    available_styles: ['modern', 'minimalist', 'industrial', 'scandinavian', 'contemporary', 'coastal', 'farmhouse', 'midcentury', 'traditional'],
    budget_levels: ['low', 'medium', 'high', 'luxury'],
    seasons: ['spring', 'summer', 'autumn', 'winter', 'noel']
  }
};

// ============================================================================
// EXPECTED DATABASE STATES
// ============================================================================

export const expectedExecutionStates = {
  pending: {
    status: 'pending',
    started_at: null,
    completed_at: null,
    error_message: null
  },
  processing: {
    status: 'processing',
    started_at: expect.any(String),
    completed_at: null,
    error_message: null
  },
  completed: {
    status: 'completed',
    started_at: expect.any(String),
    completed_at: expect.any(String),
    error_message: null
  },
  failed: {
    status: 'failed',
    started_at: expect.any(String),
    completed_at: expect.any(String),
    error_message: expect.any(String)
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique workflow execution ID for testing
 */
export function generateMockExecutionId(): string {
  return uuidv4();
}

/**
 * Create mock encrypted API key structure
 */
export function createMockEncryptedApiKey() {
  return {
    iv: Buffer.from('mock-iv-1234567890').toString('base64'),
    encryptedData: Buffer.from('mock-encrypted-api-key').toString('base64'),
    authTag: Buffer.from('mock-auth-tag-16b').toString('base64')
  };
}
