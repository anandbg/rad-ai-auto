# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-20)

**Core value:** A radiologist can sign up, generate a real AI report from voice/text input, and export it as a PDF.
**Current focus:** Phase 29 Code Refactoring - Complete

## Current Position

Milestone: Post-v1.4 Maintenance
Phase: 29 of 29 (Code Refactoring)
Plan: 8 of 8 complete
Status: Phase complete
Last activity: 2026-01-22 — Completed 29-06-PLAN.md (Large Component Split)

Progress: [█████████████████████████] 100% (v1.0-v1.4 complete, phase 29 complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 49
- Average duration: 7.0 min
- Total execution time: 5.73 hours

**By Phase (v1.0):**

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

**By Phase (v1.1):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 12-workspace-consolidation | 2 | 19 min | 9.5 min |
| 13-ai-prompt-alignment | 1 | 8 min | 8 min |
| 14-export-enhancement | 1 | 35 min | 35 min |

**By Phase (v1.2):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 15-template-creation-ux-overhaul | 5 | 28 min | 5.6 min |
| 17-landing-page-integration | 2 | 21 min | 10.5 min |
| 18-landing-page-carousel-enhancement | 1 | 45 min | 45 min |

**By Phase (v1.3):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 19-stripe-production-setup | 3 | 7 min | 2.3 min |
| 20-vercel-deployment-readiness | 5 | 27 min | 5.4 min |

**By Phase (v1.4):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 21-legal-documents | 1 | 8 min | 8 min |
| 22-sign-up-acknowledgment | 2 | 17 min | 8.5 min |
| 23-disclaimer-banner | 1 | 2 min | 2 min |
| 24-page-warnings | 1 | 4 min | 4 min |

**By Phase (Post-v1.4):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 25-report-disclaimers | 1 | 3 min | 3 min |
| 26-settings-privacy | 1 | 1 min | 1 min |
| 27-report-list-style-preferences | 2 | 20 min | 10 min |
| 29-code-refactoring | 8 | 78 min | 9.75 min |

**Recent Trend:**
- Last 5 plans: 29-06 (5 min), 29-05 (6 min), 29-08 (3 min), 29-02 (25 min), 29-07 (13 min)
- Trend: Component split and code organization

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 29-06]: Component extraction pattern: Extract large components into separate files with explicit props interfaces
- [Phase 29-06]: Export Template interface from report-tab for shared use in report-workspace
- [Phase 29-06]: Detection utilities barrel export via index.ts for clean imports
- [Phase 29-05]: Use explicit type exports in types/index.ts to avoid database.ts conflicts
- [Phase 29-05]: Make TemplateListItem date fields optional (not always needed for UI)
- [Phase 29-05]: Export both function and hook from syntax highlighter for flexibility
- [Phase 29-08]: Use offset/limit pattern for pagination (compatible with Supabase range)
- [Phase 29-08]: Cap limits (100 for templates, 200 for macros) to prevent abuse
- [Phase 29-08]: localStorage wrapper is SSR-safe (checks typeof window)
- [Phase 29-02]: Dynamic imports for heavy export libraries (jsPDF, docx) - reduces initial bundle
- [Phase 29-02]: Centralized export modules in lib/export/ for reusability
- [Phase 29-07]: Environment-aware logging (dev vs production log levels)
- [Phase 29-07]: Error boundary inside AppShell wrapper (preserves layout structure)
- [Phase 29-04]: Let Stripe Dashboard determine payment methods (more flexible)
- [Phase 29-04]: Record webhook events before processing (prevents race conditions)
- [Phase 29-04]: Graceful degradation if idempotency table doesn't exist
- [Phase 29-01]: Use Promise.all pattern for independent database queries
- [Phase 29-01]: Create cachedQuery wrapper for future Server Component use
- [Phase 29-01]: Use dynamic require for React.cache access in React 18
- [Phase 26-01]: Use same flex layout pattern as Security section for consistency
- [Phase 26-01]: Position Data & Privacy section with delay 0.24 (between Report Formatting and Security)
- [Phase 26-01]: Informational items without action buttons (read-only content)
- [Phase 25-01]: Use amber colors for AI-generated draft header (visually distinct)
- [Phase 25-01]: Keep footer disclaimer subtle with slate colors
- [Phase 25-01]: Same disclaimer text across all outputs for consistency
- [Phase 27-02]: Use heading text detection to identify current report section
- [Phase 27-02]: Reset list item index on section change for proper numbering
- [Phase 27-02]: Use LevelFormat.DECIMAL for Word native numbering
- [Phase 27-02]: 'none' style renders indented text without prefix
- [Phase 27-01]: Store list_style_preferences as JSONB in user_preferences table
- [Phase 27-01]: Default all sections to 'bullet' style for new users
- [Phase 27-01]: Use preference extension pattern: type, interface, defaults, context state, API handling
- [Phase 24-01]: Use blue/info styling for page warnings to distinguish from amber app-wide banner
- [Phase 24-01]: Use role=note for informational content (not role=alert for non-urgent guidance)
- [Phase 24-01]: Non-dismissible warnings ensure users always see context-specific guidance
- [Phase 23-01]: Use flex column layout with banner at top, AppShell in flex-1 container
- [Phase 23-01]: Change AppShell from h-screen to h-full (parent controls height)
- [Phase 23-01]: Use role=alert with aria-live=polite for accessibility
- [Phase 22-02]: Build non-dismissible modal by intercepting Escape and outside clicks
- [Phase 22-02]: Fail open on profile query errors (UX-friendly, not security gate)
- [Phase 22-02]: Query profile in server component layout, pass to client modal
- [Phase 22-01]: Use z.literal(true) for checkbox validation (strict boolean enforcement)
- [Phase 22-01]: Create reusable Checkbox component with Radix UI
- [Phase 22-01]: Open Terms link in new tab to preserve form state
- [Phase 21-01]: Use placeholder [Company Legal Name] where formal legal entity required
- [Phase 21-01]: Use legal@airad.io and privacy@airad.io as contact emails
- [Phase 21-01]: Legal pages styled consistently with app design tokens
- [Phase 21-01]: Footer includes "For licensed healthcare professionals only" note
- [Phase 20-05]: Use @vercel/analytics for free-tier production monitoring (Web Vitals, page views)
- [Phase 20-05]: Analytics component placed at root layout body level for global coverage
- [Phase 20-05]: DEPLOYMENT.md consolidates all deployment steps in one document
- [Phase 20-03]: Use ANALYZE=true env var for conditional bundle analyzer (zero production overhead)
- [Phase 20-03]: Enable AVIF/WebP image formats for optimal compression
- [Phase 20-04]: Use conditional logging (isDev pattern) instead of removing all console statements
- [Phase 20-04]: Keep error logging in production for critical paths (Stripe webhooks)
- [Phase 20-04]: Supabase cookie config already secure - no changes needed
- [Phase 19-03]: No production domain yet - documented setup for future deployment
- [Phase 19-03]: CLI forwarding is primary test mode webhook method (Dashboard endpoint not required for dev)
- [Phase 19-03]: Environment scoping: test keys for dev/preview, live keys for production only
- [Phase 19-02]: Created Playwright test suite as alternative to unavailable agent-browser skill
- [Phase 19-02]: CLI triggers verify handler logic even with synthetic test data
- [Phase 19-02]: Webhook endpoint returns 400 for missing signature (security first)
- [Phase 20-01]: Use force-dynamic for all routes using createSupabaseServerClient (cookie access)
- [Phase 20-01]: Wrap useSearchParams in Suspense with loading spinner fallback
- [Phase 20-02]: Region iad1 (US East Virginia) for optimal Supabase latency
- [Phase 20-02]: AI routes get 60s timeout, transcribe 120s, webhooks 30s
- [Phase 20-02]: Environment scoping documented for dev/preview/prod
- [Phase 19-01]: Stripe CLI already authenticated - skipped login checkpoint
- [Phase 19-01]: Webhook secret already configured in .env.local - verified match
- [Phase 18-01]: Use Playwright MCP browser automation for screenshot capture (agent-browser skill)
- [Phase 18-01]: Capture 15 screenshots covering all major features (workspace, templates, macros, billing, etc.)
- [Phase 18-01]: Use Sharp for PNG to WebP conversion at quality 85
- [Phase 18-01]: Self-verify carousel with browser automation before user confirmation
- [Phase 15-05]: Use window.location.href instead of router.push for clone pathway to ensure query parameters are preserved
- [Phase 15-05]: Add explicit y: '0%' to dialog animation variants to prevent positioning flash during animation
- [Phase 15-04]: Use Group/Panel/Separator from react-resizable-panels (correct API names)
- [Phase 15-04]: Show pathway modal on mount for guided creation flow
- [Phase 15-04]: Import shared schema from template-schema.ts (no duplication)
- [Phase 15-04]: Clone pathway navigates to /templates?clone=true
- [Phase 15-02]: Use Output.object() with aiGeneratedTemplateSchema for guaranteed schema compliance
- [Phase 15-02]: Temperature 0.3 for deterministic AI template generation
- [Phase 15-02]: Schema .describe() annotations guide GPT-4o output structure
- [Phase 15-01]: Used @dnd-kit over react-beautiful-dnd (deprecated)
- [Phase 15-01]: Implemented accessible drag-drop with keyboard support and screen reader announcements
- [Phase 15-01]: Applied CSS.Transform for smooth drag animations
- [Phase 17-02]: Root page displays landing page for public, redirects authenticated users via middleware
- [Phase 17-02]: Middleware handles /dashboard redirect for authenticated users
- [Phase 17-01]: Use modern blue-purple brand colors for landing page (distinct from app burgundy)
- [Phase 17-01]: Update link paths: /sign-up -> /signup, /sign-in -> /login for consistency
- [Phase 17-01]: Add bg-grid-pattern utility for subtle background decoration
- [Phase 15 Planning]: Use @dnd-kit for drag-drop (not react-beautiful-dnd - deprecated)
- [Phase 15 Planning]: Use react-resizable-panels for split pane layout
- [Phase 15 Planning]: Use AI SDK Output.object() with Zod for structured template generation
- [Phase 15 Planning]: 4 creation pathways: Manual, AI-Assisted, Clone, Import
- [Phase 14-01]: Use native jsPDF text rendering instead of html2canvas (for proper page breaks)
- [Phase 14-01]: Remove html2canvas dependency (no longer needed)
- [Phase 13-01]: Keep Markdown output format (not JSON) for react-markdown compatibility
- [Phase 13-01]: Include all 4 anti-hallucination examples from reference documentation
- [Phase 13-01]: Add template syntax guidance to all 3 suggestion request types
- [Phase 12-02]: Use react-markdown with @tailwindcss/typography for report rendering
- [Phase 12-02]: Stream GPT-4o response directly to UI without buffering
- [Phase 12]: 2-panel layout (removed ReportsPanel entirely)
- [Phase 12]: Simplified navigation (8 items, removed Transcribe/Generate)

