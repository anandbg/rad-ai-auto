---
phase: 31-provider-abstraction-layer
plan: 01
subsystem: infra
tags: [ai-sdk, openai, provider-registry, env-config]

# Dependency graph
requires:
  - phase: 30-capacity-rate-limiting
    provides: Rate limiting and cost tracking infrastructure
provides:
  - AI configuration module with env-driven model resolution
  - Provider registry with getModel() resolver for route handlers
  - @ai-sdk/openai-compatible package for future provider support
affects: [31-02, 32-groq-integration, 33-together-fallback]

# Tech tracking
tech-stack:
  added: ["@ai-sdk/openai-compatible"]
  patterns: ["provider:model format for model IDs", "createProviderRegistry for multi-provider support", "fail-fast config validation at module load"]

key-files:
  created:
    - app/lib/ai/config.ts
    - app/lib/ai/registry.ts
  modified:
    - app/package.json

key-decisions:
  - "Used provider:model string format (e.g. openai:gpt-4o) for env-driven model resolution"
  - "Config validation warns in dev, throws in production (fail-fast)"
  - "Only OpenAI registered initially -- zero behavior change from current codebase"
  - "getModel() excludes transcription purpose since it uses a different API"

patterns-established:
  - "provider:model format: all AI model references use colon-separated provider:model strings"
  - "purpose-based model resolution: getModel('generate') abstracts model selection from route code"
  - "module-load validation: AI config errors surface immediately, not at first request"

requirements-completed: [INFRA-01, INFRA-02]

# Metrics
duration: 3min
completed: 2026-04-05
---

# Phase 31 Plan 01: Provider Abstraction Foundation Summary

**Environment-driven AI config module and provider registry with getModel() resolver defaulting to OpenAI GPT-4o**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T19:39:25Z
- **Completed:** 2026-04-05T19:42:32Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created config module that resolves AI_GENERATE_MODEL, AI_TEMPLATE_MODEL, AI_TRANSCRIPTION_MODEL env vars to provider:model strings with OpenAI defaults
- Created provider registry using AI SDK createProviderRegistry with OpenAI, exposing getModel() for route handler migration
- Installed @ai-sdk/openai-compatible package for future Groq/Together AI provider support
- Added validateAIConfig() that checks required API keys per configured provider with fail-fast in production

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AI configuration module with env-driven model resolution** - `3ed9d45` (feat)
2. **Task 2: Create provider registry with getModel() resolver** - `11aabe1` (feat)

## Files Created/Modified
- `app/lib/ai/config.ts` - AI config module: getModelId, getTranscriptionConfig, validateAIConfig, AI_ENV_DEFAULTS
- `app/lib/ai/registry.ts` - Provider registry: createProviderRegistry with OpenAI, getModel() resolver
- `app/package.json` - Added @ai-sdk/openai-compatible dependency

## Decisions Made
- Used `provider:model` colon-separated format for all model IDs, matching AI SDK's createProviderRegistry expectations
- Config validation runs at module load: warns in development (allows local dev without all keys), throws in production (fail-fast)
- Only OpenAI registered in registry initially to ensure zero behavior change
- getModel() typed to exclude 'transcription' since transcription uses a different API (not languageModel)
- Type assertion needed for registry.languageModel() since registered providers constrain the type; will be resolved when more providers added in Phase 32

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript type constraint on registry.languageModel()**
- **Found during:** Task 2 (provider registry creation)
- **Issue:** `createProviderRegistry` returns a type constrained to registered provider prefixes (only `openai:${string}` since only OpenAI registered). Dynamic model IDs from getModelId() are typed as `string`, causing TS2769.
- **Fix:** Added type assertion `as Parameters<typeof registry.languageModel>[0]` with explanatory comment
- **Files modified:** app/lib/ai/registry.ts
- **Verification:** TypeScript compiles with no errors in our files
- **Committed in:** 11aabe1 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Type assertion needed due to AI SDK's strict generic typing. No scope creep.

## Issues Encountered
- Pre-existing `Intl.Segmenter` type error in ai@6.0.39 package definitions (not in our code) -- ignored as it is a known upstream issue

## Known Stubs
None -- both modules are complete with full implementations.

## User Setup Required
None - no external service configuration required. Existing OPENAI_API_KEY env var continues to work.

## Next Phase Readiness
- config.ts and registry.ts ready for route handler migration in plan 31-02
- Route handlers can replace `openai('gpt-4o')` with `getModel('generate')` 
- @ai-sdk/openai-compatible available for Phase 32 Groq/Together integration

---
*Phase: 31-provider-abstraction-layer*
*Completed: 2026-04-05*
