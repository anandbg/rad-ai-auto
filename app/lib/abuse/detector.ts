import { redis } from "@/lib/ratelimit/client";
import { createLogger } from "@/lib/logging/logger";

const logger = createLogger("Abuse");

export type OperationType = "report" | "transcription" | "template";

export interface AbuseCheckResult {
  /** Whether usage is within normal bounds */
  normal: boolean;
  /** Current hourly count for this operation */
  hourlyCount: number;
  /** Threshold for this operation type */
  threshold: number;
  /** Whether user is currently flagged for abuse */
  flagged: boolean;
  /** Reason if flagged */
  reason?: string;
}

// Configurable thresholds via environment variables
const ABUSE_THRESHOLDS: Record<OperationType, number> = {
  report: parseInt(process.env.ABUSE_THRESHOLD_REPORTS_HOUR || "50", 10),
  transcription: parseInt(process.env.ABUSE_THRESHOLD_TRANSCRIPTIONS_HOUR || "100", 10),
  template: parseInt(process.env.ABUSE_THRESHOLD_TEMPLATES_HOUR || "30", 10),
};

/**
 * Get Redis key for hourly operation count
 */
function getHourlyCountKey(userId: string, operation: OperationType): string {
  const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
  return `@airad/abuse/hourly/${userId}/${operation}/${hour}`;
}

/**
 * Get Redis key for user abuse flag
 */
function getAbuseFlagKey(userId: string): string {
  return `@airad/abuse/flagged/${userId}`;
}

/**
 * Check if user's request pattern indicates potential abuse
 *
 * @param userId - User making the request
 * @param operation - Type of operation being performed
 * @returns Abuse check result with current counts and flag status
 */
export async function checkAbusePattern(
  userId: string,
  operation: OperationType
): Promise<AbuseCheckResult> {
  if (!redis) {
    // No Redis = no abuse detection, allow request
    return {
      normal: true,
      hourlyCount: 0,
      threshold: ABUSE_THRESHOLDS[operation],
      flagged: false,
    };
  }

  try {
    const countKey = getHourlyCountKey(userId, operation);
    const flagKey = getAbuseFlagKey(userId);

    // Check if user is already flagged
    const isFlagged = await redis.get<string>(flagKey);
    if (isFlagged) {
      return {
        normal: false,
        hourlyCount: 0,
        threshold: ABUSE_THRESHOLDS[operation],
        flagged: true,
        reason: isFlagged,
      };
    }

    // Increment and get current count
    const count = await redis.incr(countKey);

    // Set expiry on first increment (2 hours to allow for reporting)
    if (count === 1) {
      await redis.expire(countKey, 2 * 60 * 60);
    }

    const threshold = ABUSE_THRESHOLDS[operation];
    const isAbusive = count > threshold;

    if (isAbusive) {
      logger.warn(`User ${userId} exceeded ${operation} threshold: ${count}/${threshold}`);
    }

    return {
      normal: !isAbusive,
      hourlyCount: count,
      threshold,
      flagged: false,
    };
  } catch (error) {
    // Fail open - don't block requests if abuse detection fails
    logger.error("Failed to check abuse pattern:", error);
    return {
      normal: true,
      hourlyCount: 0,
      threshold: ABUSE_THRESHOLDS[operation],
      flagged: false,
    };
  }
}

/**
 * Flag a user for abuse (manual or automatic)
 *
 * @param userId - User to flag
 * @param reason - Reason for flagging
 * @param durationHours - How long to keep the flag (default 24 hours)
 */
export async function flagUserForAbuse(
  userId: string,
  reason: string,
  durationHours: number = 24
): Promise<void> {
  if (!redis) {
    logger.warn("Cannot flag user - Redis not configured");
    return;
  }

  try {
    const flagKey = getAbuseFlagKey(userId);
    await redis.set(flagKey, reason, { ex: durationHours * 60 * 60 });
    logger.warn(`Flagged user ${userId}: ${reason} (${durationHours}h)`);
  } catch (error) {
    logger.error("Failed to flag user:", error);
  }
}

/**
 * Remove abuse flag from a user
 */
export async function unflagUser(userId: string): Promise<void> {
  if (!redis) return;

  try {
    const flagKey = getAbuseFlagKey(userId);
    await redis.del(flagKey);
    logger.log(`Unflagged user ${userId}`);
  } catch (error) {
    logger.error("Failed to unflag user:", error);
  }
}

/**
 * Get current hourly counts for a user (for admin dashboard)
 */
export async function getUserHourlyCounts(
  userId: string
): Promise<Record<OperationType, number>> {
  if (!redis) {
    return { report: 0, transcription: 0, template: 0 };
  }

  try {
    const operations: OperationType[] = ["report", "transcription", "template"];
    const counts: Record<OperationType, number> = {
      report: 0,
      transcription: 0,
      template: 0,
    };

    for (const op of operations) {
      const key = getHourlyCountKey(userId, op);
      const count = await redis.get<number>(key);
      counts[op] = count ?? 0;
    }

    return counts;
  } catch (error) {
    logger.error("Failed to get user counts:", error);
    return { report: 0, transcription: 0, template: 0 };
  }
}
