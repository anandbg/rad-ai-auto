# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-16)

**Core value:** A radiologist can sign up, generate a real AI report from voice/text input, and export it as a PDF.
**Current focus:** Phase 9 — Stripe Billing (complete)

## Current Position

Phase: 9 of 10 (Stripe Billing)
Plan: 09-02 complete (2 of 2 in phase)
Status: Phase complete
Last activity: 2026-01-16 - Completed 09-02-PLAN.md (Webhook Handlers)

Progress: [█████████░] 90%

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 8.3 min
- Total execution time: 1.7 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-database-foundation | 1 | 12 min | 12 min |
| 02-authentication | 1 | 3 min | 3 min |
| 03-template-system | 2 | 8 min | 4 min |
| 04-ai-report-generation | 1 | 8 min | 8 min |
| 05-voice-transcription | 1 | 5 min | 5 min |
| 06-ai-template-suggestions | 1 | 6 min | 6 min |
| 07-pdf-export | 1 | 5 min | 5 min |
| 08-user-settings-macros | 2 | 50 min | 25 min |
| 09-stripe-billing | 2 | 6 min | 3 min |

**Recent Trend:**
- Last 5 plans: 08-02 (5 min), 08-01 (45 min), 09-01 (2 min), 09-02 (4 min)
- Trend: Stripe billing phase fast execution

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

| Decision | Rationale | Phase |
|----------|-----------|-------|
| PostgreSQL enums for type constraints | More type-safe than CHECK constraints, matches TypeScript unions | 01-01 |
| is_admin() helper function | Reusable admin checks across RLS policies | 01-01 |
| Immutable audit tables | credits_ledger, report_sessions, template_versions preserve audit trail | 01-01 |
| JSONB for config fields | Schema flexibility without migrations | 01-01 |
| Auth callback route for all email flows | Server-side session establishment, more robust for SSR/middleware | 02-01 |
| Google OAuth out of scope for v1 | Explicit scope limitation | 02-01 |
| E2E tests focus on UI presence | Don't test actual auth flows requiring real accounts | 02-01 |
| Content stored as JSONB {sections, rawContent} | Flexible template content structure | 03-01 |
| origin_global_id for cloned templates | Track provenance of cloned templates | 03-01 |
| DELETE returns 204 No Content | REST convention for successful delete | 03-01 |
| Keep browser Supabase client for reads | RLS handles security, simpler than list API endpoint | 03-02 |
| Global templates read-only for all | Admin editing is Phase 10, all users can only clone | 03-02 |
| Preserve draft storage in localStorage | Useful UX for form recovery | 03-02 |
| Vercel AI SDK over raw OpenAI | Better streaming abstractions, simpler response handling | 04-01 |
| Edge runtime for /api/generate | Lower latency for AI streaming | 04-01 |
| Temperature 0.2 for GPT-4o | Deterministic, consistent medical reports | 04-01 |
| toTextStreamResponse() for SSE | Plain text streaming simpler than data stream format | 04-01 |
| Node.js runtime for /api/transcribe | FormData file parsing requires Node.js, not Edge runtime | 05-01 |
| 120 second maxDuration for transcribe | Audio files take longer to process than text generation | 05-01 |
| Support webm format | Browser MediaRecorder produces webm by default | 05-01 |
| Temperature 0.3 for suggestions | Slightly more creative than reports (0.2) for template assistance | 06-01 |
| Three request types for suggestions | sections/improvements/normalFindings each get specialized prompts | 06-01 |
| Browser print for PDF export | No external library needed, simpler and dependency-free | 07-01 |
| Georgia serif font for PDF | Professional medical document typography standard | 07-01 |
| AI indicator in PDF footer | Transparency about AI-generated content for compliance | 07-01 |
| Map frontend camelCase to DB snake_case in macros API | Consistent field naming convention | 08-02 |
| Keep hardcoded global macros for now | Admin editing is Phase 10 | 08-02 |
| Parallel fetch for macros and categories | Better page load performance | 08-02 |
| Keep compactMode as local-only preference | Not stored in database, only localStorage | 08-01 |
| Use UPSERT for preference updates | Auto-creates row if not exists | 08-01 |
| localStorage fallback for offline support | Ensures app works when offline or API fails | 08-01 |
| Validate priceId against environment config | Security: prevents arbitrary price IDs from being used | 09-01 |
| Create Stripe customer during checkout | Deferred creation: only creates customer when user actually upgrades | 09-01 |
| Upsert subscription record before checkout | Ensures stripe_customer_id is stored for future portal access | 09-01 |
| Access period dates from subscription item | Stripe API 2025-04-30.basil moved current_period_start/end to SubscriptionItem | 09-02 |
| Use meta.type for usage classification | credits_ledger.reason enum is generic (debit); meta.type specifies report vs transcription | 09-02 |
| Try/catch per webhook case | Prevents one failing case from blocking other event processing | 09-02 |

### Pending Todos

1. Apply database migrations to Supabase (requires Docker or remote project)
2. Generate Supabase TypeScript types after migration
3. Configure OPENAI_API_KEY for production
4. Configure Stripe environment variables (STRIPE_SECRET_KEY, price IDs, STRIPE_WEBHOOK_SECRET)

### Blockers/Concerns

1. **Docker not running** - Cannot apply migrations locally or generate Supabase types
2. **Static page generation fails** - Protected pages using auth context fail prerendering (expected for authenticated routes)
3. **OPENAI_API_KEY required** - Generate, transcribe, and suggest endpoints return 500 if not configured
4. **STRIPE_SECRET_KEY required** - Billing endpoints return 500 if not configured
5. **STRIPE_WEBHOOK_SECRET required** - Webhook signature verification requires secret from Stripe CLI or dashboard

## Session Continuity

Last session: 2026-01-16
Stopped at: Completed 09-02-PLAN.md (Webhook Handlers)
Resume file: None

## Completed Plans

| Plan | Name | Duration | Commits |
|------|------|----------|---------|
| 01-01 | Database Schema and RLS | 12 min | 381015b, 6ad60ae |
| 02-01 | Supabase Auth Verification | 3 min | a00506a, a2bb68c, a2f4263 |
| 03-01 | Template CRUD API | 3 min | d6f520b, dc2962c, 1deff1d |
| 03-02 | Template UI API Integration | 5 min | 1d88bc3, a0e7051, a13d023 |
| 04-01 | GPT-4o Streaming Generation | 8 min | fb15e6d, e6b66be, 759860a |
| 05-01 | Whisper Transcription API | 5 min | e3baa54, 70b2500 |
| 06-01 | AI Template Suggestions | 6 min | acf5c29, 2557034 |
| 07-01 | PDF Export Enhancement | 5 min | 52dd397 |
| 08-02 | Macros API Integration | 5 min | aa558c6, e00452d, 8d63773 |
| 08-01 | Preferences API Integration | 45 min | c463c54, 21c43d3, 50bc944 |
| 09-01 | Stripe API Endpoints | 2 min | be73281, d077dda |
| 09-02 | Webhook Handlers | 4 min | a919ec1, fced612 |
