---
phase: 34-reliability-cost-tracking
plan: 01
subsystem: infra
tags: [cost-tracking, pricing, groq, openai, vitest, tdd, redis]

requires:
  - phase: 32-llm-migration
    provides: provider:model env format and getModelId() in lib/ai/config
  - phase: 33-transcription-migration
    provides: Groq Whisper v3 Turbo as default transcription provider
provides:
  - Provider-aware pricing table (PROVIDER_PRICING) for Groq + OpenAI text and transcription
  - Pure computeCost / computeTranscriptionCost functions (no I/O, trivially testable)
  - Backward-compatible trackCost overloads accepting { usage } or { transcription } objects
  - Safe fallback to openai:gpt-4o rates for unknown providers (never throws)
affects: [34-02, 34-03, future-billing, cost-ceiling, rate-limiting]

tech-stack:
  added: [@vitejs/plugin-react, jsdom@24, @testing-library/react, @testing-library/jest-dom]
  patterns: [pure-function-pricing, backward-compatible-overload-union, redis-cents-storage]

key-files:
  created:
    - app/lib/cost/pricing.ts
    - app/lib/cost/pricing.test.ts
    - app/lib/cost/tracker.test.ts
    - .planning/phases/34-reliability-cost-tracking/deferred-items.md
  modified:
    - app/lib/cost/tracker.ts
    - app/package.json
    - app/pnpm-lock.yaml

key-decisions:
  - "Unknown provider/model falls back to openai:gpt-4o rates (most expensive in stack) — safe over-estimate ensures cost ceiling still triggers"
  - "trackCost signature is union of legacy number | { actualCost } | { usage } | { transcription } — zero route-file edits required"
  - "Pricing functions are pure (no Redis, no async) to make them trivially testable and safe to call on every request"
  - "Cost stored in Redis as integer cents (Math.round(dollars * 100)) for INCRBY precision"

patterns-established:
  - "Pure pricing module: all cost math lives in lib/cost/pricing.ts, tracker.ts only handles Redis I/O"
  - "Backward-compatible overload union: extend trackCost without editing call sites"
  - "Never-throws contract: cost tracking logs and returns on any failure so request flow is never broken"

requirements-completed: [COST-01]

duration: 94min
completed: 2026-04-06
---

# Phase 34 Plan 01: Provider-Aware Cost Tracking Foundation Summary

**Provider-aware cost pricing module with pure computeCost/computeTranscriptionCost functions and backward-compatible trackCost overloads accepting real token counts from AI SDK usage objects.**

## Performance

- **Duration:** ~94 min
- **Started:** 2026-04-06T04:50:08Z
- **Completed:** 2026-04-06T06:24:32Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 7 (4 created, 3 modified)

## Accomplishments

- Replaced hardcoded $0.05/report estimate (71x wrong for Groq) with real provider:model lookup
- `computeCost` computes accurate dollar cost for Groq Llama 4 Scout (~$0.000335 for 1500+500 tokens) and OpenAI GPT-4o (~$0.00875 for same)
- `computeTranscriptionCost` handles both Groq Whisper v3 Turbo ($0.04/hr) and OpenAI Whisper-1 ($0.36/hr)
- `trackCost` extended with 3 new argument shapes while all 3 existing route call sites continue to work unmodified
- Full TDD discipline: 36 unit tests across pricing + tracker, all passing
- Foundation ready for plans 34-02 (route integration) and 34-03 (cost ceiling + abuse detection)

## Task Commits

Each task followed RED → GREEN TDD flow with atomic commits:

0. **Chore: vitest devDeps** — `9109c7a` (chore) — unblocked pre-existing broken test infra
1. **Task 1 RED: failing pricing tests** — `9418865` (test)
2. **Task 1 GREEN: pricing module** — `150bc7c` (feat)
3. **Task 2 RED: failing tracker tests** — `2279536` (test)
4. **Task 2 GREEN: tracker overloads** — `68e5b10` (feat)

**Plan metadata commit:** (pending — includes SUMMARY, STATE, ROADMAP)

## Files Created/Modified

- `app/lib/cost/pricing.ts` (new) — PROVIDER_PRICING table, computeCost, computeTranscriptionCost, getProviderFromModelId
- `app/lib/cost/pricing.test.ts` (new) — 19 unit tests covering all pricing behaviors + fallback
- `app/lib/cost/tracker.test.ts` (new) — 17 unit tests covering legacy + new overloads + redis failure modes
- `app/lib/cost/tracker.ts` (modified) — Added TrackCostArg union, resolveCost helper, provider:model debug logging; preserved legacy signature
- `app/package.json` + `app/pnpm-lock.yaml` (modified) — added @vitejs/plugin-react, jsdom@24, @testing-library/react, @testing-library/jest-dom
- `.planning/phases/34-reliability-cost-tracking/deferred-items.md` (new) — tracks pre-existing type errors out of scope for this plan

