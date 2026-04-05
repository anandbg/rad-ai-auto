---
phase: 32-llm-migration-quality-validation
plan: 01
subsystem: ai
tags: [groq, ai-sdk, llama-4, provider-registry]

# Dependency graph
requires:
  - phase: 31-provider-abstraction-layer
    provides: Provider registry with createProviderRegistry and env-driven model resolution
provides:
  - Groq provider registered in AI SDK registry
  - AI_GENERATE_MODEL=groq:* routes through Groq when set
  - AI_TEMPLATE_MODEL=groq:* routes through Groq when set
affects: [32-02-prompt-adaptation, 32-03-env-switch, 33-transcription-migration]

# Tech tracking
tech-stack:
  added: ["@ai-sdk/groq 3.0.33"]
  patterns: [multi-provider-registry]

key-files:
  created: []
  modified:
    - app/lib/ai/registry.ts
    - app/package.json

key-decisions:
  - "Kept type cast in getModel() -- registry.languageModel() still needs cast for dynamic modelId strings"

patterns-established:
  - "Multi-provider registry: add new providers by importing createX and adding to createProviderRegistry call"

requirements-completed: [GEN-01]

# Metrics
duration: 1min
completed: 2026-04-05
---

# Phase 32 Plan 01: Groq Provider Registration Summary

**Registered Groq as AI SDK provider alongside OpenAI via @ai-sdk/groq, enabling env-var-driven model switching to Llama 4 Scout**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-05T20:40:55Z
- **Completed:** 2026-04-05T20:42:06Z
- **Tasks:** 2
- **Files modified:** 3 (registry.ts, package.json, pnpm-lock.yaml)

## Accomplishments
- Installed @ai-sdk/groq 3.0.33 package
- Registered Groq in createProviderRegistry alongside OpenAI
- Verified TypeScript compilation passes with no errors in registry.ts or config.ts
- Confirmed defaults remain openai:gpt-4o -- no behavior change without env var switch
- Confirmed config.ts already has groq:GROQ_API_KEY mapping from Phase 31

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @ai-sdk/groq and register Groq provider** - `75f9261` (feat)
2. **Task 2: Verify Groq registration with build check and config validation** - verification only, no file changes

## Files Created/Modified
- `app/lib/ai/registry.ts` - Added createGroq import and Groq provider in registry
- `app/package.json` - Added @ai-sdk/groq dependency
- `app/pnpm-lock.yaml` - Lockfile updated

## Decisions Made
- Kept the `as Parameters<typeof registry.languageModel>[0]` type cast in getModel() since the modelId is still a dynamic string from env vars and TypeScript needs the cast regardless of provider count

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. GROQ_API_KEY will be needed when env vars are switched in Plan 03.

## Next Phase Readiness
- Groq provider registered and ready for use
- Plan 02 (prompt adaptation) can proceed -- system prompts need optimization for Llama 4 Scout
- Plan 03 (env switch) will activate Groq by setting AI_GENERATE_MODEL and AI_TEMPLATE_MODEL

---
*Phase: 32-llm-migration-quality-validation*
*Completed: 2026-04-05*
