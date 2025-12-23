/**
 * OCR Service - Gemini Vision Integration
 *
 * Uses Gemini Vision API to analyze images and extract:
 * - Text content with positions and styles
 * - Visual elements (logos, charts, borders)
 * - Color palette
 * - Brand style analysis
 *
 * This data is used to preserve text accurately when resizing to different formats.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TextElement {
  type: 'headline' | 'stat' | 'label' | 'body' | 'cta' | 'other';
  text: string;
  position?: string; // 'top-left', 'center', 'bottom-right', etc.
  style?: string; // 'bold-black-large', 'orange-bold', etc.
}

export interface VisualElement {
  type: 'logo' | 'chart' | 'border' | 'icon' | 'image' | 'other';
  description: string;
  position?: string;
}

export interface DetectedContent {
  texts: TextElement[];
  visual_elements: VisualElement[];
  color_palette: string[];
  brand_style: string;
}

class OCRService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini Pro Vision for image analysis
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Analyze image to extract all content
   */
  async analyzeImage(imageBase64: string): Promise<DetectedContent> {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 OCR: Starting image analysis', {
        imageSize: `${(imageBase64.length / 1024).toFixed(2)}KB`,
      });
    }

    const startTime = Date.now();

    try {
      const prompt = `Analyze this advertisement image and extract ALL text and visual elements in JSON format.

CRITICAL: You MUST extract EVERY piece of text visible in the image, no matter how small.

Return ONLY valid JSON (no markdown, no explanation) with this structure:
{
  "texts": [
    {
      "type": "headline|stat|label|body|cta|other",
      "text": "exact text from image",
      "position": "top-left|top-center|top-right|center-left|center|center-right|bottom-left|bottom-center|bottom-right",
      "style": "description of font style (bold, size, color)"
    }
  ],
  "visual_elements": [
    {
      "type": "logo|chart|border|icon|image|other",
      "description": "detailed description",
      "position": "where it appears"
    }
  ],
  "color_palette": ["#HEX1", "#HEX2", "#HEX3"],
  "brand_style": "brief description of overall visual style"
}

Text types:
- headline: Main title/headline
- stat: Numbers, statistics, metrics
- label: Small labels, captions
- body: Paragraph text, descriptions
- cta: Call-to-action text, URLs
- other: Any other text

Extract EVERY word, number, and symbol visible. Be thorough!`;

      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/png',
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Clean response (remove markdown code blocks if present)
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }

      const detectedContent: DetectedContent = JSON.parse(cleanedText);

      const processingTime = Date.now() - startTime;

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ OCR: Analysis complete', {
          textCount: detectedContent.texts.length,
          visualElementCount: detectedContent.visual_elements.length,
          colorCount: detectedContent.color_palette.length,
          processingTime: `${processingTime}ms`,
        });
        console.log('📝 OCR: Detected texts', {
          texts: detectedContent.texts.map(t => t.text).join(', '),
        });
      }

      return detectedContent;
    } catch (error: any) {
      console.error('❌ OCR.analyzeImage: Failed', {
        error: error.message,
        stack: error.stack,
      });

      // Return minimal structure on error
      return {
        texts: [],
        visual_elements: [],
        color_palette: [],
        brand_style: 'unknown',
      };
    }
  }

  /**
   * Build structured prompt for format generation
   * Uses detected content to create a comprehensive prompt for Gemini
   */
  buildGenerationPrompt(
    detectedContent: DetectedContent,
    formatName: string,
    width: number,
    height: number,
    safeZone: { top: number; bottom: number; left: number; right: number }
  ): string {
    const ratio = `${width}x${height}`;

    // Build text section
    const textSection = detectedContent.texts.length > 0
      ? `MANDATORY TEXT TO INCLUDE (copy EXACTLY, maintain hierarchy and style):
${detectedContent.texts
  .map((t, i) => `${i + 1}. ${t.type.toUpperCase()}: "${t.text}"${t.style ? ` (Style: ${t.style})` : ''}`)
  .join('\n')}

CRITICAL: Every single word must be included and spelled exactly as shown above.`
      : 'No text to include.';

    // Build visual elements section
    const visualSection = detectedContent.visual_elements.length > 0
      ? `VISUAL ELEMENTS TO PRESERVE:
${detectedContent.visual_elements
  .map((v, i) => `${i + 1}. ${v.type.toUpperCase()}: ${v.description}${v.position ? ` (Position: ${v.position})` : ''}`)
  .join('\n')}`
      : 'No specific visual elements.';

    // Build color section
    const colorSection = detectedContent.color_palette.length > 0
      ? `COLOR PALETTE: ${detectedContent.color_palette.join(', ')}`
      : 'Use original colors.';

    // Build safe zone section
    const safeZoneSection = `SAFE ZONE MARGINS:
- Top: ${safeZone.top}px
- Bottom: ${safeZone.bottom}px
- Left: ${safeZone.left}px
- Right: ${safeZone.right}px
Keep ALL text and important elements within these margins.`;

    // Complete prompt
    const prompt = `Recreate this advertisement in ${ratio} format (${width}×${height} pixels) for ${formatName}.

${textSection}

${visualSection}

${colorSection}

BRAND STYLE: ${detectedContent.brand_style}

${safeZoneSection}

REQUIREMENTS:
1. Maintain the same visual hierarchy and layout principles
2. All text must be clearly readable
3. Preserve brand colors and style
4. Adapt composition to ${width}×${height} format while keeping the same message and impact
5. DO NOT add any text that wasn't in the original
6. DO NOT change or "improve" any text - use exact wording

Generate a professional advertising creative in ${width}×${height} format.`;

    if (process.env.NODE_ENV === 'development') {
      console.log('🎨 OCR: Generation prompt built', {
        formatName,
        ratio,
        promptLength: prompt.length,
        textCount: detectedContent.texts.length,
      });
    }

    return prompt;
  }

  /**
   * Validate generated image has all required text
   * Re-analyze the generated image to check if text was preserved
   */
  async validateGeneration(
    generatedImageBase64: string,
    originalContent: DetectedContent
  ): Promise<{
    valid: boolean;
    missingTexts: string[];
    score: number; // 0-100
  }> {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 OCR: Validating generated image', {
        originalTextCount: originalContent.texts.length,
      });
    }

    try {
      // Analyze generated image
      const generatedContent = await this.analyzeImage(generatedImageBase64);

      // Check which texts are missing
      const originalTexts = originalContent.texts.map(t => t.text.toLowerCase().trim());
      const generatedTexts = generatedContent.texts.map(t => t.text.toLowerCase().trim());

      const missingTexts: string[] = [];
      for (const originalText of originalContent.texts) {
        const found = generatedTexts.some(gt =>
          gt.includes(originalText.text.toLowerCase().trim()) ||
          originalText.text.toLowerCase().trim().includes(gt)
        );

        if (!found) {
          missingTexts.push(originalText.text);
        }
      }

      const score = originalContent.texts.length > 0
        ? Math.round(((originalContent.texts.length - missingTexts.length) / originalContent.texts.length) * 100)
        : 100;

      const valid = score >= 80; // 80% threshold

      if (process.env.NODE_ENV === 'development') {
        console.log(valid ? '✅' : '❌', 'OCR: Validation complete', {
          score: `${score}%`,
          missingCount: missingTexts.length,
          missingTexts: missingTexts.length > 0 ? missingTexts : 'none',
        });
      }

      return { valid, missingTexts, score };
    } catch (error: any) {
      console.error('❌ OCR.validateGeneration: Failed', {
        error: error.message,
      });

      return {
        valid: false,
        missingTexts: originalContent.texts.map(t => t.text),
        score: 0,
      };
    }
  }
}

export default new OCRService();
