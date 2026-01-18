/**
 * Room Redesigner Service
 *
 * Integrates with Nano Banana Pro API to redesign room photographs
 * with AI-powered interior design transformations.
 */

import vertexAIService from './vertexAIImageService';
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
  | 'midcentury'
  | 'traditional';

export type BudgetLevel = 'low' | 'medium' | 'high' | 'luxury';

export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter' | 'noel';

export interface RoomRedesignerInput {
  image_base64: string;
  image_mime: string;
  design_style: DesignStyle;
  season?: SeasonType;
  budget_level?: BudgetLevel;
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
  season?: SeasonType;
  budget_level?: BudgetLevel;
}

class RoomRedesignerService {
  private model: string;

  constructor() {
    // Nano Banana Pro = Gemini 3 Pro Image Preview (advanced AI image generation)
    this.model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview';
  }

  /**
   * Build a detailed prompt for room redesign based on user preferences
   * Optimized for real estate virtual staging with strict architectural preservation
   * v5: Google best practices - camera/doors priority, budget details, checklist validation
   */
  buildPrompt(options: PromptOptions): string {
    const { design_style, season, budget_level } = options;

    // Budget-specific furniture descriptions with concrete examples
    const budgetFurniture: Record<BudgetLevel, string> = {
      low: 'IKEA-style functional furniture, simple clean designs, affordable materials (laminate, basic fabrics)',
      medium: 'West Elm / Crate & Barrel quality, solid wood, quality upholstery, timeless mid-range pieces',
      high: 'Restoration Hardware level, premium materials (genuine leather, marble, brass), designer-inspired pieces',
      luxury: 'Bespoke designer furniture, iconic pieces (Eames, B&B Italia, Roche Bobois), exotic materials (walnut burl, mohair, travertine), museum-quality art'
    };

    // Style descriptions (concise, action-oriented)
    const styleDescriptions: Record<DesignStyle, string> = {
      modern: 'clean geometric lines, neutral palette (white, gray, black), chrome/steel accents, minimal ornamentation',
      minimalist: 'essential pieces only, maximum negative space, monochrome palette, zero clutter',
      industrial: 'metal frames, leather, dark wood, exposed raw material aesthetic',
      scandinavian: 'light wood (oak, birch), soft neutral fabrics, cozy textiles, hygge accessories',
      contemporary: 'current trends, mixed materials, bold statement pieces, sophisticated palettes',
      coastal: 'light airy furniture, natural textures (rattan, wicker), blue and white palette, beach-inspired decor',
      farmhouse: 'rustic wood furniture, vintage pieces, warm neutral tones, countryside charm',
      midcentury: 'iconic 1950s-60s shapes, organic curves, warm wood, atomic-era design',
      traditional: 'classic elegant furniture, rich woods (mahogany, walnut), symmetry, luxurious fabrics (velvet, silk), decorative moldings'
    };

    // Season descriptions (optional, subtle)
    const seasonDescriptions: Record<SeasonType, string> = {
      spring: 'fresh flowers in vases, pastel accent colors, light airy textiles',
      summer: 'bright natural light, tropical plants, citrus-inspired colors, lightweight fabrics',
      autumn: 'warm earth tones, cozy throws and blankets, dried flower arrangements, amber/rust accents',
      winter: 'layered cozy textiles, warm lighting, evergreen elements, elegant cool palette',
      noel: 'elegant holiday decor - decorated tree (if space allows), seasonal wreaths, refined festive touches, warm lighting'
    };

    const budgetDesc = budget_level ? budgetFurniture[budget_level] : budgetFurniture.medium;
    const styleDesc = styleDescriptions[design_style];

    // BUILD PROMPT: Start with Google's recommended pattern "A photo of..."
    let prompt = `A photo of this exact same room, virtually staged with ${design_style.toUpperCase()} style furniture.

=== CRITICAL: CAMERA & PERSPECTIVE (DO NOT MODIFY) ===
- SAME exact camera position, angle, and field of view as input image
- SAME perspective, focal length, and depth of field
- SAME viewpoint - do not rotate, pan, tilt, or zoom
- Output must look like a photo taken from the IDENTICAL tripod position

=== CRITICAL: ARCHITECTURAL ELEMENTS (PIXEL-PERFECT PRESERVATION) ===

DOORS (count and lock each one):
- Preserve EVERY door: interior doors, closet doors, bathroom doors, entry doors, balcony doors
- SAME position, size, color, handle style, and frame
- Do NOT add, remove, move, or modify ANY door

WINDOWS (count and lock each one):
- Preserve EVERY window: exact panel count, frame color, size, position
- SAME muntins, mullions, and glazing configuration
- Do NOT add, remove, or modify ANY window

WALLS:
- SAME position, angles, color, texture, moldings, baseboards
- Preserve ALL architectural details (niches, alcoves, arches, columns)

FLOOR:
- SAME material (hardwood/tile/carpet), color, pattern, grain direction
- Do NOT replace or modify the flooring

CEILING:
- SAME height, type, beams, coffers, crown molding
- Preserve ALL ceiling details exactly

FIXED ELEMENTS (locked in place):
- Built-in furniture: closets, kitchen cabinets, shelving units
- Fixed lighting: recessed lights, ceiling fixtures, chandelier POSITIONS
- HVAC: vents, radiators, thermostats
- Electrical: outlets, switches, panels

=== STAGING TASK ===

FURNITURE BUDGET: ${budgetDesc}

STYLE TO APPLY: ${styleDesc}

ACTION:
- If room is EMPTY: Add ${design_style} furniture appropriate for the room type
- If room is FURNISHED: Replace ALL existing furniture with ${design_style} style pieces

ALLOWED TO ADD (freestanding only):
- Sofas, armchairs, accent chairs
- Coffee tables, side tables, consoles
- Beds, nightstands, dressers
- Dining tables and chairs
- Freestanding bookshelves, display cabinets
- Area rugs (placed ON existing floor)
- Floor lamps, table lamps
- Curtains/drapes (framing windows, never blocking)
- Decorative items: plants, artwork, vases, cushions, throws`;

    // Add seasonal touches if specified
    if (season) {
      prompt += `

SEASONAL STYLING: ${seasonDescriptions[season]}
Keep seasonal elements subtle and elegant - this is real estate staging, not a holiday catalog.`;
    }

    // Final reinforcement (sandwich technique - repeat critical constraints)
    prompt += `

=== OUTPUT REQUIREMENTS ===

PHOTOREALISM:
- Indistinguishable from a real photograph
- Correct proportions, perspective, shadows matching original lighting
- No floating objects, no clipping, no artifacts

VERIFICATION CHECKLIST (before output):
[ ] Camera angle: IDENTICAL to input
[ ] Door count: SAME as input (verify each door)
[ ] Window count: SAME as input (verify each window)
[ ] Floor material: UNCHANGED
[ ] Wall colors: UNCHANGED
[ ] Ceiling: UNCHANGED
[ ] Furniture style: ${design_style.toUpperCase()}
[ ] Furniture quality: ${budget_level ? budget_level.toUpperCase() : 'MEDIUM'} budget level

ABSOLUTE RULE: The output must be THIS SAME ROOM with different furniture - NOT a reimagined or recreated room. A viewer comparing before/after must instantly recognize it as the same space.`;

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
        season: input.season,
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

      // Build the redesign prompt
      const prompt = this.buildPrompt({
        design_style: input.design_style,
        season: input.season,
        budget_level: input.budget_level,
      });

      logger.info('📝 RoomRedesignerService.redesignRoom: Prompt generated', {
        prompt_length: prompt.length,
      });

      // Set model for this request
      vertexAIService.setModel(this.model);

      // Call Vertex AI service
      // NOTE: aspectRatio is NOT specified for Room Redesigner to preserve original image dimensions
      logger.info('🚀 RoomRedesignerService.redesignRoom: Calling Vertex AI service', {
        model: this.model,
        has_input_image: !!input.image_base64,
        prompt_length: prompt.length,
      });

      const result = await vertexAIService.generateImage(prompt, {
        referenceImages: [{
          data: input.image_base64,
          mimeType: input.image_mime || 'image/jpeg'
        }],
        // No aspectRatio specified → model preserves reference image dimensions
        timeout: 300000 // 5 minutes timeout (increased for complex images)
      });

      const processingTime = Date.now() - startTime;

      if (!result.success || !result.imageData) {
        logger.error('❌ RoomRedesignerService.redesignRoom: Image generation failed', {
          processing_time_ms: processingTime,
          error: result.error
        });
        throw new Error(result.error?.message || 'Image generation failed');
      }

      logger.info('✅ RoomRedesignerService.redesignRoom: Redesign successful', {
        processing_time_ms: processingTime,
        processing_time_sec: (processingTime / 1000).toFixed(2),
        has_result: true,
        result_size_kb: Math.round(Buffer.from(result.imageData, 'base64').length / 1024),
      });

      return {
        success: true,
        image_base64: result.imageData,
        processing_time: processingTime,
        prompt_used: prompt,
      };
    } catch (error) {
      const err = error as Error;
      const processingTime = Date.now() - startTime;

      logger.error('❌ RoomRedesignerService.redesignRoom: Redesign failed', {
        error_message: err.message,
        processing_time_ms: processingTime,
        processing_time_sec: (processingTime / 1000).toFixed(2),
        design_style: input.design_style,
      });

      return {
        success: false,
        error: err.message || 'Unknown error',
        processing_time: processingTime,
      };
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
