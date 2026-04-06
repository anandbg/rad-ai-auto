---
phase: 34-reliability-cost-tracking
plan: 02
subsystem: api
tags: [ai-sdk, groq, openai, fallback, reliability, cost-tracking, vercel-edge]

requires:
  - phase: 34-reliability-cost-tracking
    provides: provider-aware pricing module (pricing.ts) and usage-based trackCost overload (tracker.ts) from plan 34-01
provides:
  - withProviderFallback() orchestrator that transparently fails over from Groq to OpenAI GPT-4o on any error
  - Real-token-based cost tracking in /api/generate and /api/templates/generate using AI SDK v6 usage fields
  - FALLBACK_CHAIN constant mapping each AI purpose to its emergency fallback model id
affects:
  - 34-03 transcribe fallback (parallel plan, used same fallback pattern)
  - any future phase adding new text-generation routes (use withProviderFallback + getProviderFromModelId)

tech-stack:
  added: []
  patterns:
    - "Provider fallback layered OUTSIDE retry: withProviderFallback(purpose, async (model, modelId) => withRetry(streamText({model,...})))"
    - "Cost tracking reads real AI SDK v6 usage (inputTokens/outputTokens), mapped through getProviderFromModelId to the actual provider that served the request"
    - "Fallback no-op when primary id equals fallback id (avoids double-charging when user configures openai:gpt-4o as primary)"

key-files:
  created:
    - app/lib/ai/fallback.ts
    - app/lib/ai/fallback.test.ts
  modified:
    - app/app/api/generate/route.ts
    - app/app/api/templates/generate/route.ts
    - app/app/api/templates/suggest/route.ts

key-decisions:
  - "withProviderFallback is a pure orchestrator — no retry logic inside; retry stays in lib/openai/retry.ts and wraps each provider attempt. Fallback = 'after retries exhausted on provider A, try provider B once'."
  - "On both-providers-fail, throw the FALLBACK error (not the primary) because that is the last-observed state of the system and matches what users experienced."
  - "Cost tracking uses AI SDK v6 usage field names (inputTokens/outputTokens), mapped to TextUsage.promptTokens/completionTokens at the call site."
  - "templates/suggest fallback added WITHOUT cost tracking — keeping parity with current behavior (suggest was not tracked before); cost-tracking for suggest is out of scope for 34-02."

patterns-established:
  - "Fallback wraps retry: outer withProviderFallback, inner withRetry/withStreamRetry per attempt"
  - "Track cost only once the provider that served the request is known (via fellBack flag + modelId return value)"
  - "Use Promise.resolve() to adapt AI SDK PromiseLike<Usage> to real Promise when chaining cost tracking"

requirements-completed:
  - REL-01
  - COST-01

duration: ~8 min
completed: 2026-04-06
---

# Phase 34 Plan 02: Provider Fallback and Real-Token Cost Tracking Summary

**Groq→OpenAI GPT-4o fallback wrapper (withProviderFallback) wired into /api/generate, /api/templates/generate, /api/templates/suggest with real AI-SDK-v6 token usage feeding per-provider cost tracking.**

## Performance

- **Duration:** ~8 minutes
- **Tasks:** 3
- **Files created:** 2
- **Files modified:** 3

## Accomplishments

- New `app/lib/ai/fallback.ts` module with `withProviderFallback(purpose, operation)` orchestrator and `FALLBACK_CHAIN` constant
- 6 unit tests covering happy path, fallback path, both-fail path, primary==fallback short-circuit, and call-count invariants
- `/api/generate` now transparently fails over from Groq Llama 4 Scout to OpenAI GPT-4o when Groq errors, and tracks cost from real SSE-stream token usage (`result.usage` resolves when stream ends)
- `/api/templates/generate` fails over with identical semantics and tracks cost from the resolved `generateText` usage field
- `/api/templates/suggest` fails over (no cost tracking — preserves pre-existing behavior)
- Happy-path behavior unchanged across all three routes: same SSE/stream shape, same headers, same latency

## Task Commits

