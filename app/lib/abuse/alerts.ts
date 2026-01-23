import { createLogger } from "@/lib/logging/logger";
import type { OperationType } from "./detector";

const logger = createLogger("AbuseAlert");

export interface AbuseAlert {
  /** Unique alert ID */
  id: string;
  /** User who triggered the alert */
  userId: string;
  /** User's email (if available) */
  userEmail?: string;
  /** Type of operation that triggered alert */
  operation: OperationType;
  /** Current count that triggered alert */
  count: number;
  /** Threshold that was exceeded */
  threshold: number;
  /** Timestamp of alert */
  timestamp: Date;
  /** Severity level */
  severity: "warning" | "critical";
  /** Whether user was auto-blocked */
  autoBlocked: boolean;
}

// In-memory recent alerts (for admin API - could be moved to Redis)
const recentAlerts: AbuseAlert[] = [];
const MAX_RECENT_ALERTS = 100;

/**
 * Generate unique alert ID
 */
function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Log an abuse alert
 *
 * @param userId - User who triggered the alert
 * @param operation - Type of operation
 * @param count - Current count
 * @param threshold - Threshold that was exceeded
 * @param options - Additional options
 */
export async function logAbuseAlert(
  userId: string,
  operation: OperationType,
  count: number,
  threshold: number,
  options: {
    userEmail?: string;
    autoBlocked?: boolean;
  } = {}
): Promise<AbuseAlert> {
  // Determine severity based on how much threshold was exceeded
  const ratio = count / threshold;
  const severity: "warning" | "critical" = ratio >= 2 ? "critical" : "warning";

  const alert: AbuseAlert = {
    id: generateAlertId(),
    userId,
    userEmail: options.userEmail,
    operation,
    count,
    threshold,
    timestamp: new Date(),
    severity,
    autoBlocked: options.autoBlocked ?? false,
  };

  // Log to application logger
  const logMessage = `${severity.toUpperCase()}: User ${userId} ` +
    `exceeded ${operation} threshold (${count}/${threshold})` +
    (options.autoBlocked ? " - AUTO BLOCKED" : "");

  if (severity === "critical") {
    logger.error(logMessage, { alert });
  } else {
    logger.warn(logMessage, { alert });
  }

  // Store in recent alerts (circular buffer)
  recentAlerts.unshift(alert);
  if (recentAlerts.length > MAX_RECENT_ALERTS) {
    recentAlerts.pop();
  }

  // Future: Could send to external alerting service (PagerDuty, Slack, etc.)
  // await sendToSlack(alert);
  // await sendToPagerDuty(alert);

  return alert;
}

/**
 * Get recent abuse alerts (for admin dashboard)
 *
 * @param limit - Maximum number of alerts to return
 * @param severity - Filter by severity (optional)
 */
export function getRecentAlerts(
  limit: number = 20,
  severity?: "warning" | "critical"
): AbuseAlert[] {
  let filtered = recentAlerts;

  if (severity) {
    filtered = recentAlerts.filter(a => a.severity === severity);
  }

  return filtered.slice(0, limit);
}

/**
 * Get abuse alerts for a specific user
 */
export function getAlertsForUser(userId: string): AbuseAlert[] {
  return recentAlerts.filter(a => a.userId === userId);
}

/**
 * Clear all alerts (for testing)
 */
export function clearAlerts(): void {
  recentAlerts.length = 0;
}

/**
 * Format alert for display
 */
export function formatAlertMessage(alert: AbuseAlert): string {
  const time = alert.timestamp.toISOString();
  const status = alert.autoBlocked ? "BLOCKED" : "WARNED";
  return `[${time}] ${alert.severity.toUpperCase()} - User ${alert.userId}: ` +
    `${alert.count}/${alert.threshold} ${alert.operation}s/hour [${status}]`;
}
