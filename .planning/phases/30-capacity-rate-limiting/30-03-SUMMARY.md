---
phase: 30-capacity-rate-limiting
plan: 03
subsystem: usage-tracking
tags: [usage, limits, idempotency, subscription, credits]
dependency-graph:
  requires: []
  provides: ["usage-limit-checking", "usage-recording", "idempotency-keys"]
  affects: ["30-04", "30-05", "30-06"]
tech-stack:
  added: []
  patterns: ["fail-open-error-handling", "idempotency-keys", "subscription-period-tracking"]
key-files:
  created:
    - app/lib/usage/limits.ts
    - app/lib/usage/tracker.ts
  modified: []
decisions:
  - "Use fail-open pattern for usage checks (don't block users on DB errors)"
  - "Support both auto-generated and pre-provided idempotency keys"
  - "Use calendar month for free users, subscription period for paid users"
  - "Filter credits_ledger by meta->>type for usage type counting"
metrics:
  duration: 2 min
  completed: 2026-01-23
---

# Phase 30 Plan 03: Usage Tracking Summary

**One-liner:** Monthly usage limit checking and recording utilities with idempotency support

## What Was Built

### Task 1: Monthly Usage Limit Checker (limits.ts)

Created `app/lib/usage/limits.ts` with:

- **checkMonthlyUsage(userId, usageType)**: Checks if user has exceeded monthly limits
  - Queries subscription table for plan and billing period
  - Queries subscription_limits table for plan-specific limits
  - Counts usage from credits_ledger with period filter
  - Returns `UsageCheckResult` with allowed, currentUsage, limit, resetDate, plan

- **formatUsageHeaders(result)**: Formats usage info for API response headers
  - X-Usage-Current, X-Usage-Limit, X-Usage-Reset

Key implementation details:
- Handles free users (no subscription row) with calendar month periods
- Returns unlimited (-1) for pro plan without counting usage
- Fail-open on errors: returns allowed=true to avoid blocking users

### Task 2: Usage Recording Utility (tracker.ts)

Created `app/lib/usage/tracker.ts` with:

- **recordUsage(userId, type, meta)**: Records usage after successful API call
  - Auto-generates idempotency key: `{type}_{userId}_{timestamp}_{random}`
  - Non-blocking: failures don't affect API response
  - Returns idempotency key on success

- **recordUsageWithKey(userId, type, idempotencyKey, meta)**: Records with pre-provided key
  - For retried requests to prevent duplicate records
  - Returns true even if already recorded (idempotent)

- **getCurrentPeriodUsage(userId)**: Gets usage counts for UI display
  - Returns { reports, transcriptions, templates }

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| b365de8 | feat | Create monthly usage limit checker with subscription awareness |
| 6681387 | feat | Create usage recording utility with idempotency support |

## Decisions Made

1. **Fail-open pattern**: Usage check errors return allowed=true to avoid blocking users due to DB issues
2. **Dual idempotency key support**: Auto-generated for convenience, pre-provided for retried requests
3. **Period calculation**: Subscription period for paid users, calendar month for free users
4. **Meta filtering**: Use `meta->>type` filter to count specific usage types from credits_ledger

## Technical Notes

- UsageType differs between files: limits.ts uses "reports"/"transcriptions", tracker.ts uses "report"/"transcription"/"template"
- Idempotency key format: `{type}_{userId}_{timestamp}_{random}` (8-char UUID prefix)
- Default limits (fallback): 10 reports/month, 5 transcriptions/month
- Unlimited represented as -1 in subscription_limits table

## Dependencies

**Requires:**
- `@/lib/supabase/server`: createSupabaseServerClient
- `@/lib/logging/logger`: createLogger
- `@/types/database`: SubscriptionPlan

**Database tables accessed:**
- subscriptions (read)
- subscription_limits (read)
- credits_ledger (read/write)

## Next Phase Readiness

Ready for:
- Plan 30-04: Rate limiting middleware (uses checkMonthlyUsage)
- Plan 30-05: API route integration (uses recordUsage)
- Plan 30-06: UI usage display (uses getCurrentPeriodUsage)
