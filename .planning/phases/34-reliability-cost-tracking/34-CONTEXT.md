# Phase 34: Reliability & Cost Tracking - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

System automatically falls back to OpenAI when Groq fails, and cost tracking reflects actual provider-specific token usage. This completes the v3.0 milestone by ensuring reliability and accurate cost monitoring across multiple providers.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key constraints from research:
- Existing cost tracker uses hardcoded estimates ($0.05/report, $0.06/transcription) — must be replaced with actual token counts
- AI SDK `streamText()` returns `usage` with `promptTokens` and `completionTokens` — use these for real cost calculation
- Groq costs ~$0.0007/report vs OpenAI ~$0.020/report — cost tracker needs per-provider pricing
- Existing cost ceiling in `app/lib/cost/ceiling.ts` needs threshold updates (costs 10x lower with Groq)
- Existing abuse detection in `app/lib/cost/detector.ts` is provider-agnostic — no changes needed
- Fallback: when Groq returns error, route to OpenAI GPT-4o for text and OpenAI Whisper for transcription
- Must handle higher costs during fallback (OpenAI is 30x more expensive than Groq)
- Research flagged Groq has had 30+ outages in 5 months — fallback is critical

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/lib/cost/tracker.ts` — existing cost tracking with COST_ESTIMATES (needs provider-aware update)
- `app/lib/cost/ceiling.ts` — daily cost ceiling with tiered degradation
- `app/lib/cost/detector.ts` — per-user abuse detection
- `app/lib/cost/retry.ts` — withRetry() and withStreamRetry() with exponential backoff
- `app/lib/ai/registry.ts` — provider registry with getModel()
- `app/lib/ai/config.ts` — getModelId(), getTranscriptionConfig()

### Integration Points
- All 4 AI routes (generate, transcribe, templates/generate, templates/suggest) — need fallback wiring
- `app/lib/cost/tracker.ts` — replace COST_ESTIMATES with actual token-based calculation
- `app/lib/cost/ceiling.ts` — lower thresholds for Groq pricing

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
