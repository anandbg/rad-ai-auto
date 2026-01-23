import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./client";
import type { SubscriptionPlan } from "@/types/database";

/**
 * Rate limiters configured per subscription tier and endpoint.
 *
 * Rate limits (requests per minute):
 * | Tier | Generate | Transcribe | Template Gen |
 * |------|----------|------------|--------------|
 * | free | 5/min    | 3/min      | 3/min        |
 * | plus | 30/min   | 15/min     | 10/min       |
 * | pro  | 60/min   | 30/min     | 20/min       |
 *
 * Uses sliding window algorithm for smooth rate limiting
 * (prevents burst attacks at interval boundaries).
 */

// Disable rate limiting if Redis not configured
const RATE_LIMITING_ENABLED = redis !== null;

/**
 * Create a rate limiter instance with the given configuration.
 * Returns null if Redis is not configured.
 */
function createLimiter(
  prefix: string,
  limit: number,
  window: `${number} ${"s" | "m" | "h" | "d"}`
): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true, // Enable Upstash analytics dashboard
    prefix: `@airad/${prefix}`,
    timeout: 1000, // Fail open after 1 second
  });
}

// Generate endpoint limiters (report generation)
export const generateLimiters = {
  free: createLimiter("generate/free", 5, "1 m"),
  plus: createLimiter("generate/plus", 30, "1 m"),
  pro: createLimiter("generate/pro", 60, "1 m"),
};

// Transcribe endpoint limiters (voice-to-text)
export const transcribeLimiters = {
  free: createLimiter("transcribe/free", 3, "1 m"),
  plus: createLimiter("transcribe/plus", 15, "1 m"),
  pro: createLimiter("transcribe/pro", 30, "1 m"),
};

// Template generation endpoint limiters (AI template creation)
export const templateLimiters = {
  free: createLimiter("template/free", 3, "1 m"),
  plus: createLimiter("template/plus", 10, "1 m"),
  pro: createLimiter("template/pro", 20, "1 m"),
};

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // Unix timestamp in ms
  limit: number;
}

/**
 * Check rate limit for a user on a specific endpoint.
 *
 * @param userId - User ID to check
 * @param plan - User's subscription plan
 * @param endpoint - Which endpoint: 'generate' | 'transcribe' | 'template'
 * @returns Rate limit result with remaining requests and reset time
 *
 * @example
 * ```ts
 * const result = await checkRateLimit(userId, 'free', 'generate');
 * if (!result.success) {
 *   return new Response('Rate limit exceeded', {
 *     status: 429,
 *     headers: { 'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)) }
 *   });
 * }
 * ```
 */
export async function checkRateLimit(
  userId: string,
  plan: SubscriptionPlan,
  endpoint: "generate" | "transcribe" | "template"
): Promise<RateLimitResult> {
  // If rate limiting disabled, always allow
  if (!RATE_LIMITING_ENABLED) {
    return {
      success: true,
      remaining: 999,
      reset: Date.now() + 60000,
      limit: 999,
    };
  }

  const limiters = {
    generate: generateLimiters,
    transcribe: transcribeLimiters,
    template: templateLimiters,
  };

  const limiter = limiters[endpoint][plan];

  // Fallback to free tier limits if specific limiter not found
  if (!limiter) {
    const fallback = limiters[endpoint].free;
    if (!fallback) {
      return {
        success: true,
        remaining: 999,
        reset: Date.now() + 60000,
        limit: 999,
      };
    }
    const result = await fallback.limit(userId);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit: result.limit,
    };
  }

  try {
    const result = await limiter.limit(userId);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit: result.limit,
    };
  } catch (error) {
    // Fail open on Redis errors
    console.error("[Rate Limit] Redis error, failing open:", error);
    return {
      success: true,
      remaining: 999,
      reset: Date.now() + 60000,
      limit: 999,
    };
  }
}

/**
 * Get rate limit headers for successful responses.
 * Include these in API responses so clients can track their usage.
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}
