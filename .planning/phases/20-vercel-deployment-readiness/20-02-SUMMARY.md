---
phase: 20-vercel-deployment-readiness
plan: 02
subsystem: infra
tags: [vercel, deployment, environment, configuration]

# Dependency graph
requires:
  - phase: 04-ai-report-generation
    provides: AI route structure (generate, suggest, templates)
  - phase: 05-voice-transcription
    provides: Transcribe route
  - phase: 09-stripe-billing
    provides: Stripe webhook route
provides:
  - Vercel deployment configuration (vercel.json)
  - Function timeout settings for AI and webhook routes
  - Comprehensive environment variable documentation
  - Deployment checklist for required variables
affects: [20-03-build-validation, production-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Vercel functions config with route-specific maxDuration"
    - "Environment variable scoping (dev/preview/prod)"

key-files:
  created:
    - app/vercel.json
  modified:
    - app/.env.example

key-decisions:
  - "Region iad1 (US East Virginia) for optimal Supabase latency"
  - "AI routes get 60s timeout (GPT-4o response time)"
  - "Transcribe gets 120s timeout (large audio files)"
  - "Webhook gets 30s (standard processing)"

patterns-established:
  - "Function timeout pattern: route-specific maxDuration in vercel.json"
  - "Environment documentation pattern: sections with where-to-get URLs"

# Metrics
duration: 4min
completed: 2026-01-19
---

# Phase 20 Plan 02: Vercel Configuration & Environment Summary

**Vercel deployment config with function timeouts for AI routes (60s/120s) and comprehensive env var documentation for dev/preview/prod**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-19T15:20:00Z
- **Completed:** 2026-01-19T15:24:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created vercel.json with build/install commands for pnpm
- Configured region (iad1) for US East deployment
- Set function timeouts: 60s for AI, 120s for transcribe, 30s for webhooks
- Documented all environment variables with where-to-get URLs
- Added deployment checklist with required vs optional variables

## Task Commits

Each task was committed atomically:

1. **Task 1: Create vercel.json configuration** - `88f7b0a` (chore)
2. **Task 2: Document environment variables comprehensively** - `0e2187b` (docs)

## Files Created/Modified
- `app/vercel.json` - Vercel deployment configuration with function timeouts
- `app/.env.example` - Comprehensive environment variable documentation (133 lines)

## Decisions Made
- **Region iad1:** US East Virginia chosen for typical Supabase region proximity
- **Function timeouts:** AI routes (60s) allow for GPT-4o slow responses; transcribe (120s) handles large audio; webhook (30s) for standard processing
- **Environment scoping:** Clear documentation of dev/preview/prod variable handling for Vercel

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward configuration and documentation task.

## User Setup Required

**Environment variables must be configured in Vercel Dashboard** before deployment:

Required variables for all environments:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID_PLUS
- STRIPE_PRICE_ID_PRO

See `app/.env.example` for detailed documentation on where to obtain each credential.

## Next Phase Readiness
- Vercel configuration complete, ready for deployment
- Build validation (20-03) can now verify successful build with this config
- Environment variables documented for team onboarding

---
*Phase: 20-vercel-deployment-readiness*
*Plan: 02*
*Completed: 2026-01-19*
