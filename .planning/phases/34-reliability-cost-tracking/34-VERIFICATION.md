---
phase: 34-reliability-cost-tracking
verified: 2026-04-05T21:27:00Z
status: passed
score: 3/3 must-haves verified
re_verification: null
---

# Phase 34: Reliability & Cost Tracking Verification Report

**Phase Goal:** System automatically falls back to OpenAI when Groq fails, and cost tracking reflects actual provider-specific token usage
**Verified:** 2026-04-05T21:27:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| - | ----- | ------ | -------- |
| 1 | Groq failures transparently route to OpenAI GPT-4o (generate/templates) and OpenAI Whisper-1 (transcribe) with no user action | VERIFIED | `withProviderFallback` wired in generate/route.ts:309, templates/generate/route.ts:324, templates/suggest/route.ts:280; transcribe/route.ts:389-434 implements inline Groq→OpenAI Whisper fallback with independent retry budgets |
| 2 | Cost tracking uses actual token counts from provider responses (not hardcoded estimates), with per-provider rates | VERIFIED | `trackCost` in tracker.ts accepts `{ usage }` and `{ transcription }` shapes; pricing.ts has provider-keyed PROVIDER_PRICING table (Groq + OpenAI text + transcription rates); generate/route.ts:339-350 resolves real `result.usage` from AI SDK stream and tracks against the served provider; transcribe/route.ts:454-460 tracks using `servedBy` provider + actual audio duration |
| 3 | Daily cost ceiling & abuse detection work with multi-provider cost structure incl. higher fallback cost | VERIFIED | ceiling.ts honors `AI_DAILY_COST_CEILING` (with legacy `OPENAI_DAILY_COST_CEILING` fallback), $5/day default calibrated for Groq+OpenAI mix per comments; fallback calls use `usedModelId` from `withProviderFallback` so ~30x OpenAI rate is recorded accurately; transcribe keeps existing `checkAbusePattern` call (line 244) upstream of provider selection so abuse detection remains provider-agnostic |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `app/lib/ai/fallback.ts` | withProviderFallback orchestrator | VERIFIED | 102 lines, FALLBACK_CHAIN const, primary==fallback short-circuit, returns `{result, modelId, fellBack}` |
| `app/lib/cost/pricing.ts` | Provider-aware pricing module | VERIFIED | PROVIDER_PRICING table for text+transcription; computeCost / computeTranscriptionCost; safe fallback to GPT-4o rates on unknown models (over-estimate bias) |
| `app/lib/cost/tracker.ts` | Usage-based trackCost | VERIFIED | TrackCostArg union supports `{usage}` and `{transcription}`; resolveCost delegates to pricing module; backward compatible with legacy number/estimate forms |
| `app/lib/cost/ceiling.ts` | AI_DAILY_COST_CEILING env var | VERIFIED | getDailyCeiling reads AI_DAILY_COST_CEILING with legacy OPENAI fallback; $5 default for v3.0 Groq economics |
| `app/app/api/generate/route.ts` | Uses withProviderFallback | VERIFIED | Wired at line 309, tracks `result.usage` via Promise.resolve with provider from getProviderFromModelId |
| `app/app/api/templates/generate/route.ts` | Uses withProviderFallback | VERIFIED | Wired at line 324, trackCost with usage at line 356 |
| `app/app/api/templates/suggest/route.ts` | Uses withProviderFallback | VERIFIED | Wired at line 280 |
| `app/app/api/transcribe/route.ts` | Groq→OpenAI Whisper fallback | VERIFIED | Inline fallback (uses Whisper REST not AI SDK language model); FALLBACK_PROVIDER const, independent retry budgets, cost tracked with servedBy provider + real audio duration |

### Key Link Verification

| From | To | Via | Status |
| ---- | -- | --- | ------ |
| generate/route.ts | fallback.ts | `import { withProviderFallback }` + call at :309 | WIRED |
| templates/generate/route.ts | fallback.ts | import + call at :324 | WIRED |
| templates/suggest/route.ts | fallback.ts | import + call at :280 | WIRED |
| generate/route.ts | pricing.ts | `getProviderFromModelId(usedModelId)` → trackCost `{usage}` | WIRED |
| transcribe/route.ts | pricing.ts | trackCost `{transcription}` with servedBy | WIRED |
| tracker.ts | pricing.ts | imports computeCost, computeTranscriptionCost | WIRED |
| ceiling.ts | tracker.ts | getCurrentDailyCost | WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real Data | Status |
| -------- | ---- | ------ | --------- | ------ |
| generate/route.ts trackCost | usage.inputTokens/outputTokens | AI SDK `result.usage` Promise from streamText | Yes (resolved from stream end) | FLOWING |
| transcribe/route.ts trackCost | durationSeconds | Whisper verbose_json `result.duration` with wall-clock fallback | Yes | FLOWING |
| ceiling.ts checkCostCeiling | currentCost | Redis INCRBY from trackCost | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Unit tests for fallback, pricing, tracker, ceiling | `pnpm exec vitest run lib/ai/fallback.test.ts lib/cost/*.test.ts` | 50 passed / 50 | PASS |

### Requirements Coverage

| Requirement | Description | Status | Evidence |
| ----------- | ----------- | ------ | -------- |
| REL-01 | Automatic Groq→OpenAI fallback across text + transcription | SATISFIED | withProviderFallback utility + transcribe inline fallback, covered by fallback.test.ts (6 tests) |
| COST-01 | Provider-aware cost tracking using actual usage | SATISFIED | pricing.ts PROVIDER_PRICING + trackCost `{usage}`/`{transcription}` shapes, fallback cost recorded against served provider; 36 tests across pricing/tracker/ceiling |

### Anti-Patterns Found

None. No TODO/FIXME/placeholder markers in the four core modules. Legacy COST_ESTIMATES retained intentionally in tracker.ts for backward compat, documented as "safe over-estimate" for un-migrated callers.

### Human Verification Required

None for automated verification scope. Recommended human smoke-test (optional, not blocking):
- Force Groq failure (invalid GROQ_API_KEY) in dev and confirm generate/transcribe still serve requests via OpenAI; observe warning logs `Primary ... failed, falling back to ...`.

### Gaps Summary

None. All three success criteria are implemented, wired, and covered by passing unit tests. Fallback orchestration is consistent across text routes via the shared utility, and the transcription route implements an equivalent inline pattern necessitated by the Whisper REST API not being a LanguageModel. Cost tracking uses real tokens from the AI SDK stream and real audio duration from Whisper verbose_json, with the provider that actually served the request — so fallback cost amplification is honestly recorded against the daily ceiling.

---

_Verified: 2026-04-05T21:27:00Z_
_Verifier: Claude (gsd-verifier)_
