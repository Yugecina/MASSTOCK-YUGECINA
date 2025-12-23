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
  platform: 'meta' | 'google' | 'dooh' | 'programmatic';
  safeZone: SafeZone;
  description: string;
  usage: string;
}

export type FormatPresetKey = keyof typeof FORMAT_PRESETS;

/**
 * Complete format presets catalog
 * Based on official advertising specs (2025)
 */
export const FORMAT_PRESETS = {
  // ========================================
  // META (Facebook/Instagram)
  // ========================================
  meta_feed_square: {
    width: 1080,
    height: 1080,
    ratio: '1:1',
    platform: 'meta',
    safeZone: { all: 0 },
    description: 'Meta Feed Square',
    usage: 'Facebook & Instagram Feed posts',
  },

  meta_feed_vertical: {
    width: 1080,
    height: 1350,
    ratio: '4:5',
    platform: 'meta',
    safeZone: { all: 0 },
    description: 'Meta Feed Vertical',
    usage: 'Facebook & Instagram Feed (recommended)',
  },

  meta_stories: {
    width: 1080,
    height: 1920,
    ratio: '9:16',
    platform: 'meta',
    safeZone: { top: 0.14, bottom: 0.35, left: 0.06, right: 0.06 },
    description: 'Meta Stories',
    usage: 'Instagram Stories ads',
  },

  meta_reels: {
    width: 1080,
    height: 1920,
    ratio: '9:16',
    platform: 'meta',
    safeZone: { top: 0.14, bottom: 0.35, left: 0.06, right: 0.06 },
    description: 'Meta Reels',
    usage: 'Instagram & Facebook Reels',
  },

  meta_carousel: {
    width: 1080,
    height: 1080,
    ratio: '1:1',
    platform: 'meta',
    safeZone: { all: 0 },
    description: 'Meta Carousel',
    usage: 'Carousel ads (multi-image)',
  },

  // ========================================
  // GOOGLE DISPLAY NETWORK
  // ========================================
  google_medium_rectangle: {
    width: 300,
    height: 250,
    ratio: '6:5',
    platform: 'google',
    safeZone: { all: 0.05 },
    description: 'Medium Rectangle',
    usage: 'Google Display - Top performer',
  },

  google_leaderboard: {
    width: 728,
    height: 90,
    ratio: '8:1',
    platform: 'google',
    safeZone: { all: 0.05 },
    description: 'Leaderboard',
    usage: 'Google Display - Desktop banner',
  },

  google_half_page: {
    width: 300,
    height: 600,
    ratio: '1:2',
    platform: 'google',
    safeZone: { all: 0.05 },
    description: 'Half Page',
    usage: 'Google Display - High impact',
  },

  google_large_rectangle: {
    width: 336,
    height: 280,
    ratio: '6:5',
    platform: 'google',
    safeZone: { all: 0.05 },
    description: 'Large Rectangle',
    usage: 'Google Display - Popular format',
  },

  google_mobile_leaderboard: {
    width: 320,
    height: 50,
    ratio: '32:5',
    platform: 'google',
    safeZone: { all: 0.05 },
    description: 'Mobile Leaderboard',
    usage: 'Google Display - Mobile banner',
  },

  google_large_mobile: {
    width: 320,
    height: 100,
    ratio: '16:5',
    platform: 'google',
    safeZone: { all: 0.05 },
    description: 'Large Mobile Banner',
    usage: 'Google Display - Mobile',
  },

  google_billboard: {
    width: 970,
    height: 250,
    ratio: '4:1',
    platform: 'google',
    safeZone: { all: 0.05 },
    description: 'Billboard',
    usage: 'Google Display - Premium desktop',
  },

  google_skyscraper: {
    width: 160,
    height: 600,
    ratio: '4:15',
    platform: 'google',
    safeZone: { all: 0.05 },
    description: 'Wide Skyscraper',
    usage: 'Google Display - Sidebar',
  },

  google_responsive_landscape: {
    width: 1200,
    height: 628,
    ratio: '1.91:1',
    platform: 'google',
    safeZone: { all: 0.05 },
    description: 'Responsive Display Landscape',
    usage: 'Google Responsive Display Ads',
  },

  google_responsive_square: {
    width: 1200,
    height: 1200,
    ratio: '1:1',
    platform: 'google',
    safeZone: { all: 0.05 },
    description: 'Responsive Display Square',
    usage: 'Google Responsive Display Ads',
  },

  google_responsive_vertical: {
    width: 1200,
    height: 1500,
    ratio: '4:5',
    platform: 'google',
    safeZone: { all: 0.05 },
    description: 'Responsive Display Vertical',
    usage: 'Google Responsive Display Ads',
  },

  // ========================================
  // DOOH (Digital Out-of-Home)
  // ========================================
  dooh_landscape_hd: {
    width: 1920,
    height: 1080,
    ratio: '16:9',
    platform: 'dooh',
    safeZone: { all: 0.15 },
    description: 'Landscape HD',
    usage: 'Digital billboards, outdoor screens',
  },

  dooh_landscape_4k: {
    width: 3840,
    height: 2160,
    ratio: '16:9',
    platform: 'dooh',
    safeZone: { all: 0.15 },
    description: 'Landscape 4K',
    usage: 'Premium digital billboards',
  },

  dooh_portrait_hd: {
    width: 1080,
    height: 1920,
    ratio: '9:16',
    platform: 'dooh',
    safeZone: { all: 0.15 },
    description: 'Portrait HD',
    usage: 'Digital totems, mall screens',
  },

  dooh_portrait_4k: {
    width: 2160,
    height: 3840,
    ratio: '9:16',
    platform: 'dooh',
    safeZone: { all: 0.15 },
    description: 'Portrait 4K',
    usage: 'Premium digital totems',
  },

  // ========================================
  // PROGRAMMATIC / NATIVE
  // ========================================
  programmatic_interstitial: {
    width: 320,
    height: 480,
    ratio: '2:3',
    platform: 'programmatic',
    safeZone: { all: 0.10 },
    description: 'Mobile Interstitial',
    usage: 'In-app full-screen ads',
  },

  programmatic_native: {
    width: 1200,
    height: 627,
    ratio: '1.91:1',
    platform: 'programmatic',
    safeZone: { all: 0.05 },
    description: 'Native Ad',
    usage: 'Programmatic native advertising',
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
export function getFormatsByPlatform(platform: 'meta' | 'google' | 'dooh' | 'programmatic'): FormatPresetKey[] {
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
  meta: ['meta_feed_square', 'meta_feed_vertical', 'meta_stories', 'meta_reels'] as FormatPresetKey[],
  google: ['google_medium_rectangle', 'google_leaderboard', 'google_half_page', 'google_responsive_landscape'] as FormatPresetKey[],
  dooh: ['dooh_landscape_hd', 'dooh_portrait_hd'] as FormatPresetKey[],
  full: getAllFormatKeys(),
} as const;

/**
 * Export total count for validation
 */
export const TOTAL_FORMATS = getAllFormatKeys().length;
