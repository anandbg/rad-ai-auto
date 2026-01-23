import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SubscriptionPlan } from "@/types/database";
import { createLogger } from "@/lib/logging/logger";

const logger = createLogger("Usage");

export type UsageType = "reports" | "transcriptions";

export interface UsageCheckResult {
  /** Whether the user can make this request */
  allowed: boolean;
  /** Current usage count this period */
  currentUsage: number;
  /** Maximum allowed per period (-1 = unlimited) */
  limit: number;
  /** When the usage period resets */
  resetDate: Date;
  /** User's subscription plan */
  plan: SubscriptionPlan;
}

/**
 * Default limits if no subscription found (free tier)
 */
const DEFAULT_LIMITS = {
  max_reports_per_month: 10,
  max_transcriptions_per_month: 5,
};

/**
 * Check if a user has exceeded their monthly usage limit
 *
 * @param userId - User ID to check
 * @param usageType - Type of usage: "reports" or "transcriptions"
 * @returns Usage check result with current usage and limits
 */
export async function checkMonthlyUsage(
  userId: string,
  usageType: UsageType
): Promise<UsageCheckResult> {
  try {
    const supabase = await createSupabaseServerClient();

    // 1. Get user's subscription (if any)
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("plan, status, period_start, period_end")
      .eq("user_id", userId)
      .single();

    if (subError && subError.code !== "PGRST116") {
      // PGRST116 = no rows, which is fine (free user)
      logger.error("Error fetching subscription:", subError);
    }

    // Determine effective plan (free if no active subscription)
    const isActive =
      subscription?.status === "active" ||
      subscription?.status === "trialing";
    const plan: SubscriptionPlan =
      isActive && subscription?.plan ? subscription.plan : "free";

    // 2. Get plan limits
    const { data: limits, error: limitsError } = await supabase
      .from("subscription_limits")
      .select("max_reports_per_month, max_transcriptions_per_month")
      .eq("plan", plan)
      .single();

    if (limitsError) {
      logger.error("Error fetching limits:", limitsError);
    }

    const maxLimit =
      usageType === "reports"
        ? (limits?.max_reports_per_month ?? DEFAULT_LIMITS.max_reports_per_month)
        : (limits?.max_transcriptions_per_month ??
            DEFAULT_LIMITS.max_transcriptions_per_month);

    // -1 means unlimited (pro plan)
    if (maxLimit === -1) {
      return {
        allowed: true,
        currentUsage: 0,
        limit: -1,
        resetDate: subscription?.period_end
          ? new Date(subscription.period_end)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        plan,
      };
    }

    // 3. Calculate period boundaries
    // Use subscription period if available, otherwise use calendar month
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (subscription?.period_start && subscription?.period_end) {
      periodStart = new Date(subscription.period_start);
      periodEnd = new Date(subscription.period_end);
    } else {
      // Free users: use calendar month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // 4. Count usage in current period
    // Count from credits_ledger where meta->>type matches
    const { count, error: countError } = await supabase
      .from("credits_ledger")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("reason", "debit")
      .gte("created_at", periodStart.toISOString())
      .filter(
        "meta->>type",
        "eq",
        usageType === "reports" ? "report" : "transcription"
      );

    if (countError) {
      logger.error("Error counting usage:", countError);
    }

    const currentUsage = count ?? 0;

    return {
      allowed: currentUsage < maxLimit,
      currentUsage,
      limit: maxLimit,
      resetDate: periodEnd,
      plan,
    };
  } catch (error) {
    // Fail open on errors - don't block user due to DB issues
    logger.error("Unexpected error checking usage:", error);
    return {
      allowed: true,
      currentUsage: 0,
      limit: 999,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      plan: "free",
    };
  }
}

/**
 * Format usage info for API response headers
 */
export function formatUsageHeaders(
  result: UsageCheckResult
): Record<string, string> {
  return {
    "X-Usage-Current": String(result.currentUsage),
    "X-Usage-Limit": String(result.limit),
    "X-Usage-Reset": result.resetDate.toISOString(),
  };
}
