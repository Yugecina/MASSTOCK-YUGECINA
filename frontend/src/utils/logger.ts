/**
 * Production-Safe Logger
 *
 * This logger only outputs to console in development mode.
 * In production, logs are silenced to prevent information disclosure.
 *
 * Usage:
 *   import logger from '@/utils/logger';
 *   logger.debug('🔍 Component: Loading data...');
 *   logger.info('✅ Component: Data loaded successfully');
 *   logger.warn('⚠️ Component: Warning message');
 *   logger.error('❌ Component: Error occurred', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

interface LogLevelMap {
  [key: string]: number;
}

interface LoggerInterface {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  group: (label: string, ...args: any[]) => void;
  groupEnd: () => void;
  table: (data: any) => void;
  isEnabled: () => boolean;
}

const isDevelopment: boolean =
  import.meta.env.VITE_ENV === 'development' || import.meta.env.DEV;
const isProduction: boolean =
  import.meta.env.VITE_ENV === 'production' || import.meta.env.PROD;

// Log level hierarchy: debug < info < warn < error < none
const LOG_LEVELS: LogLevelMap = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4
};

/**
 * Get log level from environment (default: 'none' in production, 'debug' in development)
 */
const getLogLevel = (): number => {
  const envLevel: string | undefined = import.meta.env.VITE_LOG_LEVEL;
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return LOG_LEVELS[envLevel];
  }
  return isProduction ? LOG_LEVELS.none : LOG_LEVELS.debug;
};

const currentLogLevel: number = getLogLevel();

/**
 * Check if a log level should be output
 */
const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= currentLogLevel;
};

/**
 * Format log arguments
 */
const formatArgs = (...args: any[]): any[] => {
  // If first arg is object, return as-is for better console formatting
  if (args.length === 1 && typeof args[0] === 'object') {
    return args;
  }
  return args;
};

/**
 * Logger object with production safety
 */
const logger: LoggerInterface = {
  /**
   * Debug level - detailed information for debugging
   * Only shown in development when LOG_LEVEL is 'debug'
   */
  debug: (...args: any[]): void => {
    if (shouldLog('debug')) {
      console.log(...formatArgs(...args));
    }
  },

  /**
   * Info level - general informational messages
   * Shown in development and when LOG_LEVEL is 'info' or lower
   */
  info: (...args: any[]): void => {
    if (shouldLog('info')) {
      console.log(...formatArgs(...args));
    }
  },

  /**
   * Warn level - warning messages
   * Shown when LOG_LEVEL is 'warn' or lower
   */
  warn: (...args: any[]): void => {
    if (shouldLog('warn')) {
      console.warn(...formatArgs(...args));
    }
  },

  /**
   * Error level - error messages
   * Shown when LOG_LEVEL is 'error' or lower
   * In production, errors can optionally be sent to backend for monitoring
   */
  error: (...args: any[]): void => {
    if (shouldLog('error')) {
      console.error(...formatArgs(...args));
    }

    // Optional: Send errors to backend in production
    // This is disabled by default for security
    if (isProduction && import.meta.env.VITE_ERROR_REPORTING === 'true') {
      // TODO: Implement error reporting to backend
      // Example: sendErrorToBackend(args);
    }
  },

  /**
   * Group logs together (collapsed by default)
   */
  group: (label: string, ...args: any[]): void => {
    if (shouldLog('debug')) {
      console.group(label);
      if (args.length > 0) {
        console.log(...formatArgs(...args));
      }
    }
  },

  /**
   * End a log group
   */
  groupEnd: (): void => {
    if (shouldLog('debug')) {
      console.groupEnd();
    }
  },

  /**
   * Table format for arrays/objects
   */
  table: (data: any): void => {
    if (shouldLog('debug')) {
      console.table(data);
    }
  },

  /**
   * Utility to check if logging is enabled
   */
  isEnabled: (): boolean => {
    return isDevelopment || currentLogLevel < LOG_LEVELS.none;
  }
};

// Log environment info on first load (only in development)
if (isDevelopment) {
  console.log('%c🔧 Logger initialized', 'color: #00a8ff; font-weight: bold;', {
    environment: import.meta.env.VITE_ENV || 'development',
    logLevel: Object.keys(LOG_LEVELS).find(
      (key) => LOG_LEVELS[key] === currentLogLevel
    ),
    isDevelopment,
    isProduction
  });
}

export default logger;
export type { LogLevel, LoggerInterface };
