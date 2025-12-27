/**
 * Smart Resizer - Format Presets
 *
 * Defines 20+ advertising format specifications for Meta, Google, DOOH, and Programmatic.
 * Each format includes dimensions, ratio, platform, and safe zone specifications.
 */

export interface SafeZone {
  top?: number;    // Percentage (0-1) from top
  bottom?: number; // Percentage (0-1) from bottom
  left?: number;   // Percentage (0-1) from left
  right?: number;  // Percentage (0-1) from right
  all?: number;    // Uniform percentage for all sides
}

export interface FormatPreset {
  width: number;
  height: number;
  ratio: string;
  platform: 'meta' | 'google' | 'dooh' | 'programmatic' | 'standard';
  safeZone: SafeZone;
  description: string;
  usage: string;
}

export type FormatPresetKey = keyof typeof FORMAT_PRESETS;

/**
 * Simple photo aspect ratios
 * Based on standard photography formats
 */
export const FORMAT_PRESETS = {
  // Square
  square: {
    width: 1080,
    height: 1080,
    ratio: '1:1',
    platform: 'standard',
    safeZone: { all: 0 },
    description: '1:1 Square',
    usage: 'Instagram, Facebook posts',
  },

  // Portrait formats
  portrait_2_3: {
    width: 1080,
    height: 1620,
    ratio: '2:3',
    platform: 'standard',
    safeZone: { all: 0 },
    description: '2:3 Portrait',
    usage: 'Classic portrait photography',
  },

  portrait_3_4: {
    width: 1080,
    height: 1440,
    ratio: '3:4',
    platform: 'standard',
    safeZone: { all: 0 },
    description: '3:4 Traditional',
    usage: 'Traditional portrait format',
  },

  social_story: {
    width: 1080,
    height: 1920,
    ratio: '9:16',
    platform: 'standard',
    safeZone: { all: 0 },
    description: '9:16 Social Story',
    usage: 'Instagram Stories, TikTok, Reels',
  },

  social_post: {
    width: 1080,
    height: 1350,
    ratio: '4:5',
    platform: 'standard',
    safeZone: { all: 0 },
    description: '4:5 Social Post',
    usage: 'Instagram/Facebook optimal',
  },

  // Landscape formats
  standard_3_2: {
    width: 1620,
    height: 1080,
    ratio: '3:2',
    platform: 'standard',
    safeZone: { all: 0 },
    description: '3:2 Standard',
    usage: 'Standard photography (35mm)',
  },

  classic_4_3: {
    width: 1440,
    height: 1080,
    ratio: '4:3',
    platform: 'standard',
    safeZone: { all: 0 },
    description: '4:3 Classic',
    usage: 'Classic TV/monitor format',
  },

  widescreen: {
    width: 1920,
    height: 1080,
    ratio: '16:9',
    platform: 'standard',
    safeZone: { all: 0 },
    description: '16:9 Widescreen',
    usage: 'YouTube, modern displays',
  },

  medium_5_4: {
    width: 1350,
    height: 1080,
    ratio: '5:4',
    platform: 'standard',
    safeZone: { all: 0 },
    description: '5:4 Medium',
    usage: 'Large format photography',
  },

  ultrawide: {
    width: 2520,
    height: 1080,
    ratio: '21:9',
    platform: 'standard',
    safeZone: { all: 0 },
    description: '21:9 Widescreen',
    usage: 'Cinematic ultra-wide',
  },
} as const;

/**
 * Get format preset by key
 */
export function getFormatPreset(key: FormatPresetKey): FormatPreset {
  return FORMAT_PRESETS[key];
}

/**
 * Get all format keys
 */
export function getAllFormatKeys(): FormatPresetKey[] {
  return Object.keys(FORMAT_PRESETS) as FormatPresetKey[];
}

/**
 * Get formats by platform
 */
export function getFormatsByPlatform(platform: 'meta' | 'google' | 'dooh' | 'programmatic' | 'standard'): FormatPresetKey[] {
  return getAllFormatKeys().filter(key => FORMAT_PRESETS[key].platform === platform);
}

/**
 * Calculate safe zone pixels from percentage
 */
export function calculateSafeZonePixels(
  width: number,
  height: number,
  safeZone: SafeZone
): { top: number; bottom: number; left: number; right: number } {
  if (safeZone.all !== undefined) {
    return {
      top: Math.round(height * safeZone.all),
      bottom: Math.round(height * safeZone.all),
      left: Math.round(width * safeZone.all),
      right: Math.round(width * safeZone.all),
    };
  }

  return {
    top: Math.round(height * (safeZone.top || 0)),
    bottom: Math.round(height * (safeZone.bottom || 0)),
    left: Math.round(width * (safeZone.left || 0)),
    right: Math.round(width * (safeZone.right || 0)),
  };
}

/**
 * Get format pack presets (quick selections)
 */
export const FORMAT_PACKS = {
  social: ['square', 'social_post', 'social_story'] as FormatPresetKey[],
  portrait: ['portrait_2_3', 'portrait_3_4', 'social_story'] as FormatPresetKey[],
  landscape: ['standard_3_2', 'classic_4_3', 'widescreen'] as FormatPresetKey[],
  all: getAllFormatKeys(),
} as const;

/**
 * Export total count for validation
 */
export const TOTAL_FORMATS = getAllFormatKeys().length;
