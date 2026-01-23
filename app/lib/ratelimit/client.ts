import { Redis } from "@upstash/redis";

/**
 * Upstash Redis client for edge-compatible distributed operations.
 *
 * Environment variables:
 * - UPSTASH_REDIS_REST_URL: Redis REST endpoint
 * - UPSTASH_REDIS_REST_TOKEN: Authentication token
 *
 * When these are not set, rate limiting will be disabled (fail open).
 * This allows local development without Redis configured.
 */

function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[Rate Limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured. Rate limiting disabled."
    );
    return null;
  }

  return new Redis({ url, token });
}

// Singleton pattern - create once, reuse across requests
export const redis = createRedisClient();
