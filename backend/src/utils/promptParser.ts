import { logger } from '../config/logger';

/**
 * Prompt Parser Utility
 *
 * Parses multiline prompt text for batch image generation.
 * Format: Each prompt separated by double line break (\n\n)
 *
 * Example Input:
 * ```
 * a beautiful sunset over mountains
 *
 * a futuristic city at night
 *
 * a portrait of a cat wearing sunglasses
 * ```
 *
 * Example Output:
 * [
 *   "a beautiful sunset over mountains",
 *   "a futuristic city at night",
 *   "a portrait of a cat wearing sunglasses"
 * ]
 */

/**
 * Validation options for prompts
 */
interface ValidationOptions {
  minLength?: number;
  maxLength?: number;
  minPrompts?: number;
  maxPrompts?: number;
}

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  count?: number;
}

/**
 * Cost estimation result
 */
interface CostEstimation {
  totalCost: number;
  costPerImage: number;
  imageCount: number;
  currency: string;
}

/**
 * Parse multiline prompts text into an array of individual prompts
 *
 * @param promptsText - The raw multiline text containing prompts
 * @returns Array of individual prompts
 *
 * @example
 * const prompts = parsePrompts("prompt1\n\nprompt2\n\nprompt3");
 * // Returns: ["prompt1", "prompt2", "prompt3"]
 */
export function parsePrompts(promptsText: string): string[] {
  if (!promptsText || typeof promptsText !== 'string') {
    return [];
  }

  // Normalize line endings: convert \r\n (Windows) and \r (old Mac) to \n (Unix)
  const normalizedText = promptsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split by double line break
  const prompts = normalizedText
    .split(/\n\n+/) // Split by 2 or more newlines
    .map(prompt => prompt.trim()) // Trim whitespace
    .filter(prompt => prompt.length > 0); // Remove empty strings

  logger.debug(`📝 Parsed ${prompts.length} prompts from input`);

  return prompts;
}

/**
 * Validate prompts array
 * Checks if prompts meet minimum requirements
 *
 * @param prompts - Array of prompts to validate
 * @param options - Validation options
 * @returns Validation result { valid: boolean, errors: string[] }
 *
 * @example
 * const validation = validatePrompts(prompts, { maxPrompts: 50 });
 * if (!validation.valid) {
 *   logger.error(validation.errors);
 * }
 */
export function validatePrompts(prompts: string[], options: ValidationOptions = {}): ValidationResult {
  const {
    minLength = 3,
    maxLength = 1000,
    minPrompts = 1,
    maxPrompts = 100
  } = options;

  const errors: string[] = [];

  // Check if prompts is an array
  if (!Array.isArray(prompts)) {
    errors.push('Prompts must be an array');
    return { valid: false, errors };
  }

  // Check number of prompts
  if (prompts.length < minPrompts) {
    errors.push(`Minimum ${minPrompts} prompt(s) required, got ${prompts.length}`);
  }

  if (prompts.length > maxPrompts) {
    errors.push(`Maximum ${maxPrompts} prompts allowed, got ${prompts.length}`);
  }

  // Validate each prompt
  prompts.forEach((prompt, index) => {
    if (typeof prompt !== 'string') {
      errors.push(`Prompt at index ${index} must be a string`);
      return;
    }

    if (prompt.length < minLength) {
      errors.push(`Prompt at index ${index} is too short (minimum ${minLength} characters)`);
    }

    if (prompt.length > maxLength) {
      errors.push(`Prompt at index ${index} is too long (maximum ${maxLength} characters)`);
    }

    // Check for potentially dangerous content (basic XSS prevention)
    if (/<script|javascript:|onerror=/i.test(prompt)) {
      errors.push(`Prompt at index ${index} contains potentially dangerous content`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    count: prompts.length
  };
}

/**
 * Format prompts for display
 * Truncates long prompts and adds ellipsis
 *
 * @param prompts - Array of prompts
 * @param maxDisplayLength - Maximum length per prompt (default: 50)
 * @returns Formatted prompts
 *
 * @example
 * const formatted = formatPromptsForDisplay(prompts, 30);
 * // ["a beautiful sunset over mou...", "a futuristic city at night", ...]
 */
export function formatPromptsForDisplay(prompts: string[], maxDisplayLength: number = 50): string[] {
  return prompts.map(prompt => {
    if (prompt.length <= maxDisplayLength) {
      return prompt;
    }
    return prompt.substring(0, maxDisplayLength - 3) + '...';
  });
}

/**
 * Estimate API cost for prompts
 * Based on Gemini 2.5 Flash Image pricing: $0.039 per image
 *
 * @param promptCount - Number of prompts
 * @param pricePerImage - Cost per image (default: 0.039)
 * @returns Cost estimation
 *
 * @example
 * const cost = estimateCost(100);
 * // Returns: { totalCost: 3.90, costPerImage: 0.039, imageCount: 100 }
 */
export function estimateCost(promptCount: number, pricePerImage: number = 0.039): CostEstimation {
  return {
    totalCost: parseFloat((promptCount * pricePerImage).toFixed(2)),
    costPerImage: pricePerImage,
    imageCount: promptCount,
    currency: 'USD'
  };
}

/**
 * Split large batch into smaller chunks
 * Useful for processing large batches in smaller groups
 *
 * @param prompts - Array of prompts
 * @param chunkSize - Size of each chunk (default: 10)
 * @returns Array of prompt chunks
 *
 * @example
 * const chunks = chunkPrompts(prompts, 10);
 * // Process each chunk separately
 * for (const chunk of chunks) {
 *   await processChunk(chunk);
 * }
 */
export function chunkPrompts(prompts: string[], chunkSize: number = 10): string[][] {
  const chunks: string[][] = [];

  for (let i = 0; i < prompts.length; i += chunkSize) {
    chunks.push(prompts.slice(i, i + chunkSize));
  }

  return chunks;
}

export { ValidationOptions, ValidationResult, CostEstimation };