### Pending Todos

0 pending — all cleared

### Roadmap Evolution

- Phase 15 added: Template Creation UX Overhaul (2026-01-18)
- Phase 17 added: Landing Page Integration (2026-01-18)
- Phase 18 added: Landing Page Carousel Enhancement (2026-01-19)
- Phase 19 added: Stripe Production Setup (2026-01-19) - comprehensive webhook/testing/go-live plan
- Phase 20 added: Vercel Deployment Readiness (2026-01-19) - build checks, performance, security, monitoring
- Phases 21-26 added: v1.4 Legal Compliance (2026-01-20) - disclaimers, ToS, privacy, acknowledgments
- Phase 27 added: Report List Style Preferences (2026-01-20) - user-configurable bullet styles
- Phase 28 added: Production Deployment (2026-01-22) - consolidates deferred Phase 16 + go-live
- Phase 29 added: Code Refactoring (2026-01-22) - unified backlog from Vercel/Stripe best practices and code simplification review

### Blockers/Concerns

Pre-existing ESLint build issue: imports being stripped during lint phase (jsPDF, docx).
- TypeCheck passes
- Build passes with NEXT_DISABLE_ESLINT=1
- Not related to Phase 29 changes

## Session Continuity

Last session: 2026-01-22
Stopped at: Completed 29-06-PLAN.md (Large Component Split)
Resume file: None

