import { getCurrentDailyCost } from "./tracker";
import { createLogger } from "@/lib/logging/logger";
import type { SubscriptionPlan } from "@/types/database";

const logger = createLogger("CostCeiling");

// Daily cost ceiling in dollars
// Default $20/day = ~$600/month
// Can be overridden with OPENAI_DAILY_COST_CEILING env var
const DEFAULT_DAILY_CEILING = 20;

export interface CostCeilingResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Current daily cost */
  currentCost: number;
  /** Daily ceiling */
  ceiling: number;
  /** Percentage of ceiling used */
  percentUsed: number;
  /** Operating mode */
  mode: "normal" | "warning" | "degraded" | "emergency";
  /** Message explaining the status */
  message?: string;
}

/**
 * Get the daily cost ceiling from environment or default
 */
function getDailyCeiling(): number {
  const envCeiling = process.env.OPENAI_DAILY_COST_CEILING;
  if (envCeiling) {
    const parsed = parseFloat(envCeiling);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_DAILY_CEILING;
}

/**
 * Check if a request should be allowed based on global cost ceiling
 *
 * Ceiling tiers:
 * - Below 80%: Normal operation
 * - 80-95%: Warning mode (allow paid users, queue free users)
 * - 95-100%: Degraded mode (allow pro only, reject others)
 * - Above 100%: Emergency mode (reject all non-critical requests)
 *
 * @param userPlan - User's subscription plan
 * @returns Cost ceiling result with allowed status and mode
 */
export async function checkCostCeiling(
  userPlan: SubscriptionPlan
): Promise<CostCeilingResult> {
  const ceiling = getDailyCeiling();
  const currentCost = await getCurrentDailyCost();
  const percentUsed = (currentCost / ceiling) * 100;

  // Normal operation: below 80%
  if (percentUsed < 80) {
    return {
      allowed: true,
      currentCost,
      ceiling,
      percentUsed,
      mode: "normal",
    };
  }

  // Warning mode: 80-95%
  // Allow all paid users, add delay for free users
  if (percentUsed < 95) {
    logger.warn(`Warning mode: ${percentUsed.toFixed(1)}% of daily ceiling used`);

    if (userPlan === "free") {
      return {
        allowed: true, // Still allow, but could add delay
        currentCost,
        ceiling,
        percentUsed,
        mode: "warning",
        message: "Service is experiencing high demand. Paid plans get priority.",
      };
    }

    return {
      allowed: true,
      currentCost,
      ceiling,
      percentUsed,
      mode: "warning",
    };
  }

  // Degraded mode: 95-100%
  // Only allow pro users
  if (percentUsed < 100) {
    logger.warn(`Degraded mode: ${percentUsed.toFixed(1)}% of daily ceiling used`);

    if (userPlan === "pro") {
      return {
        allowed: true,
        currentCost,
        ceiling,
        percentUsed,
        mode: "degraded",
      };
    }

    return {
      allowed: false,
      currentCost,
      ceiling,
      percentUsed,
      mode: "degraded",
      message:
        "Service is temporarily limited due to high demand. Pro users have priority access. Please try again later or upgrade your plan.",
    };
  }

  // Emergency mode: above 100%
  // Reject all requests to protect budget
  logger.error(`EMERGENCY: Daily ceiling exceeded! ${percentUsed.toFixed(1)}%`);

  return {
    allowed: false,
    currentCost,
    ceiling,
    percentUsed,
    mode: "emergency",
    message: "Service is temporarily unavailable due to high demand. Please try again tomorrow.",
  };
}

/**
 * Get current cost status (for admin dashboard)
 */
export async function getCostStatus(): Promise<{
  currentCost: number;
  ceiling: number;
  percentUsed: number;
  mode: "normal" | "warning" | "degraded" | "emergency";
}> {
  const ceiling = getDailyCeiling();
  const currentCost = await getCurrentDailyCost();
  const percentUsed = (currentCost / ceiling) * 100;

  let mode: "normal" | "warning" | "degraded" | "emergency" = "normal";
  if (percentUsed >= 100) mode = "emergency";
  else if (percentUsed >= 95) mode = "degraded";
  else if (percentUsed >= 80) mode = "warning";

  return { currentCost, ceiling, percentUsed, mode };
}

/**
 * Format cost ceiling error response
 */
export function formatCostCeilingResponse(result: CostCeilingResult): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: "Service Capacity Reached",
      message: result.message || "Service is temporarily limited. Please try again later.",
      mode: result.mode,
      percentUsed: Math.round(result.percentUsed),
    }),
    {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "3600", // Suggest retry in 1 hour
      },
    }
  );
}
