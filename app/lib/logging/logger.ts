/**
 * Centralized logging utility.
 * - Development: Full logging
 * - Production: Errors only
 */

const isDev = process.env.NODE_ENV === 'development';

/** Available log levels */
export type LogLevel = 'debug' | 'log' | 'warn' | 'error';

interface LogOptions {
  context?: string;
  data?: unknown;
}

function formatMessage(message: string, context?: string): string {
  return context ? `[${context}] ${message}` : message;
}

/**
 * Debug level - development only
 */
export function logDebug(message: string, options?: LogOptions): void {
  if (isDev) {
    console.debug(formatMessage(message, options?.context), options?.data ?? '');
  }
}

/**
 * Info level - development only
 */
export function log(message: string, options?: LogOptions): void {
  if (isDev) {
    console.log(formatMessage(message, options?.context), options?.data ?? '');
  }
}

/**
 * Warning level - development only
 */
export function logWarn(message: string, options?: LogOptions): void {
  if (isDev) {
    console.warn(formatMessage(message, options?.context), options?.data ?? '');
  }
}

/**
 * Error level - always logged (production and development)
 */
export function logError(message: string, options?: LogOptions): void {
  console.error(formatMessage(message, options?.context), options?.data ?? '');
}

/**
 * Create a logger scoped to a context
 */
export function createLogger(context: string) {
  return {
    debug: (msg: string, data?: unknown) => logDebug(msg, { context, data }),
    log: (msg: string, data?: unknown) => log(msg, { context, data }),
    warn: (msg: string, data?: unknown) => logWarn(msg, { context, data }),
    error: (msg: string, data?: unknown) => logError(msg, { context, data }),
  };
}