1. **Task 1 (RED): failing fallback tests** — `268d38a` (test)
2. **Task 1 (GREEN): withProviderFallback implementation** — `e51a87b` (feat)
3. **Task 2: wire fallback + real-token cost into /api/generate** — `4e05706` (feat)
4. **Task 3: wire fallback into template routes (generate + suggest)** — `ef751ed` (feat)

## Files Created/Modified

- `app/lib/ai/fallback.ts` (created) — `withProviderFallback` orchestrator, `FALLBACK_CHAIN` constant, `FallbackResult<T>` interface
- `app/lib/ai/fallback.test.ts` (created) — 6 unit tests with hoisted mocks for `./config`, `./registry`, `@/lib/logging/logger`
- `app/app/api/generate/route.ts` (modified) — replaced `withStreamRetry(streamText(...))` with `withProviderFallback('generate', (model, modelId) => withStreamRetry(streamText(...)))`; swapped legacy `trackCost('report', user.id)` for usage-aware `trackCost('report', user.id, { usage: { provider, model, promptTokens, completionTokens } })` driven by `result.usage.then(...)`
- `app/app/api/templates/generate/route.ts` (modified) — analogous fallback wrap around `withRetry(generateText(...))`; real-token cost tracking from `result.usage?.inputTokens/outputTokens`
- `app/app/api/templates/suggest/route.ts` (modified) — fallback wrap around `streamText(...)`; no cost tracking (parity with pre-existing behavior)

## Decisions Made

