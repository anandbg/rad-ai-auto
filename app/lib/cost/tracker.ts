import { redis } from "@/lib/ratelimit/client";
import { createLogger } from "@/lib/logging/logger";

const logger = createLogger("Cost");

export type CostType = "report" | "transcription" | "template";

export interface CostEntry {
  type: CostType;
  amount: number; // Cost in dollars
  userId: string;
  timestamp: number;
}

// Estimated costs per operation (in dollars)
// Based on OpenAI pricing as of 2026-01
// GPT-4o input: $0.0025 / 1K tokens
// GPT-4o output: $0.01 / 1K tokens
// Whisper: $0.006 / minute
const COST_ESTIMATES: Record<CostType, number> = {
  report: 0.05, // ~2K input + 2K output tokens
  transcription: 0.06, // ~10 minutes average
  template: 0.03, // ~1K input + 1K output tokens
};

/**
 * Get the Redis key for daily cost tracking
 * Uses UTC date to ensure consistent daily reset
 */
function getDailyCostKey(): string {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `@airad/cost/daily/${today}`;
}

/**
 * Track cost of an API operation
 * @param type - Type of operation
 * @param userId - User who made the request
 * @param actualCost - Optional actual cost (defaults to estimate)
 */
export async function trackCost(
  type: CostType,
  userId: string,
  actualCost?: number
): Promise<void> {
  if (!redis) {
    logger.warn("Redis not configured, skipping cost tracking");
    return;
  }

  const cost = actualCost ?? COST_ESTIMATES[type];
  const key = getDailyCostKey();

  try {
    // Increment daily cost counter (stored as cents for precision)
    const costCents = Math.round(cost * 100);
    await redis.incrby(key, costCents);

    // Set expiry to 48 hours (gives buffer for reporting)
    await redis.expire(key, 48 * 60 * 60);

    logger.debug(`Tracked $${cost.toFixed(4)} for ${type} by ${userId}`);
  } catch (error) {
    // Non-blocking - don't fail requests if cost tracking fails
    logger.error("Failed to track cost:", error);
  }
}

/**
 * Get current daily cost total
 * @returns Total cost in dollars for today
 */
export async function getCurrentDailyCost(): Promise<number> {
  if (!redis) {
    return 0;
  }

  try {
    const key = getDailyCostKey();
    const costCents = await redis.get<number>(key);
    return (costCents ?? 0) / 100; // Convert cents to dollars
  } catch (error) {
    logger.error("Failed to get daily cost:", error);
    return 0;
  }
}

/**
 * Get cost estimate for a specific operation type
 */
export function getCostEstimate(type: CostType): number {
  return COST_ESTIMATES[type];
}
