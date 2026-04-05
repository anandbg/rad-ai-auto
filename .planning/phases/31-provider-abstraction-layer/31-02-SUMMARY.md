---
phase: 31-provider-abstraction-layer
plan: 02
subsystem: api
tags: [ai-sdk, provider-registry, openai, abstraction-layer]

# Dependency graph
requires:
  - phase: 31-provider-abstraction-layer (plan 01)
    provides: "getModel(), getTranscriptionConfig(), AI config module, provider registry"
provides:
  - "Route handlers wired to provider registry -- model switching via env vars only"
  - "Transcribe route with provider-aware config plumbing for Phase 33"
affects: [32-groq-integration, 33-transcription-migration, 34-quality-validation]

# Tech tracking
tech-stack:
  added: []
  patterns: ["getModel(purpose) replaces direct openai() calls in routes", "getTranscriptionConfig() for provider-aware transcription"]

key-files:
  created: []
  modified:
    - app/app/api/generate/route.ts
    - app/app/api/templates/generate/route.ts
    - app/app/api/transcribe/route.ts

key-decisions:
  - "Kept OpenAI Whisper fetch logic unchanged in transcribe route -- only added config plumbing for Phase 33 branching"
  - "Removed inline OPENAI_API_KEY checks from generate/template routes since registry validates on module load"

patterns-established:
  - "Route handlers import getModel(purpose) from @/lib/ai/registry instead of openai() from @ai-sdk/openai"
  - "Transcription routes call getTranscriptionConfig() and validate API keys per configured provider"

requirements-completed: [INFRA-01, INFRA-02]

# Metrics
duration: 3min
completed: 2026-04-05
---

# Phase 31 Plan 02: Route Handler Migration Summary

**All three AI route handlers now use provider registry abstraction -- model switching requires only env var changes, zero code edits**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T19:44:10Z
- **Completed:** 2026-04-05T19:46:41Z
- **Tasks:** 3 (2 implementation + 1 verification)
- **Files modified:** 3

## Accomplishments
- Generate route uses getModel('generate') instead of openai('gpt-4o') -- model switchable via AI_GENERATE_MODEL env var
- Template generate route uses getModel('template') instead of openai('gpt-4o') -- model switchable via AI_TEMPLATE_MODEL env var
- Transcribe route reads provider config via getTranscriptionConfig() with provider-aware API key validation
- Removed 3 inline OPENAI_API_KEY check blocks (registry handles validation at module load)
- Zero behavior change confirmed -- all routes default to OpenAI when no env vars set

## Task Commits

Each task was committed atomically:

1. **Task 1: Update generate and template routes to use getModel()** - `2a07998` (feat)
2. **Task 2: Update transcribe route with provider config awareness** - `74378cc` (feat)
3. **Task 3: Regression verification** - no commit (verification-only, no file changes)

## Files Created/Modified
- `app/app/api/generate/route.ts` - Replaced openai('gpt-4o') with getModel('generate'), removed OPENAI_API_KEY check
- `app/app/api/templates/generate/route.ts` - Replaced openai('gpt-4o') with getModel('template'), removed OPENAI_API_KEY check
- `app/app/api/transcribe/route.ts` - Added getTranscriptionConfig import, provider-aware API key check, extension point comment

## Decisions Made
- Kept OpenAI Whisper fetch logic completely unchanged -- only added config reading. Actual provider branching deferred to Phase 33.
- Removed inline OPENAI_API_KEY checks from generate and template routes since the registry module validates config on load and fails fast in production.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing build failure due to missing `react-resizable-panels` dependency in `templates/new/page.tsx` -- unrelated to this plan's changes. TypeScript compilation of our three route files passes cleanly.

## Known Stubs

None -- all routes are fully wired to the provider registry with no placeholder data.

## User Setup Required

None - no external service configuration required. Existing OPENAI_API_KEY continues to work. New env vars (AI_GENERATE_MODEL, AI_TEMPLATE_MODEL, AI_TRANSCRIPTION_MODEL) are optional and default to OpenAI.

## Next Phase Readiness
- Phase 32 (Groq integration) can add `createGroq` to the registry and set AI_GENERATE_MODEL=groq:llama-4-scout to switch models
- Phase 33 (transcription migration) can branch on `transcriptionConfig.provider` in the transcribe route
- All three route files are abstracted and ready for multi-provider support

---
*Phase: 31-provider-abstraction-layer*
*Completed: 2026-04-05*
