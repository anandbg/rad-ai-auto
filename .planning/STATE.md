# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-16)

**Core value:** A radiologist can sign up, generate a real AI report from voice/text input, and export it as a PDF.
**Current focus:** Phase 11 — UI/UX Overhaul (3-panel layout complete)

## Current Position

Phase: 11 of 11 (UI/UX Overhaul)
Plan: 7 of 7 complete
Status: PHASE COMPLETE - ALL MVP PHASES DONE
Last activity: 2026-01-16 - Completed 11-07-PLAN.md (ReportWorkspace Overhaul)

Progress: [██████████] 100% (11/11 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 18
- Average duration: 6.6 min
- Total execution time: 2.0 hours

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
| 10-admin-dashboard | 1 | 3 min | 3 min |
| 11-ui-ux-overhaul | 7 | 27 min | 3.9 min |

**Recent Trend:**
- Last 5 plans: 11-04 (5 min), 11-05 (4 min), 11-06 (4 min), 11-07 (5 min)
- Trend: Fast execution continues for UI/UX overhaul - ALL PHASES COMPLETE

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
| Parallel Promise.all for statistics queries | All 11 Supabase queries run in parallel for maximum performance | 10-01 |
| Use count with head:true for efficient counting | Efficient counting without fetching actual rows for large tables | 10-01 |
| UTC start of month calculation | Ensures consistent monthly stats regardless of server timezone | 10-01 |
| Centralized motion constants | DURATION/EASE in lib/motion/constants.ts, no magic numbers in components | 11-01 |
| useReducedMotion in all motion components | WCAG 2.1 AA compliance, respects prefers-reduced-motion setting | 11-01 |
| EASE.out for entrances, EASE.in for exits | Natural motion feels - quick start/slow stop for entrances | 11-01 |
| Scale 1.02 hover, 0.98 tap for buttons | Subtle but noticeable feedback without being distracting | 11-02 |
| Card interactive prop (default false) | Not all cards should animate - opt-in for interactive cards | 11-02 |
| AnimatedDialogContent for controlled dialogs | Separate export for AnimatePresence exit animations | 11-02 |
| 150ms transition duration | Fast enough to feel snappy, slow enough to be perceived | 11-02 |
| Emoji branding for auth pages | Medical-themed emojis for quick visual identity | 11-03 |
| StaggerContainer for auth forms | Sequential field animation for polished first impression | 11-03 |
| PageWrapper + Card auth layout | Consistent layout pattern across all 5 auth pages | 11-03 |
| PageWrapper wraps all protected pages | Consistent fade-in effect across dashboard, settings, etc. | 11-04 |
| AnimatePresence for sidebar dropdown | Smooth exit animations for user menu | 11-04 |
| StaggerContainer for grids | Quick Actions, template cards, macro lists stagger in | 11-04 |
| Section delay increment 0.1s | Sequential reveal from header down (0 -> 0.1 -> 0.2 -> 0.3) | 11-04 |
| Theme init script in head | Prevents FOUC - runs synchronously before body renders | 11-05 |
| Focus ring utility class | Consistent focus appearance across browsers using Tailwind ring | 11-05 |
| Darker focus color for dark mode | #60a5fa maintains 6.59:1 contrast vs #3b82f6 | 11-05 |
| Reduced motion CSS fallback | Defense in depth alongside useReducedMotion hook | 11-05 |
| AppShell wraps protected layout | 3-panel structure with sidebar, reports panel, main workspace | 11-06 |
| Reports panel 280px fixed width | Toggleable visibility for workspace flexibility | 11-06 |
| Sidebar collapsed state via props | Supports icon-only mode when collapsed | 11-06 |
| Mock reports grouped by date | Today/Yesterday/Date format for temporal organization | 11-06 |
| 2-tab workflow (Voice Input → Report) | User request: simpler flow, removes Clinical Context tab | 11-07 |
| Template selector in Report tab | User request: keeps header clean, contextual to report generation | 11-07 |
| Side-by-side Voice Input layout | Recording controls + transcription preview visible together | 11-07 |

### Pending Todos

1. Apply database migrations to Supabase cloud project
2. Generate Supabase TypeScript types after migration
3. Remove reports panel from dashboard (simplify to 2-panel layout)
4. Consolidate workflow to workspace hub with functional buttons (remove sidebar nav items, add file upload, wire APIs)
5. Review and align AI system prompts with reference documentation (see .planning/reference/ai-prompts-reference.md)
6. Fix PDF export (direct download, report content only) and add Word download option

### Blockers/Concerns

1. **Static page generation fails** - Protected pages using auth context fail prerendering (expected for authenticated routes)

### Resolved

- ✅ All API keys configured in `app/.env.local` (Supabase, OpenAI, Stripe, Upstash)
- ✅ Using Supabase cloud (not Docker)

## Session Continuity

Last session: 2026-01-16
Stopped at: Completed 11-07-PLAN.md (ReportWorkspace Overhaul) - ALL MVP PHASES COMPLETE
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
| 10-01 | Admin Statistics API | 3 min | 3306910, d91eb3e |
| 11-01 | Motion System Foundation | 2 min | 61e15c3, 25dca7d, 7dcb791 |
| 11-02 | Core UI Micro-interactions | 3 min | e5d8fa4, 30b8f08, f8ed2e6 |
| 11-03 | Auth Pages Polish | 4 min | dd2cec4, 01d05da |
| 11-04 | Protected Pages Polish | 5 min | cd33b2c, 49fccec, 922582d |
| 11-05 | Accessibility Compliance | 4 min | 4d7a0cb, 96284bb, 32ed8e4 |
| 11-06 | 3-Panel Application Shell | 4 min | 460b3b7, 5f73423, 6399621 |
| 11-07 | ReportWorkspace Overhaul | 5 min | 303fc9c, bc1b578 |
