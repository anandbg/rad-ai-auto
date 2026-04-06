import { redis } from "@/lib/ratelimit/client";
import { createLogger } from "@/lib/logging/logger";
import {
  computeCost,
  computeTranscriptionCost,
  type TextUsage,
} from "./pricing";

const logger = createLogger("Cost");

export type CostType = "report" | "transcription" | "template";

export interface CostEntry {
  type: CostType;
  amount: number; // Cost in dollars
  userId: string;
  timestamp: number;
}

/**
 * Legacy cost estimates retained for backward compatibility with un-migrated
 * call sites that still invoke `trackCost(type, userId)` without usage data.
 *
 * NOTE: These are pre-v3.0 OpenAI-based estimates. They are intentionally
 * wrong for Groq traffic (~71x over-estimate for reports) — the daily cost
 * ceiling still fires on the safe side. Migrated callers should pass a
 * `{ usage }` or `{ transcription }` object for accurate tracking.
 */
const COST_ESTIMATES: Record<CostType, number> = {
  report: 0.05,
  transcription: 0.06,
  template: 0.03,
};

interface TranscriptionUsageArg {
  provider: string;
  model: string;
  durationSeconds: number;
}

/**
 * Accepted shapes for the optional third argument to trackCost.
 *
 * - `undefined`                    → use legacy COST_ESTIMATES[type]
 * - `number`                       → legacy explicit dollar cost
 * - `{ actualCost: number }`       → explicit dollar cost (object form)
 * - `{ usage: TextUsage }`         → compute from token counts via pricing module
 * - `{ transcription: ... }`       → compute from audio duration via pricing module
 */
export type TrackCostArg =
  | number
  | { actualCost: number }
  | { usage: TextUsage }
  | { transcription: TranscriptionUsageArg };

/**
 * Get the Redis key for daily cost tracking.
 * Uses UTC date to ensure consistent daily reset.
 */
function getDailyCostKey(): string {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `@airad/cost/daily/${today}`;
}

function resolveCost(
  type: CostType,
  arg: TrackCostArg | undefined
): { cost: number; providerInfo: string } {
  if (arg === undefined) {
    return { cost: COST_ESTIMATES[type], providerInfo: "legacy-estimate" };
  }
  if (typeof arg === "number") {
    return { cost: arg, providerInfo: "explicit" };
  }
  if ("actualCost" in arg) {
    return { cost: arg.actualCost, providerInfo: "explicit" };
  }
  if ("usage" in arg) {
    const { provider, model } = arg.usage;
    return {
      cost: computeCost(arg.usage),
      providerInfo: `${provider}:${model}`,
    };
  }
  if ("transcription" in arg) {
    const { provider, model } = arg.transcription;
    return {
      cost: computeTranscriptionCost(arg.transcription),
      providerInfo: `${provider}:${model}`,
    };
  }
  return { cost: COST_ESTIMATES[type], providerInfo: "legacy-estimate" };
}

/**
 * Track the cost of an AI operation in Redis (daily rolling counter).
 *
 * Backward compatible with all legacy call sites:
 * - `trackCost("report", userId)`                     → COST_ESTIMATES.report
 * - `trackCost("report", userId, 0.02)`               → explicit dollar
 * - `trackCost("report", userId, { actualCost: 0.02 })`
 * - `trackCost("report", userId, { usage: {...} })`   → provider-aware
 * - `trackCost("transcription", userId, { transcription: {...} })`
 *
 * Never throws: if Redis is unavailable or errors, the function logs and
 * returns. Cost tracking must never break the request flow.
 */
export async function trackCost(
  type: CostType,
  userId: string,
  arg?: TrackCostArg
): Promise<void> {
  if (!redis) {
    logger.warn("Redis not configured, skipping cost tracking");
    return;
  }

  const { cost, providerInfo } = resolveCost(type, arg);
  const key = getDailyCostKey();

  try {
    // Store as cents for integer precision on Redis INCRBY
    const costCents = Math.round(cost * 100);
    await redis.incrby(key, costCents);

    // 48-hour expiry gives buffer for reporting jobs
    await redis.expire(key, 48 * 60 * 60);

    logger.debug(
      `Tracked $${cost.toFixed(6)} for ${type} (${providerInfo}) by ${userId}`
    );
  } catch (error) {
    // Non-blocking - never fail requests because of cost tracking
    logger.error("Failed to track cost:", error);
  }
}

/**
 * Get current daily cost total.
 * @returns Total cost in dollars for today
 */
export async function getCurrentDailyCost(): Promise<number> {
  if (!redis) {
    return 0;
  }

  try {
    const key = getDailyCostKey();
    const costCents = await redis.get<number>(key);
    return (costCents ?? 0) / 100;
  } catch (error) {
    logger.error("Failed to get daily cost:", error);
    return 0;
  }
}

/**
 * Get cost estimate for a specific operation type (legacy helper).
 */
export function getCostEstimate(type: CostType): number {
  return COST_ESTIMATES[type];
}