- **AI SDK v6 field names:** AI SDK v5+ renamed `promptTokens`/`completionTokens` to `inputTokens`/`outputTokens` at the `LanguageModelUsage` boundary. Verified by inspecting `node_modules/ai/dist/index.d.ts`. We map v6 field names to our internal `TextUsage` interface (which kept the legacy names from plan 34-01's pricing module) at each call site.
- **`result.usage` is `PromiseLike`, not `Promise`:** In AI SDK v6 `streamText`, `result.usage` is typed `PromiseLike<LanguageModelUsage>`. Chaining `.catch()` on it fails type-checking, so we use `Promise.resolve(result.usage).then(...).catch(...)` to adapt it. `generateText` (non-streaming) returns a resolved `result.usage` field directly.
- **Fallback wraps retry, not the other way around:** preserves the existing retry behavior (exponential backoff per provider) and only escalates to the secondary provider once the primary's retry budget is exhausted. Keeps `lib/openai/retry.ts` untouched.
- **`templates/suggest` cost tracking unchanged:** the pre-existing route did not track cost on the suggest path; adding it here would be scope creep. Can be added in a future plan if needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.hoisted required for mock closures**
- **Found during:** Task 1 (first test run after GREEN implementation)
- **Issue:** Vitest hoists `vi.mock` factories above top-level imports; the factories closed over `const warnMock = vi.fn()` declared below them, yielding `ReferenceError: Cannot access 'warnMock' before initialization`.
- **Fix:** Wrapped all shared mock fns in `vi.hoisted(() => ({ ... }))` so they are declared before the hoisted mock factories.
- **Files modified:** `app/lib/ai/fallback.test.ts`
- **Verification:** 6/6 tests pass after the fix
- **Committed in:** `e51a87b` (bundled with GREEN implementation)

**2. [Rule 1 - Bug] AI SDK v6 token field names differ from plan snippet**
- **Found during:** Task 2 typecheck
- **Issue:** Plan referenced `usage.promptTokens` / `usage.completionTokens`, but AI SDK v6.0.39 exposes `LanguageModelUsage` as `{ inputTokens, outputTokens, ... }` (confirmed from `node_modules/ai/dist/index.d.ts`). Using the old names would have compiled but read `undefined`, silently zeroing all tracked cost during a Groq→OpenAI fallback (breaking COST-01).
- **Fix:** Read `usage.inputTokens` / `usage.outputTokens` and map them to our `TextUsage.promptTokens` / `completionTokens` fields at each call site.
- **Files modified:** `app/app/api/generate/route.ts`, `app/app/api/templates/generate/route.ts`
- **Verification:** `pnpm tsc --noEmit` clean across all three routes; existing `lib/cost/` tests still pass.
- **Committed in:** `4e05706`, `ef751ed`

**3. [Rule 3 - Blocking] `result.usage` is `PromiseLike` not `Promise`**
- **Found during:** Task 2 typecheck
- **Issue:** AI SDK v6 types `streamText` result `usage` as `PromiseLike<LanguageModelUsage>`, so `.catch()` is not available and the compiler errors with `TS2339: Property 'catch' does not exist on type 'PromiseLike<void>'`.
- **Fix:** Wrapped the access in `Promise.resolve(result.usage).then(...).catch(...)` to adapt to a real Promise chain. Added explicit `err: unknown` annotation to satisfy `noImplicitAny`.
- **Files modified:** `app/app/api/generate/route.ts`
- **Verification:** `pnpm tsc --noEmit` clean
- **Committed in:** `4e05706`

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All three fixes were necessary for correctness. Plan snippets were valid blueprints but had to be reconciled with the actual AI SDK v6 type surface and Vitest's hoisting semantics. No scope creep.

## Issues Encountered

- Several vercel-plugin post-tool-use hooks recommended migrating to Vercel AI Gateway (`ai-gateway` skill) and Vercel Workflow DevKit (`workflow` skill) for routing/retries. Both are out of scope for plan 34-02 (which adds a fallback layer around the existing `lib/ai/registry.ts` + `lib/openai/retry.ts`) and are logged to `.planning/phases/34-reliability-cost-tracking/deferred-items.md` for consideration in a future phase.
- Hooks also RECOMMENDED replacing `openai:gpt-4o` with a hypothetical `openai/gpt-5.4` model id. No such model is present in our `PROVIDER_PRICING` table (from plan 34-01) and the plan explicitly specifies `openai:gpt-4o` as the fallback — the recommendation was not applied.
- Pre-existing ERRORs on `process.env.OPENAI_API_KEY` checks in `templates/suggest/route.ts` (lines 249-250) are unrelated to this plan's scope and left untouched per the SCOPE BOUNDARY rule.

## Auth Gates

None.

## Known Stubs

None.

## Verification

- `cd app && pnpm vitest run lib/ai/fallback.test.ts lib/cost/` → 50/50 pass (6 new fallback + existing cost suite)
- `cd app && pnpm tsc --noEmit` → zero errors across `lib/ai/fallback.ts`, `lib/ai/fallback.test.ts`, `api/generate/route.ts`, `api/templates/generate/route.ts`, `api/templates/suggest/route.ts` (pre-existing unrelated errors in `react-resizable-panels`, `api/transcribe`, `lib/ai/quality-validation.ts` remain out of scope)
- `cd app && pnpm eslint app/api/generate/route.ts app/api/templates/generate/route.ts app/api/templates/suggest/route.ts --max-warnings=0` → clean
- Grep acceptance criteria all met:
  - `withProviderFallback` present in all 3 routes + fallback.ts
  - `result.usage` present in generate route
  - `getProviderFromModelId` present in generate + templates/generate routes
  - `trackCost(...usage:...)` multiline match present in generate + templates/generate routes
  - `runtime = 'edge'` and `maxDuration = 30` preserved

## Self-Check: PASSED

All 5 claimed files verified to exist on disk; all 4 claimed commit hashes (`268d38a`, `e51a87b`, `4e05706`, `ef751ed`) verified present in `git log --oneline --all`.

## Next Phase Readiness

- Plan 34-02 fully complete. Plan 34-03 (transcribe fallback + cost ceiling integration) was executed in parallel and is also complete, which means phase 34 as a whole is ready for verification and roll-up.
- REL-01 is now fully satisfied for all four AI routes (generate, templates/generate, templates/suggest, transcribe). COST-01 is fully satisfied for text generation + templates; transcribe cost tracking handled by 34-03.
- No outstanding blockers for downstream phases.

---
*Phase: 34-reliability-cost-tracking*
*Completed: 2026-04-06*
