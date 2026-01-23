---
phase: 30-capacity-rate-limiting
plan: 08
subsystem: security
tags: [abuse-detection, redis, rate-limiting, security]
dependency-graph:
  requires: ["30-01"]
  provides: ["abuse-detection", "user-flagging", "alert-logging"]
  affects: ["api-routes", "admin-dashboard"]
tech-stack:
  added: []
  patterns: ["fail-open", "circular-buffer", "sliding-window"]
key-files:
  created:
    - app/lib/abuse/detector.ts
    - app/lib/abuse/alerts.ts
  modified: []
decisions:
  - id: "30-08-001"
    decision: "Fail-open pattern for abuse detection"
    rationale: "Don't block requests if Redis unavailable"
  - id: "30-08-002"
    decision: "2-hour TTL on hourly count keys"
    rationale: "Allow time for reporting and pattern analysis"
  - id: "30-08-003"
    decision: "Severity levels based on 2x threshold"
    rationale: "Critical if count >= 2x threshold, warning otherwise"
metrics:
  duration: "2 min"
  completed: "2026-01-23"
---

# Phase 30 Plan 08: Per-User Abuse Detection Summary

Per-user abuse detection with configurable thresholds and structured alerting for abnormal usage patterns.

## What Was Built

### Task 1: Abuse Pattern Detector (`app/lib/abuse/detector.ts`)

Created a utility to detect abnormal per-user usage patterns:

- **Configurable thresholds** via environment variables:
  - Reports: 50/hour (`ABUSE_THRESHOLD_REPORTS_HOUR`)
  - Transcriptions: 100/hour (`ABUSE_THRESHOLD_TRANSCRIPTIONS_HOUR`)
  - Templates: 30/hour (`ABUSE_THRESHOLD_TEMPLATES_HOUR`)
- **Sliding hourly window** using Redis with 2-hour TTL for reporting
- **User flagging** - manual flag/unflag with configurable duration (default 24h)
- **Admin query** - get current hourly counts for a user

Exports:
- `checkAbusePattern(userId, operation)` - Check if usage is abnormal
- `flagUserForAbuse(userId, reason, durationHours?)` - Manually flag a user
- `unflagUser(userId)` - Remove abuse flag
- `getUserHourlyCounts(userId)` - Get counts for admin dashboard

### Task 2: Abuse Alerting Utility (`app/lib/abuse/alerts.ts`)

Created structured alerting for abuse events:

- **Severity levels** - "warning" (threshold exceeded) or "critical" (2x+ threshold)
- **In-memory circular buffer** for recent alerts (100 max)
- **Admin query functions** - filter by severity, by user
- **Formatted messages** for display

Exports:
- `logAbuseAlert(userId, operation, count, threshold, options)` - Log an alert
- `getRecentAlerts(limit?, severity?)` - Get recent alerts for admin
- `getAlertsForUser(userId)` - Get alerts for specific user
- `clearAlerts()` - Clear all alerts (testing)
- `formatAlertMessage(alert)` - Format for display

## Commits

| Hash | Message |
|------|---------|
| bff611e | feat(30-08): add abuse pattern detector |
| 1836a2e | feat(30-08): add abuse alerting utility |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] TypeScript compiles: `cd app && npx tsc --noEmit` passes
- [x] Files exist: lib/abuse/detector.ts, lib/abuse/alerts.ts
- [x] Exports correct: checkAbusePattern, flagUserForAbuse, logAbuseAlert

## Integration Notes

To use abuse detection in API routes:

```typescript
import { checkAbusePattern } from "@/lib/abuse/detector";
import { logAbuseAlert } from "@/lib/abuse/alerts";

// In route handler
const result = await checkAbusePattern(userId, "report");

if (result.flagged) {
  return new Response("Account suspended", { status: 403 });
}

if (!result.normal) {
  await logAbuseAlert(userId, "report", result.hourlyCount, result.threshold);
  // Optionally auto-block:
  // await flagUserForAbuse(userId, "Exceeded report threshold", 24);
}
```

## Next Phase Readiness

Ready for integration into API routes (30-09 or future work).