## Decisions Made

- **Safe over-estimate fallback:** Unknown provider/model falls back to `openai:gpt-4o` rates because GPT-4o is the most expensive model in the stack. If we must guess we should guess high so the daily cost ceiling still triggers on unknown traffic rather than under-counting silently.
- **Never throw:** Cost tracking must never break the request flow. `computeCost` returns fallback values, `trackCost` catches all errors.
- **Pure functions for pricing:** `lib/cost/pricing.ts` has zero I/O so it can be trivially unit-tested without mocking Redis or AI SDK.
- **Legacy 2-arg signature preserved:** All 3 existing callers (`generate/route.ts`, `transcribe/route.ts`, `templates/generate/route.ts`) call `trackCost(type, userId)` today. Keeping that signature working means plan 34-01 ships without editing any route file.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing vitest devDependencies**
- **Found during:** Task 1 (first test run)
- **Issue:** `vitest.config.ts` imports `@vitejs/plugin-react` and `tests/setup.ts` imports `@testing-library/react` + `@testing-library/jest-dom`, but none were in `package.json`. The test runner crashed before running any tests — a pre-existing broken state that would have blocked all unit testing for this plan.
- **Fix:** `pnpm add -D @vitejs/plugin-react jsdom@24 @testing-library/react @testing-library/jest-dom`. Used `jsdom@24` instead of `29` because `jsdom@29` triggers a top-level-await / CJS interop bug with `vitest@1.6.x`.
- **Files modified:** `app/package.json`, `app/pnpm-lock.yaml`
- **Verification:** `pnpm vitest run lib/cost/` runs and all 36 tests pass.
- **Committed in:** `9109c7a` (separate chore commit before any test/feat work)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Necessary unblock; does not change plan scope. Future cost/reliability work in 34-02/34-03 now has working unit tests.

## Issues Encountered

- **jsdom 29 incompatible with vitest 1.6:** First install of latest `jsdom` produced `Error: require() cannot be used on an ESM graph with top-level await`. Downgraded to `jsdom@24.1.3` which resolved cleanly.
- **Pre-existing type errors (out of scope):** `pnpm tsc --noEmit` reports errors in `app/(protected)/templates/new/page.tsx` (missing `react-resizable-panels` package) and `lib/ai/quality-validation.ts` (strict-null index access). Both exist on master before 34-01 and are untouched by this plan. Logged to `deferred-items.md` per scope boundary rule.

## Verification

- `cd app && pnpm vitest run lib/cost/` — **36 passed (19 pricing + 17 tracker)**
- `cd app && pnpm tsc --noEmit` — lib/cost/ clean (pre-existing errors elsewhere, out of scope)
- All 3 route call sites (`generate`, `transcribe`, `templates/generate`) still use the legacy 2-arg form and continue to compile against the new signature

## Next Phase Readiness

- **Plan 34-02 is unblocked:** Route handlers can now migrate to the new signature. For example:
  ```typescript
  const result = streamText({ model: getModel('generate'), ... });
  // ...after stream completes:
  const usage = await result.usage;
  const { provider, model } = getProviderFromModelId(getModelId('generate'));
  await trackCost('report', user.id, {
    usage: { provider, model, promptTokens: usage.promptTokens, completionTokens: usage.completionTokens }
  });
  ```
- **Plan 34-03 (cost ceiling + abuse detection)** can consume the now-accurate daily cost counter from `getCurrentDailyCost()`.
- **No blockers.** Test infrastructure is now working, opening the door to TDD on all future cost/reliability work in this phase.

## Self-Check: PASSED

Verified files exist on disk:
- `app/lib/cost/pricing.ts` — FOUND
- `app/lib/cost/pricing.test.ts` — FOUND
- `app/lib/cost/tracker.test.ts` — FOUND
- `app/lib/cost/tracker.ts` — FOUND (modified)

Verified commits exist in `git log`:
- `9109c7a` chore devDeps — FOUND
- `9418865` test RED pricing — FOUND
- `150bc7c` feat pricing — FOUND
- `2279536` test RED tracker — FOUND
- `68e5b10` feat tracker — FOUND

All acceptance criteria satisfied:
- PROVIDER_PRICING, inputPerMillion, openai:whisper-1, groq:whisper-large-v3-turbo all grep-present in pricing.ts
- tracker.ts imports computeCost from ./pricing
- TrackCostArg type exported
- 36 tests pass
- Legacy 2-arg + 3rd-arg-number call sites still work

---
*Phase: 34-reliability-cost-tracking*
*Completed: 2026-04-06*
