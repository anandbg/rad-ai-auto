---
phase: 34-reliability-cost-tracking
plan: 03
subsystem: transcription + cost-ceiling
tags: [reliability, cost-tracking, fallback, whisper, groq, openai]
requirements: [REL-01, COST-01]
dependency_graph:
  requires:
    - 34-01 (pricing module + trackCost transcription overload)
  provides:
    - Automatic Groq→OpenAI Whisper failover on /api/transcribe
    - Real duration-based transcription cost tracking
    - $5/day cost ceiling aligned to Groq baseline
  affects:
    - app/app/api/transcribe/route.ts
    - app/lib/cost/ceiling.ts
tech_stack:
  added: []
  patterns:
    - Helper-function extraction for dual-provider HTTP fetch
    - Independent withRetry budgets for primary vs fallback provider
    - Env var precedence (canonical → legacy) for backward-compatible rename
key_files:
  created:
    - app/lib/cost/ceiling.test.ts
  modified:
    - app/lib/cost/ceiling.ts
    - app/app/api/transcribe/route.ts
decisions:
  - "Daily ceiling lowered to $5: sweet spot that caps Groq-baseline at ~7k reports/day while tripping warning at ~250 OpenAI-fallback reports/day for clear operator signal"
  - "AI_DAILY_COST_CEILING is the new canonical env var; OPENAI_DAILY_COST_CEILING retained as fallback for zero-downtime migration"
  - "Fallback uses hardcoded openai:whisper-1 (not env-driven) to guarantee a known-good emergency provider even if config is broken"
  - "verbose_json request format used on both Groq and OpenAI Whisper endpoints so cost tracking uses real audio duration instead of wall-clock proxy"
  - "Independent retry budgets (3 for primary, 2 for fallback) limit worst-case latency while still giving transient failures a retry"
metrics:
  completed_date: "2026-04-06"
  duration_minutes: 12
  tasks_completed: 2
  commits: 4
  files_modified: 2
  files_created: 1
---

# Phase 34 Plan 03: Transcribe Fallback + $5 Daily Ceiling Summary

Automatic Groq→OpenAI Whisper failover on /api/transcribe, real audio-duration-based cost tracking via verbose_json, and daily cost ceiling realigned from $20 to $5 to match post-Groq economics.

## Objective Achieved

Completed Phase 34 reliability + cost-tracking work by adding automatic transcription provider failover (REL-01) and replacing wall-clock cost estimates with real audio duration (COST-01), then lowering the daily ceiling default from $20 (71x over-sized for Groq traffic) to $5, which still absorbs a legitimate OpenAI fallback day without false emergencies.

## What Changed

### Task 1: Daily cost ceiling $20 → $5 with env var rename
- `app/lib/cost/ceiling.ts`: `DEFAULT_DAILY_CEILING = 5` with rationale comment covering Groq text, OpenAI fallback, and Groq transcription economics
- `getDailyCeiling()` now checks `AI_DAILY_COST_CEILING` first, falling back to legacy `OPENAI_DAILY_COST_CEILING` for backward compatibility
- No changes to tier logic, message strings, or exported interface — behavior-preserving threshold change only
- `app/lib/cost/ceiling.test.ts` (new): 8 tests covering tier boundaries (normal/warning/degraded/emergency), free vs pro gating, env var override, and canonical-over-legacy precedence

### Task 2: Groq→OpenAI Whisper fallback + real duration tracking
- `app/app/api/transcribe/route.ts`:
  - Extracted `callWhisperAPI(provider, model, audioFile)` helper — dual-endpoint HTTP fetch with `response_format=verbose_json` to get the audio `duration` field
  - Replaced inline retry block with fallback-aware try/catch: primary via `withRetry({ maxRetries: 3 })` → on failure, log warn → OpenAI fallback via `withRetry({ maxRetries: 2 })`
  - Hardcoded `FALLBACK_PROVIDER = { provider: 'openai', model: 'whisper-1' }` so a broken config can't defeat the failover
  - Short-circuit: if primary provider IS already OpenAI, rethrow instead of double-tapping
  - Pre-flight key check now accepts either `GROQ_API_KEY` or `OPENAI_API_KEY`; only fails if neither is configured
  - `trackCost` now passes `{ transcription: { provider, model, durationSeconds } }` using the provider that actually served the request, so fallback-amplified costs (~9x) are accurately recorded
  - Audio duration preference: `result.duration` from verbose_json → wall-clock processingTime as fallback

## Verification

- 8 ceiling tests pass (`pnpm vitest run lib/cost/ceiling.test.ts`)
- 44 total cost tests pass (`pnpm vitest run lib/cost/`)
- TypeScript: zero new errors on modified files (pre-existing unrelated errors in `lib/ai/quality-validation.ts`, `lib/ai/fallback.test.ts`, and `templates/new/page.tsx` are out of scope)
- ESLint: clean (`pnpm eslint ./app/api/transcribe/route.ts --max-warnings=0`)
- All acceptance criteria grep checks pass (callWhisperAPI, verbose_json, whisper-1, `Primary…falling back`, `runtime = 'nodejs'`, `trackCost…transcription:`, POST export)

## Requirements Satisfied

- **REL-01** (automatic transcription fallback): /api/transcribe now fails over from Groq Whisper v3 Turbo to OpenAI Whisper-1 automatically after primary retries exhaust, with independent retry budget for the fallback attempt
- **COST-01** (real cost tracking): transcription costs now computed from actual audio duration × per-provider hourly rate, using the provider that actually served the request

Combined with Phase 34-02, all 4 AI routes (generate, templates/generate, templates/suggest, transcribe) now have automatic Groq→OpenAI failover and provider-aware cost tracking.

## Deviations from Plan

None - plan executed exactly as written. All tasks completed with specified behavior and acceptance criteria met.

## Deferred Items

**Vercel Workflow DevKit migration** (flagged by PostToolUse validation hook): logged in `.planning/phases/34-reliability-cost-tracking/deferred-items.md`. Replacing manual `withRetry` with Workflow DevKit steps is out of scope for 34-03 (plan explicitly forbids gateway/framework refactors in `docs_required`). It is a cross-cutting change that would affect all 4 AI routes and requires a dedicated planning phase. Suggested as a v3.1 follow-up after evaluating Workflow DevKit's streaming-SSE support for the generate route.

## Commits

| Hash | Message |
|------|---------|
| 823b177 | test(34-03): add failing tests for $5 daily cost ceiling and env var precedence |
| 36632be | feat(34-03): lower daily cost ceiling default to $5 and add AI_DAILY_COST_CEILING env var |
| f7c1b11 | feat(34-03): add Groq->OpenAI Whisper fallback and duration-based cost tracking |

## Known Stubs

None. All code paths are wired to live provider endpoints and real data flows.

## Self-Check: PASSED

- FOUND: app/lib/cost/ceiling.test.ts
- FOUND: app/lib/cost/ceiling.ts (modified — DEFAULT_DAILY_CEILING=5, AI_DAILY_COST_CEILING)
- FOUND: app/app/api/transcribe/route.ts (modified — callWhisperAPI, fallback, trackCost transcription)
- FOUND commit: 823b177
- FOUND commit: 36632be
- FOUND commit: f7c1b11
