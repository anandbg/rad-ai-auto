# Phase 31: Provider Abstraction Layer - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

AI model selection is decoupled from route handlers, configurable via environment variables. This is a pure refactoring phase with zero behavior change — OpenAI remains the active provider, but the code is restructured so swapping providers requires only env var changes.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key constraints from research:
- Project already has `ai@^6.0.39` (Vercel AI SDK v6)
- Use `createProviderRegistry` from AI SDK for provider abstraction
- Only 3 new packages needed: `@ai-sdk/gateway`, `@ai-sdk/groq`, `@ai-sdk/openai-compatible`
- Existing route handlers use `streamText()` from AI SDK with `openai('gpt-4o')` directly
- Transcription uses direct `fetch()` to OpenAI Whisper API (not AI SDK)
- Must maintain SSE streaming behavior
- Environment variables: AI_PROVIDER, AI_MODEL, TRANSCRIPTION_PROVIDER, TRANSCRIPTION_MODEL

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ai` package v6.0.39 already installed
- `@ai-sdk/openai` provider already configured
- `streamText()` used in route handlers for report generation
- `withStreamRetry` and `withRetry` utilities in `app/lib/cost/retry.ts`

### Established Patterns
- API routes in `app/app/api/` (generate, transcribe, templates/generate)
- Protection stack: rate limit → cost ceiling → abuse detection → business logic
- Environment variables loaded via `process.env`

### Integration Points
- `app/app/api/generate/route.ts` — Report generation (GPT-4o streaming)
- `app/app/api/transcribe/route.ts` — Voice transcription (Whisper API)
- `app/app/api/templates/generate/route.ts` — AI template suggestions
- `app/lib/cost/tracker.ts` — Cost tracking with hardcoded estimates

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
