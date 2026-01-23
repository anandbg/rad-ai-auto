---
phase: 30-capacity-rate-limiting
plan: 02
subsystem: api
tags: [openai, retry, exponential-backoff, error-handling, rate-limiting]

# Dependency graph
requires:
  - phase: 29-code-refactoring
    provides: Centralized logging utility (lib/logging/logger.ts)
provides:
  - OpenAI error detection and categorization utilities
  - Retry wrapper with exponential backoff and jitter
  - User-friendly error response formatting
affects: [30-04-api-retry-integration, ai-generation, transcription]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Exponential backoff with jitter for API retry
    - Error categorization (retryable vs non-retryable)
    - Structured logging for observability

key-files:
  created:
    - app/lib/openai/errors.ts
    - app/lib/openai/retry.ts
  modified: []

key-decisions:
  - "Use jitter (50-100% of delay) to prevent thundering herd"
  - "Different defaults for streaming (2 retries, 500ms) vs non-streaming (3 retries, 1s)"
  - "Respect retry-after hints from API responses when available"
  - "Non-retryable errors (4xx) throw immediately without retry"

patterns-established:
  - "withRetry pattern: wrap async operations with automatic retry on transient errors"
  - "Error categorization: rate_limit, server_error, client_error, unknown"
  - "User-friendly error messages hide technical details"

# Metrics
duration: 2min
completed: 2026-01-23
---

# Phase 30 Plan 02: OpenAI Retry Utilities Summary

**Retry wrapper with exponential backoff (1s-30s), jitter for thundering herd prevention, and error categorization for 429/5xx handling**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-23T09:52:02Z
- **Completed:** 2026-01-23T09:54:11Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- Created error detection utilities that categorize OpenAI errors as retryable or non-retryable
- Built retry wrapper with exponential backoff (1s, 2s, 4s... up to 30s max)
- Added jitter to prevent thundering herd when multiple clients retry simultaneously
- Created streaming-optimized variant with shorter delays for better UX

## Task Commits

Each task was committed atomically:

1. **Task 1: Create OpenAI error detection utilities** - `c1ddc8d` (feat)
2. **Task 2: Create retry wrapper with exponential backoff** - `1917536` (feat)

## Files Created

- `app/lib/openai/errors.ts` - Error parsing, categorization, and user-friendly formatting
- `app/lib/openai/retry.ts` - Retry wrapper with exponential backoff and jitter

## Decisions Made

1. **Jitter range 50-100%** - Provides enough randomization to spread out retries while not delaying too long
2. **Streaming variant with shorter delays** - Users shouldn't wait 30s for a stream to start; max 5s delay, 2 retries
3. **Respect retry-after hints** - When API provides explicit wait time, use it instead of calculated backoff
4. **Non-retryable errors throw immediately** - 4xx errors (auth, validation) won't improve with retry

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error in parseInt call**
- **Found during:** Task 1 verification
- **Issue:** `parseInt(retryMatch[1], 10)` where `retryMatch[1]` could be undefined
- **Fix:** Changed to `retryMatch?.[1] ? parseInt(retryMatch[1], 10) : undefined`
- **Files modified:** app/lib/openai/errors.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 6e3f3a6 (amended into parallel task)

**2. [Rule 1 - Bug] Removed unused import**
- **Found during:** Task 2 verification
- **Issue:** `isRetryableError` imported but not used in retry.ts
- **Fix:** Removed unused import, using `parseOpenAIError` directly instead
- **Files modified:** app/lib/openai/retry.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 1917536 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** TypeScript compilation fixes. No scope creep.

## Issues Encountered

- Parallel plan execution (30-01, 30-03) was running simultaneously, which caused an amend to go to the wrong commit. No impact on final result - all files committed correctly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Retry utilities ready for integration into API routes (30-04)
- Error categorization can be used to provide user-friendly error messages
- withStreamRetry variant ready for generate/transcribe routes

---
*Phase: 30-capacity-rate-limiting*
*Completed: 2026-01-23*
