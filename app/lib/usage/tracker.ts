import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logging/logger";

const logger = createLogger("Usage");

export type UsageType = "report" | "transcription" | "template";

export interface UsageMeta {
  /** Type of usage */
  type: UsageType;
  /** Template ID if applicable */
  templateId?: string;
  /** Modality if applicable */
  modality?: string;
  /** Duration in ms */
  durationMs?: number;
  /** Any additional metadata */
  [key: string]: unknown;
}

/**
 * Generate idempotency key for usage recording
 * Format: {type}_{userId}_{timestamp}_{random}
 */
function generateIdempotencyKey(userId: string, type: UsageType): string {
  const timestamp = Date.now();
  const random =
    typeof crypto !== "undefined"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${type}_${userId}_${timestamp}_${random}`;
}

/**
 * Record usage after a successful API call
 *
 * @param userId - User who made the request
 * @param type - Type of usage (report, transcription, template)
 * @param meta - Additional metadata for the usage record
 * @returns The idempotency key used for the record
 */
export async function recordUsage(
  userId: string,
  type: UsageType,
  meta: Omit<UsageMeta, "type"> = {}
): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const idempotencyKey = generateIdempotencyKey(userId, type);

    const { error } = await supabase.from("credits_ledger").insert({
      user_id: userId,
      delta: -1, // Debit 1 credit
      reason: "debit",
      meta: { type, ...meta },
      idempotency_key: idempotencyKey,
    });

    if (error) {
      // Check if it's a duplicate key error (idempotency violation)
      if (error.code === "23505") {
        logger.warn("Duplicate usage record attempted:", idempotencyKey);
        return idempotencyKey;
      }
      logger.error("Error recording usage:", error);
      return null;
    }

    logger.debug(`Recorded ${type} usage for user ${userId}`);
    return idempotencyKey;
  } catch (error) {
    // Don't fail the request if usage recording fails
    logger.error("Unexpected error recording usage:", error);
    return null;
  }
}

/**
 * Record usage with a pre-generated idempotency key
 * Use this when you need to ensure the same request isn't recorded twice
 * (e.g., for retried requests)
 */
export async function recordUsageWithKey(
  userId: string,
  type: UsageType,
  idempotencyKey: string,
  meta: Omit<UsageMeta, "type"> = {}
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("credits_ledger").insert({
      user_id: userId,
      delta: -1,
      reason: "debit",
      meta: { type, ...meta },
      idempotency_key: idempotencyKey,
    });

    if (error) {
      if (error.code === "23505") {
        // Already recorded - this is fine
        logger.debug("Usage already recorded:", idempotencyKey);
        return true;
      }
      logger.error("Error recording usage:", error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Unexpected error recording usage:", error);
    return false;
  }
}

/**
 * Get total usage for a user in the current period
 * Useful for displaying in UI
 */
export async function getCurrentPeriodUsage(
  userId: string
): Promise<{ reports: number; transcriptions: number; templates: number }> {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current period start (first of month for simplicity)
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data, error } = await supabase
      .from("credits_ledger")
      .select("meta")
      .eq("user_id", userId)
      .eq("reason", "debit")
      .gte("created_at", periodStart.toISOString());

    if (error) {
      logger.error("Error fetching period usage:", error);
      return { reports: 0, transcriptions: 0, templates: 0 };
    }

    const usage = { reports: 0, transcriptions: 0, templates: 0 };

    for (const record of data ?? []) {
      const meta = record.meta as UsageMeta | null;
      if (meta?.type === "report") usage.reports++;
      else if (meta?.type === "transcription") usage.transcriptions++;
      else if (meta?.type === "template") usage.templates++;
    }

    return usage;
  } catch (error) {
    logger.error("Unexpected error fetching usage:", error);
    return { reports: 0, transcriptions: 0, templates: 0 };
  }
}
