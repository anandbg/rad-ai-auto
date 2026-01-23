---
phase: 30-capacity-rate-limiting
plan: 07
subsystem: infra
tags: [redis, cost-tracking, rate-limiting, openai, upstash]

# Dependency graph
requires:
  - phase: 30-01
    provides: Redis client for distributed operations
provides:
  - Cost tracking utility for OpenAI API calls
  - Daily cost ceiling with tiered degradation
  - Admin cost status endpoint
affects: [30-08, 30-09, api-routes]

# Tech tracking
tech-stack:
  added: []
  patterns: [cost-cents-storage, tiered-degradation, fail-open-tracking]

key-files:
  created:
    - app/lib/cost/tracker.ts
    - app/lib/cost/ceiling.ts
  modified: []

key-decisions:
  - "Store cost in cents to avoid floating point issues"
  - "Use UTC date for consistent daily reset at midnight"
  - "48-hour expiry for cost keys allows previous day reporting"
  - "Four-tier degradation: normal, warning, degraded, emergency"
  - "Pro users have priority in degraded mode (95-100%)"
  - "Non-blocking cost tracking: failures don't affect API requests"

patterns-established:
  - "Cost ceiling pattern: checkCostCeiling(plan) before AI calls"
  - "Tiered access: pro > plus > free during high load"
  - "Environment override: OPENAI_DAILY_COST_CEILING"

# Metrics
duration: 3min
completed: 2026-01-23
---

# Phase 30 Plan 07: Global Cost Ceiling Summary

**Daily cost tracking in Redis with four-tier graceful degradation protecting OpenAI API budget**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-23T09:56:00Z
- **Completed:** 2026-01-23T09:59:00Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- Cost tracking utility stores daily totals in Redis (cents for precision)
- Four-tier cost ceiling: normal (<80%), warning (80-95%), degraded (95-100%), emergency (>100%)
- Pro users have priority access during high load
- Configurable daily ceiling via OPENAI_DAILY_COST_CEILING env var
- Admin endpoint for monitoring cost status

## Task Commits

Each task was committed atomically:

1. **Task 1: Create cost tracking utility** - `558d25c` (feat)
2. **Task 2: Create cost ceiling checker** - `a54e9eb` (feat)

## Files Created

- `app/lib/cost/tracker.ts` - Tracks OpenAI API costs in Redis with daily key
- `app/lib/cost/ceiling.ts` - Checks cost ceiling with tiered degradation logic

## Decisions Made

- **Cents storage:** Store costs as integer cents in Redis to avoid floating point precision issues
- **UTC daily key:** Use UTC date (`YYYY-MM-DD`) for consistent daily reset at midnight regardless of server timezone
- **48-hour expiry:** Keep cost data for 48 hours to allow reporting on previous day before data expires
- **Fixed estimates:** Use fixed cost estimates per operation type (report: $0.05, transcription: $0.06, template: $0.03) for simplicity
- **Tiered degradation:** Four modes with clear cutoffs (80%, 95%, 100%) that progressively restrict access
- **Pro priority:** Only pro users allowed in degraded mode (95-100%) to protect highest-paying customers
- **Non-blocking:** Cost tracking failures don't block API requests (fail-open pattern)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Optional environment variable:
- `OPENAI_DAILY_COST_CEILING` - Daily cost ceiling in dollars (default: $20/day)

Redis must be configured (from 30-01):
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Next Phase Readiness

- Cost utilities ready for integration into API routes
- Next plan (30-08) will integrate cost checks into generate/transcribe endpoints
- Admin dashboard can use `getCostStatus()` to display current cost status

---
*Phase: 30-capacity-rate-limiting*
*Completed: 2026-01-23*