**Phase 29 PROGRESS (2026-01-22):**
- Phase 29-01 (Query Parallelization): COMPLETE - Billing/templates queries parallelized, React.cache utility created
- Phase 29-02 (Bundle Size Reduction): COMPLETE - PDF/Word export extracted to dynamic modules (~630KB savings)
- Phase 29-03 (Hook Consolidation): COMPLETE - useMacros SWR hook created
- Phase 29-04 (Stripe Hardening): COMPLETE - Webhook idempotency, error handling, flexible payment methods
- Phase 29-05 (Code Consolidation): COMPLETE - Template types consolidated, syntax highlighter extracted, useDialog hook created
- Phase 29-06 (Large Component Split): COMPLETE - TranscribeTab/ReportTab extracted, detection utilities in lib/detection/
- Phase 29-07 (Type Safety & Error Handling): COMPLETE - Centralized logger, React error boundary in protected routes
- Phase 29-08 (Query Optimization & Pagination): COMPLETE - Templates/macros APIs paginated, draft storage utility created

**Phase 29 COMPLETE** - All 8 plans executed successfully.

**Previous milestones:**
- v1.4: Shipped 2026-01-20 (21-24 complete; 25-27 post-v1.4 enhancements complete)
- v1.3: Shipped 2026-01-20 (19, 20 complete; 16 deferred)
- v1.2: Shipped 2026-01-20
- v1.1: Shipped 2026-01-17
- v1.0: Shipped 2026-01-16

**Next action:** Phase 28 (Production Deployment) or project maintenance.
