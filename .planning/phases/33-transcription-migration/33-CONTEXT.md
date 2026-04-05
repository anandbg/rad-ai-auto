# Phase 33: Transcription Migration - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure-like — backend provider swap)

<domain>
## Phase Boundary

Voice transcription switches from OpenAI Whisper to Groq Whisper v3 Turbo at ~89% lower cost. Medical vocabulary hints improve accuracy for radiology terminology. The transcribe route already has provider-aware config detection from Phase 31.

</domain>

<decisions>
## Implementation Decisions

### Provider Configuration
- Use Groq Whisper v3 Turbo (`whisper-large-v3-turbo`) via Groq's OpenAI-compatible transcription API
- Set env vars: `AI_TRANSCRIPTION_PROVIDER=groq`, `AI_TRANSCRIPTION_MODEL=whisper-large-v3-turbo`
- Phase 31 config.ts already supports transcription provider env vars

### Medical Vocabulary Hints
- Use Whisper API `prompt` parameter to pass medical vocabulary hints
- Include common radiology terms: pneumothorax, T2-weighted, FLAIR sequence, dexamethasone, etc.
- Vocabulary hint list stored alongside transcription config (not hardcoded in route)

### API Integration
- Groq's transcription API is OpenAI-compatible (same FormData format, same response shape)
- Same audio file upload pattern, same supported formats (mp3, mp4, mpeg, mpga, m4a, wav, webm)
- Current `fetch()` to OpenAI URL switches to Groq URL based on provider config

### Claude's Discretion
- Exact vocabulary hint list (representative radiology terms)
- Error handling for Groq-specific error codes
- Whether to use `@ai-sdk/groq` transcription or direct fetch (Groq's transcription is REST, not streaming)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/lib/ai/config.ts` — getTranscriptionConfig() already exists from Phase 31
- `app/app/api/transcribe/route.ts` — already has provider-aware detection from Phase 31
- Existing retry logic: withRetry() in lib/cost/retry.ts

### Integration Points
- `app/app/api/transcribe/route.ts` — main transcription route (currently OpenAI Whisper via fetch)
- `app/lib/ai/config.ts` — transcription config with provider/model/URL resolution

</code_context>

<specifics>
## Specific Ideas

- Research found Groq Whisper v3 Turbo at $0.04/hr (vs OpenAI $0.36/hr) — 89% cheaper
- Research flagged "dexamethasone taper" mis-transcribed 37% of the time — vocabulary hints essential
- Groq's Whisper API is REST-based (not streaming) — same as current OpenAI Whisper usage

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
