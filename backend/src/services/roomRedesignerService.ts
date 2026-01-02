/**
 * Room Redesigner Service
 *
 * Integrates with Nano Banana Pro API to redesign room photographs
 * with AI-powered interior design transformations.
 */

import axios, { AxiosError } from 'axios';
import { logger } from '../config/logger';

// Design styles supported (synchronized with validation schema)
export type DesignStyle =
  | 'modern'
  | 'minimalist'
  | 'industrial'
  | 'scandinavian'
  | 'contemporary'
  | 'coastal'
  | 'farmhouse'
  | 'midcentury';

export type BudgetLevel = 'low' | 'medium' | 'high' | 'luxury';

export interface RoomRedesignerInput {
  image_base64: string;
  image_mime: string;
  design_style: DesignStyle;
  seasonal_preference?: string;
  budget_level?: BudgetLevel;
  api_key: string;
}

export interface RoomRedesignerResult {
  success: boolean;
  image_base64?: string;
  processing_time?: number;
  prompt_used?: string;
  error?: string;
}

interface PromptOptions {
  design_style: DesignStyle;
  seasonal_preference?: string;
  budget_level?: BudgetLevel;
}

class RoomRedesignerService {
  private apiUrl: string;
  private model: string;

  constructor() {
    // Nano Banana Pro = Gemini 3 Pro Image Preview (advanced AI image generation)
    this.apiUrl = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models';
    this.model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview'; // Nano Banana Pro
  }

  /**
   * Build a detailed prompt for room redesign based on user preferences
   * Optimized for real estate virtual staging with strict architectural preservation
   */
  buildPrompt(options: PromptOptions): string {
    const {
      design_style,
      seasonal_preference,
      budget_level,
    } = options;

    // SECTION 1: Task Definition
    let prompt = `You are a professional virtual staging AI for real estate photography. `;
    prompt += `Using the provided room photograph, add furniture and decorations in a ${design_style} style.`;

    // SECTION 2: Absolute Preservation Rules (RENFORCÉ v2)
    prompt += `

ABSOLUTE PRESERVATION - NEVER MODIFY THESE ELEMENTS:

GLAZING & OPENINGS (most critical):
- Sliding glass doors / bay windows: preserve EXACT number of panels, frame color, dimensions
- All windows: keep exact position, size, shape, and frame style
- All doors: keep exact position, size, style, and handle placement
- Balcony/terrace access: preserve exact glass panel configuration

SURFACES (do not change material or color):
- Floor: keep the EXACT flooring material (tile, wood, carpet, concrete) and color
- Walls: preserve wall color, texture, and any architectural details
- Ceiling: keep exact ceiling type, height, beams, coffers, or architectural features

FIXED ELEMENTS:
- Built-in lighting: preserve track lights, recessed lights, ceiling fixtures positions
- Electrical: keep outlets, switches, thermostats in exact positions
- HVAC: preserve vents, radiators, air conditioning units
- Built-in furniture: keep any built-in shelves, closets, kitchen cabinets

ARCHITECTURAL FEATURES:
- Columns, beams, arches: preserve all structural elements
- Ceiling details: keep any drops, trays, or architectural ceiling features
- Wall niches, alcoves: preserve all wall configurations

EMPTY ROOM WARNING:
If this room appears empty or sparsely furnished, be EXTRA CAREFUL to preserve:
- Exact room dimensions and proportions (do not expand or shrink the space)
- All wall positions and angles (preserve exact room shape)
- Window and door placements EXACTLY as shown in the photograph
- Floor material, pattern, and color WITHOUT ANY CHANGES
ONLY add furniture and decorations - do NOT recreate or modify the room structure.`;

    // SECTION 3: Staging scope (RENFORCÉ v2)
    prompt += `

YOUR STAGING TASK - YOU MAY ONLY ADD:
- Freestanding furniture (sofas, chairs, tables, beds - NOT built-in)
- Decorative objects (plants, artwork, vases, books, cushions)
- Rugs and carpets (placed ON existing floor, not replacing it)
- Table lamps and floor lamps (NOT ceiling fixtures)
- Window treatments (curtains/blinds that FRAME windows, never hide them)
- Soft furnishings that match ${design_style} aesthetic

YOU MUST NOT:
- Change any flooring material or color
- Modify ceiling structure or lighting fixtures
- Alter window/door configurations or frame colors
- Add or remove any architectural elements`;

    // SECTION 4: Style-specific guidance
    if (seasonal_preference) {
      prompt += `

Incorporate subtle ${seasonal_preference} seasonal touches in decor colors and accessories.`;
    }

    if (budget_level) {
      const budgetGuidance: Record<BudgetLevel, string> = {
        low: 'Use accessible, functional furniture with clean lines. IKEA-style practicality.',
        medium: 'Use quality mid-range furniture. West Elm or Crate & Barrel aesthetic.',
        high: 'Use premium designer furniture. Restoration Hardware or Design Within Reach quality.',
        luxury: 'Use high-end bespoke pieces. Custom designer furniture and statement art pieces.',
      };
      prompt += `

Budget aesthetic: ${budgetGuidance[budget_level]}`;
    }

    // SECTION 5: Output requirements
    prompt += `

OUTPUT REQUIREMENTS FOR REAL ESTATE:
- Photorealistic quality suitable for MLS listings
- Furniture must be realistically proportioned (no distorted perspectives)
- Staging must enhance the space without overcrowding
- Maintain professional, neutral appeal for broad buyer attraction
- The result must accurately represent the actual room dimensions and features`;

    return prompt;
  }

