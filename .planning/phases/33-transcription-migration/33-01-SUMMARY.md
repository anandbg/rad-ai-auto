---
phase: 33-transcription-migration
plan: 01
subsystem: ai
tags: [groq, whisper, transcription, speech-to-text, medical-vocabulary]

requires:
  - phase: 32-text-generation-migration
    provides: AI config module with provider:model format and getTranscriptionConfig()
provides:
  - Groq Whisper v3 Turbo as default transcription provider (~89% cost reduction)
  - Medical vocabulary hints module for improved radiology term accuracy
  - Provider-branching transcribe route (Groq primary, OpenAI fallback)
affects: [34-cost-tracking-update]

tech-stack:
  added: []
  patterns: [provider-branching-whisper-api, vocabulary-hint-prompt-parameter]

key-files:
  created:
    - app/lib/ai/medical-vocabulary.ts
  modified:
    - app/app/api/transcribe/route.ts
    - app/lib/ai/config.ts

key-decisions:
  - "Groq Whisper API is OpenAI-compatible (same FormData, same response shape) -- no SDK changes needed"
  - "Medical vocabulary hint kept to 461 chars (under 500 char practical limit) with 40 radiology terms"
  - "Both providers receive vocabulary hints via prompt parameter for accuracy parity"

patterns-established:
  - "Provider branching: single route with if/else on transcriptionConfig.provider for multi-provider Whisper support"
  - "Vocabulary hints: RADIOLOGY_VOCABULARY_HINT constant passed as prompt parameter to all Whisper providers"

requirements-completed: [TRANS-01]

duration: 3min
completed: 2026-04-05
---

# Phase 33 Plan 01: Transcription Migration Summary

**Groq Whisper v3 Turbo as default transcription with 40-term medical vocabulary hints for 89% cost reduction**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T20:59:54Z
- **Completed:** 2026-04-05T21:03:12Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Switched default transcription from OpenAI Whisper ($0.36/hr) to Groq Whisper v3 Turbo ($0.04/hr)
- Created medical vocabulary hints module with 40 radiology terms (461 chars) for improved accuracy
- Provider-branching transcribe route supports Groq (default) and OpenAI (env-switchable fallback)
- API key validation dynamically checks GROQ_API_KEY or OPENAI_API_KEY based on configured provider

## Task Commits

Each task was committed atomically:

1. **Task 1: Create medical vocabulary hints and add Groq branch to transcribe route** - `5734f9e` (feat)
2. **Task 2: Verify end-to-end transcription configuration** - verification only, no file changes

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `app/lib/ai/medical-vocabulary.ts` - Exports RADIOLOGY_VOCABULARY_HINT with 40 radiology terms for Whisper prompt parameter
- `app/app/api/transcribe/route.ts` - Provider-branching transcription: Groq primary, OpenAI fallback, both with vocabulary hints
- `app/lib/ai/config.ts` - Default transcription model changed to groq:whisper-large-v3-turbo

## Decisions Made
- Groq Whisper API is OpenAI-compatible (same FormData format, same JSON response), so no SDK or response handling changes needed
- Medical vocabulary hint kept to 461 characters (40 terms) under the 500-char practical limit
- Both Groq and OpenAI paths receive vocabulary hints for accuracy parity regardless of provider
- Revert to OpenAI by setting AI_TRANSCRIPTION_MODEL=openai:whisper-1 (no code change needed)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in 2 unrelated files (react-resizable-panels missing types, quality-validation.ts undefined checks). Not caused by this plan's changes -- our 3 files compile cleanly.

## User Setup Required

None - no external service configuration required. GROQ_API_KEY should already be configured from Phase 31-32 work.

## Next Phase Readiness
- Transcription migration complete -- all AI operations now default to Groq
- Phase 34 (cost tracking update) can proceed to update hardcoded cost constants
- Full v3.0 cost optimization pipeline: text generation (Phase 32) + transcription (Phase 33) both on Groq

---
*Phase: 33-transcription-migration*
*Completed: 2026-04-05*
