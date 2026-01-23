---
phase: 30-capacity-rate-limiting
plan: 04
subsystem: api-protection
tags: [rate-limiting, usage-tracking, openai, retry]
depends_on:
  requires: [30-01, 30-02, 30-03]
  provides: [protected-generate-endpoint]
  affects: [30-05, 30-06]
tech-stack:
  added: []
  patterns: [rate-limiting-middleware, usage-tracking, retry-with-backoff]
key-files:
  modified:
    - app/app/api/generate/route.ts
decisions:
  - Check rate limit before validation (fail fast)
  - Use plan-based rate limiting (free: 5/min, plus: 30/min, pro: 60/min)
  - Record usage non-blocking with .catch() error handling
  - Add rate limit headers to successful responses
metrics:
  duration: 6 min
  completed: 2026-01-23
---

# Phase 30 Plan 04: Generate Endpoint Protection Summary

Rate limiting, usage tracking, and retry logic integrated into the report generation API.

## One-liner

Generate endpoint protected with per-user rate limiting, monthly usage limits, and OpenAI retry logic.

## Tasks Completed

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Add rate limiting and retry to generate endpoint | 6a763ad | Done |

## What Was Built

### Generate Endpoint Protection

The `/api/generate` endpoint now has multiple layers of protection:

1. **Per-User Rate Limiting**
   - Checks rate limit BEFORE processing request
   - Uses plan-based limits from Wave 1 configuration
   - Returns 429 with Retry-After header when exceeded
   - Includes X-RateLimit-Remaining and X-RateLimit-Limit headers

2. **Monthly Usage Limits**
   - Checks against subscription_limits table
   - Returns 429 with usage details when exceeded
   - Includes X-Usage-Current, X-Usage-Limit, X-Usage-Reset headers

3. **OpenAI Retry Logic**
   - Wraps streamText call with withStreamRetry
   - Handles transient errors with exponential backoff
   - Maximum 2 retries with 500ms initial delay for streaming
   - Formats errors appropriately for user-facing responses

4. **Usage Recording**
   - Records successful generation to credits_ledger
   - Non-blocking with .catch() error handling
   - Includes templateId and modality metadata

## Technical Details

### Request Flow

```
User Request
    |
    v
Authentication Check
    |
    v
Rate Limit Check (checkRateLimit) <-- 429 if exceeded
    |
    v
Monthly Usage Check (checkMonthlyUsage) <-- 429 if exceeded
    |
    v
Request Validation
    |
    v
OpenAI API Call (withStreamRetry)
    |
    v
Record Usage (recordUsage) <-- non-blocking
    |
    v
Stream Response with Rate Limit Headers
```

### Rate Limit Response

```json
{
  "success": false,
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Please wait 45 seconds before trying again.",
  "retryAfter": 45
}
```

Headers: `Retry-After: 45`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Limit: 5`

### Usage Limit Response

```json
{
  "success": false,
  "error": "Monthly Limit Reached",
  "message": "You've used 10 of 10 reports this month. Your limit resets on 2/1/2026.",
  "currentUsage": 10,
  "limit": 10,
  "resetDate": "2026-02-01T00:00:00.000Z"
}
```

## Verification Results

- [x] TypeScript compiles successfully
- [x] Build succeeds with NEXT_DISABLE_ESLINT=1
- [x] Route includes rate limit check (line 115)
- [x] Route includes usage limit check (line 139)
- [x] Route includes retry wrapper (line 349)
- [x] Route records usage on success (line 361)

## Dependencies Used

- `@/lib/ratelimit/limiters` - checkRateLimit (from 30-01)
- `@/lib/openai/retry` - withStreamRetry (from 30-02)
- `@/lib/openai/errors` - formatErrorResponse (from 30-02)
- `@/lib/usage/limits` - checkMonthlyUsage, formatUsageHeaders (from 30-03)
- `@/lib/usage/tracker` - recordUsage (from 30-03)

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Ready for:
- 30-05: Transcribe Endpoint Protection (same pattern)
- 30-06: Template Generation Endpoint Protection (same pattern)