  /**
   * Redesign a single room image using Nano Banana Pro
   */
  async redesignRoom(input: RoomRedesignerInput): Promise<RoomRedesignerResult> {
    const startTime = Date.now();
    const imageSize = input.image_base64 ? Buffer.from(input.image_base64, 'base64').length : 0;

    try {
      logger.info('🎨 RoomRedesignerService.redesignRoom: Starting room redesign', {
        design_style: input.design_style,
        seasonal_preference: input.seasonal_preference,
        budget_level: input.budget_level,
        image_mime: input.image_mime,
        image_size_kb: Math.round(imageSize / 1024),
      });

      // Validate image format
      if (!input.image_base64 || input.image_base64.length === 0) {
        logger.error('❌ RoomRedesignerService.redesignRoom: Invalid image format', {
          has_base64: !!input.image_base64,
          base64_length: input.image_base64?.length || 0,
        });
        throw new Error('Invalid image format');
      }

      // Validate API key
      if (!input.api_key) {
        logger.error('❌ RoomRedesignerService.redesignRoom: Missing API key');
        throw new Error('Invalid API key');
      }

      // Build the redesign prompt
      const prompt = this.buildPrompt({
        design_style: input.design_style,
        seasonal_preference: input.seasonal_preference,
        budget_level: input.budget_level,
      });

      logger.info('📝 RoomRedesignerService.redesignRoom: Prompt generated', {
        prompt,
        prompt_length: prompt.length,
      });

      // Call Nano Banana Pro API (Gemini 3 Pro Image Preview)
      const endpoint = `${this.apiUrl}/${this.model}:generateContent`;
      logger.info('🚀 RoomRedesignerService.redesignRoom: Calling Nano Banana Pro API', {
        endpoint,
        model: this.model,
        has_input_image: !!input.image_base64,
        prompt_length: prompt.length,
      });

      // Google Gemini API format for image editing
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: input.image_mime || 'image/jpeg',
                  data: input.image_base64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ['Image']
        }
      };

      const response = await axios.post(
        endpoint,
        requestBody,
        {
          headers: {
            'x-goog-api-key': input.api_key,
            'Content-Type': 'application/json',
          },
          timeout: 300000, // 5 minutes timeout (increased for complex images)
        }
      );

      const processingTime = Date.now() - startTime;

      // Extract image from Google Gemini response format
      // Response structure: { candidates: [{ content: { parts: [{ inlineData: { data: "base64..." } }] } }] }
      // Support both snake_case (inline_data) and camelCase (inlineData) for API compatibility
      const candidate = response.data?.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData || part.inline_data);
      const inlineData = imagePart?.inlineData || imagePart?.inline_data;
      const imageBase64 = inlineData?.data;

      if (!imageBase64) {
        logger.error('❌ RoomRedesignerService.redesignRoom: No image in response', {
          processing_time_ms: processingTime,
          has_candidates: !!response.data?.candidates,
          has_candidate: !!candidate,
          has_content: !!candidate?.content,
          has_parts: !!candidate?.content?.parts,
          parts_count: candidate?.content?.parts?.length,
          has_imagePart: !!imagePart,
          has_inlineData: !!inlineData,
          response_structure: JSON.stringify(response.data).substring(0, 500),
        });
        throw new Error('No image returned by API');
      }

      logger.info('✅ RoomRedesignerService.redesignRoom: Redesign successful', {
        processing_time_ms: processingTime,
        processing_time_sec: (processingTime / 1000).toFixed(2),
        has_result: true,
        result_size_kb: Math.round(Buffer.from(imageBase64, 'base64').length / 1024),
      });

      return {
        success: true,
        image_base64: imageBase64,
        processing_time: processingTime,
        prompt_used: prompt,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      const processingTime = Date.now() - startTime;

      // Handle specific error cases
      if (axiosError.response?.status === 401) {
        logger.error('❌ RoomRedesignerService.redesignRoom: Invalid API key', {
          status: 401,
          processing_time_ms: processingTime,
          processing_time_sec: (processingTime / 1000).toFixed(2),
          response_data: axiosError.response?.data,
        });
        throw new Error('Invalid API key');
      }

      if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
        logger.error('❌ RoomRedesignerService.redesignRoom: Request timeout', {
          timeout_ms: 300000,
          processing_time_ms: processingTime,
          processing_time_sec: (processingTime / 1000).toFixed(2),
          error_code: axiosError.code,
        });
        throw new Error('Request timeout - the redesign process took too long');
      }

      logger.error('❌ RoomRedesignerService.redesignRoom: Redesign failed', {
        error_message: axiosError.message,
        error_code: axiosError.code,
        response_data: axiosError.response?.data,
        response_status: axiosError.response?.status,
        processing_time_ms: processingTime,
        processing_time_sec: (processingTime / 1000).toFixed(2),
        design_style: input.design_style,
        has_api_key: !!input.api_key,
      });

      throw error;
    }
  }

  /**
   * Process multiple rooms in batch
   * Supports unlimited batch sizes as per Room Redesigner specification
   */
  async batchRedesign(inputs: RoomRedesignerInput[]): Promise<RoomRedesignerResult[]> {
    logger.debug('🔍 RoomRedesignerService: Starting batch redesign', {
      batch_size: inputs.length,
    });

    const results: RoomRedesignerResult[] = [];

    // Process in parallel with concurrency limit
    const concurrency = 5; // Process 5 at a time
    for (let i = 0; i < inputs.length; i += concurrency) {
      const batch = inputs.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map((input) => this.redesignRoom(input))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Handle failure case
          results.push({
            success: false,
            error: result.reason.message || 'Unknown error',
          });
        }
      }

      logger.debug('📦 RoomRedesignerService: Batch progress', {
        processed: Math.min(i + concurrency, inputs.length),
        total: inputs.length,
      });
    }

    logger.debug('✅ RoomRedesignerService: Batch redesign complete', {
      total: inputs.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });

    return results;
  }
}

export default new RoomRedesignerService();
