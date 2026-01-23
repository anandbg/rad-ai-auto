import { parseOpenAIError } from "./errors";
import { createLogger } from "@/lib/logging/logger";

const logger = createLogger("OpenAI");

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Add random jitter to prevent thundering herd (default: true) */
  jitter?: boolean;
  /** Operation name for logging */
  operationName?: string;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "operationName">> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  jitter: true,
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  jitter: boolean,
  retryAfterHint?: number
): number {
  // Use retry-after hint if provided (from API response)
  if (retryAfterHint && retryAfterHint > 0) {
    return retryAfterHint * 1000; // Convert seconds to ms
  }

  // Exponential backoff: initialDelay * 2^attempt
  let delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);

  // Add jitter: randomize between 50% and 100% of calculated delay
  // This prevents thundering herd when multiple clients retry simultaneously
  if (jitter) {
    delay = Math.floor(delay * (0.5 + Math.random() * 0.5));
  }

  return delay;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrap an async operation with retry logic
 *
 * @param operation - Async function to execute
 * @param options - Retry configuration
 * @returns Result of the operation
 * @throws Last error if all retries exhausted
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => streamText({ model: openai("gpt-4o"), prompt }),
 *   { maxRetries: 3, operationName: "generate-report" }
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    initialDelayMs = DEFAULT_OPTIONS.initialDelayMs,
    maxDelayMs = DEFAULT_OPTIONS.maxDelayMs,
    jitter = DEFAULT_OPTIONS.jitter,
    operationName = "openai-operation",
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorInfo = parseOpenAIError(error);

      // Don't retry non-retryable errors
      if (!errorInfo.isRetryable) {
        logger.error(`${operationName}: Non-retryable error: ${errorInfo.message}`);
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) {
        logger.error(`${operationName}: Max retries (${maxRetries}) exhausted. Last error: ${errorInfo.message}`);
        throw error;
      }

      // Calculate delay for next retry
      const delay = calculateDelay(
        attempt,
        initialDelayMs,
        maxDelayMs,
        jitter,
        errorInfo.retryAfter
      );

      logger.warn(
        `${operationName}: Attempt ${attempt + 1}/${maxRetries + 1} failed (${errorInfo.type}). ` +
        `Retrying in ${Math.round(delay / 1000)}s...`
      );

      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error("Unknown error in retry loop");
}

/**
 * Wrap a streaming operation with retry logic
 * Note: For streaming, we can only retry the initial connection, not mid-stream errors
 */
export async function withStreamRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // For streaming, use fewer retries and shorter delays
  // since we don't want users waiting too long for the stream to start
  return withRetry(operation, {
    maxRetries: 2,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    jitter: true,
    ...options,
  });
}
