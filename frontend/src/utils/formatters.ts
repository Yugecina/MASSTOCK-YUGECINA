/**
 * Date, Time, and Formatting Utilities
 * Centralizes formatting logic used across the application
 */

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format a date with both date and time
 * @param date - Date string or Date object
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string (e.g., "Dec 15, 2025, 10:30 AM")
 */
export function formatDateTime(date: string | Date, locale = 'en-US'): string {
  return new Date(date).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a date without time
 * @param date - Date string or Date object
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string (e.g., "Dec 15, 2025")
 */
export function formatDateShort(date: string | Date, locale = 'en-US'): string {
  return new Date(date).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a date for French locale (fr-FR)
 * @param date - Date string or Date object
 * @returns Formatted date string in French format
 */
export function formatDateTimeFR(date: string | Date): string {
  return formatDateTime(date, 'fr-FR');
}

/**
 * Format a full date with long format (French)
 * @param timestamp - Date string
 * @returns Formatted date string (e.g., "15 janvier 2025 a 14:30")
 */
export function formatFullDateFR(timestamp: string): string {
  return new Date(timestamp).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short'
  });
}

/**
 * Format a date for display in tables and lists
 * Uses relative time for recent dates, absolute for older ones
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDateSmart(date: string | Date): string {
  const dateObj = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Less than 1 hour: show minutes
  if (diffMins < 60) {
    return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
  }

  // Less than 24 hours: show hours
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  // Less than 7 days: show days
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  // Older: show full date
  return formatDateShort(date);
}

// ============================================
// RELATIVE TIME (FRENCH)
// ============================================

/**
 * Get relative time ago string in French
 * @param timestamp - Date string
 * @returns Relative time string (e.g., "Il y a 5 min")
 */
export function getTimeAgoFR(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${diffDays}j`;
}

// ============================================
// CURRENCY FORMATTING
// ============================================

/**
 * Format a number as currency (EUR)
 * @param value - Number to format
 * @param locale - Locale string (default: 'fr-FR')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | undefined, locale = 'fr-FR'): string {
  const num = parseFloat(String(value)) || 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR'
  }).format(num);
}

/**
 * Format a number as USD currency
 * @param value - Number to format
 * @returns Formatted currency string
 */
export function formatCurrencyUSD(value: number | undefined): string {
  const num = parseFloat(String(value)) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num);
}

// ============================================
// PERCENTAGE FORMATTING
// ============================================

/**
 * Format a number as percentage
 * @param value - Number to format (e.g., 95.5)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "95.5%")
 */
export function formatPercent(value: number | undefined, decimals = 1): string {
  const num = parseFloat(String(value)) || 0;
  return `${num.toFixed(decimals)}%`;
}

// ============================================
// FILE NAME GENERATION
// ============================================

/**
 * Generate a standardized file name for downloads
 * @param prefix - File name prefix
 * @param style - Design style (optional)
 * @param season - Season (optional)
 * @param index - File index (optional)
 * @param extension - File extension (default: 'png')
 * @returns Formatted file name
 */
export function generateFileName(
  prefix: string,
  style?: string,
  season?: string,
  index?: number,
  extension = 'png'
): string {
  const parts = [prefix];

  if (style) {
    parts.push(style.toLowerCase().replace(/\s+/g, '-'));
  }

  if (season) {
    parts.push(season.toLowerCase());
  }

  if (index !== undefined) {
    parts.push(String(index + 1).padStart(2, '0'));
  }

  return `${parts.join('-')}.${extension}`;
}

/**
 * Generate a ZIP file name with timestamp
 * @param prefix - File name prefix
 * @param style - Design style (optional)
 * @param season - Season (optional)
 * @returns Formatted ZIP file name
 */
export function generateZipFileName(
  prefix: string,
  style?: string,
  season?: string
): string {
  const parts = [prefix];

  if (style) {
    parts.push(style.toLowerCase().replace(/\s+/g, '-'));
  }

  if (season) {
    parts.push(season.toLowerCase());
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  parts.push(timestamp);

  return `${parts.join('-')}.zip`;
}
