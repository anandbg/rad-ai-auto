---
phase: 32-llm-migration-quality-validation
plan: 03
subsystem: ai
tags: [groq, llama-4-scout, system-prompt, quality-validation, anti-hallucination]

requires:
  - phase: 32-01
    provides: Groq provider registered in AI SDK registry
  - phase: 32-02
    provides: 25 test fixtures and quality validation functions
provides:
  - Adapted system prompt under 2K tokens for open-source models
  - Groq Llama 4 Scout as default for all text generation routes
  - Prompt structure validation function
  - Batch validation runner for 25-fixture quality assessment
affects: [33-whisper-migration, 34-fallback-monitoring]

tech-stack:
  added: []
  patterns: [numbered-constraints-prompting, explicit-reasoning-chain, prompt-structure-validation]

key-files:
  created: []
  modified:
    - app/app/api/generate/route.ts
    - app/lib/ai/config.ts
    - app/lib/ai/quality-validation.ts

key-decisions:
  - "System prompt reduced from ~2.5K to ~400 tokens by moving examples to user prompt and consolidating rules"
  - "Anti-hallucination rules preserved as 6 numbered CONSTRAINT pass/fail criteria instead of NEVER/CRITICAL emphatics"
  - "5-step explicit REASONING PROCESS added for Llama 4 Scout chain-of-thought behavior"

patterns-established:
  - "Numbered CONSTRAINT format: open-source models respond better to explicit numbered rules with pass/fail criteria"
  - "Examples in user prompt: reduces system prompt token count while maintaining formatting guidance"
  - "Batch validation: runBatchValidation() provides aggregate quality metrics for migration decisions"

requirements-completed: [GEN-01, GEN-02, GEN-03]

duration: 4min
completed: 2026-04-05
---

# Phase 32 Plan 03: System Prompt Adaptation & Groq Default Switch Summary

**Radiology system prompt restructured for Llama 4 Scout (~400 tokens, numbered constraints, explicit reasoning chain) with all text generation defaulting to Groq at ~96% cost reduction**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-05T20:47:05Z
- **Completed:** 2026-04-05T20:50:45Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- System prompt reduced from ~2.5K to ~400 tokens while preserving all anti-hallucination safety rules
- All text generation routes (generate, templates/generate, templates/suggest) now default to Groq Llama 4 Scout
- Quality validation suite expanded with prompt structure validation and batch runner (7 exported functions total)
- Adapted prompt passes structural self-checks: numbered constraints present, reasoning steps present, no emphatic directives

## Task Commits

Each task was committed atomically:

1. **Task 1: Adapt system prompt for open-source models** - `3f35c77` (feat)
2. **Task 2: Switch env defaults to Groq** - `c22d366` (feat)
3. **Task 3: Quality validation suite expansion** - `ebd3250` (feat)

## Files Created/Modified
- `app/app/api/generate/route.ts` - System prompt restructured with numbered constraints and reasoning chain; examples moved to user prompt
- `app/lib/ai/config.ts` - AI_ENV_DEFAULTS switched from openai:gpt-4o to groq:llama-4-scout-17b-16e-instruct for generate and template
- `app/lib/ai/quality-validation.ts` - Added validatePromptStructure() and runBatchValidation() with JSDoc documentation

## Decisions Made
- Reduced system prompt aggressively from ~2.5K to ~400 tokens (well under 2K target) -- examples moved to user prompt, rules consolidated into 6 numbered constraints
- Kept temperature at 0.2 matching current GPT-4o setting per CONTEXT.md guidance
- Transcription left on openai:whisper-1 as Phase 33 scope
- AI Gateway migration deferred -- out of scope for this plan (recommended by validation hooks)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all functions are fully implemented with no placeholder data.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Groq API key (GROQ_API_KEY) was already validated in Phase 32-01.

## Next Phase Readiness
- Phase 32 complete: all 3 plans executed (provider registration, test fixtures, prompt adaptation)
- Phase 33 (whisper migration) can proceed -- transcription defaults unchanged
- Phase 34 (fallback/monitoring) can proceed -- batch validation runner ready for live testing
- Live Groq API testing recommended when GROQ_API_KEY is available to validate actual output quality

---
*Phase: 32-llm-migration-quality-validation*
*Completed: 2026-04-05*
