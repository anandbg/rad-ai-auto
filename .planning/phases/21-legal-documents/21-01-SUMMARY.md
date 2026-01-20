---
phase: 21-legal-documents
plan: 01
subsystem: legal
tags: [legal, terms-of-service, privacy-policy, compliance, landing-page]

# Dependency graph
requires:
  - phase: 17-landing-page-integration
    provides: Landing page component for footer integration
provides:
  - Terms of Service page at /terms with 7 liability clauses
  - Privacy Policy page at /privacy with ephemeral data model explanation
  - Footer with legal links on landing page
affects: [22-sign-up-acknowledgment, 23-ai-banner, 24-page-warnings]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Legal page layout with gradient header and card-based sections
    - Consistent styling between legal pages (terms, privacy)

key-files:
  created:
    - app/app/terms/page.tsx
    - app/app/privacy/page.tsx
  modified:
    - app/components/landing/landing-page.tsx

key-decisions:
  - "Use placeholder [Company Legal Name] where formal legal entity required"
  - "Use legal@airad.io and privacy@airad.io as contact emails"
  - "Style legal pages consistently with app design tokens"
  - "Footer includes 'For licensed healthcare professionals only' note"

patterns-established:
  - "Legal pages: gradient header, card-based clauses, consistent footer"
  - "Footer pattern: copyright + professional disclaimer + legal links + contact"

# Metrics
duration: 8min
completed: 2026-01-20
---

# Phase 21 Plan 01: Legal Documents Summary

**Terms of Service with 7 liability clauses and Privacy Policy with ephemeral data model, plus footer links on landing page**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-20T00:00:00Z
- **Completed:** 2026-01-20T00:08:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created comprehensive Terms of Service page with all 7 key liability protection clauses
- Created Privacy Policy page explaining ephemeral data processing model
- Added footer to landing page with legal links and professional disclaimer

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Terms of Service page** - `5db538b` (feat)
2. **Task 2: Create Privacy Policy page** - `384ce1e` (feat)
3. **Task 3: Add footer with legal links** - `b3e6f13` (feat)

## Files Created/Modified

- `app/app/terms/page.tsx` - Terms of Service page with 7 liability clauses (346 lines)
- `app/app/privacy/page.tsx` - Privacy Policy page with ephemeral data explanation (457 lines)
- `app/components/landing/landing-page.tsx` - Added footer section with legal links

## Terms of Service Key Clauses

1. **NOT A MEDICAL DEVICE** - Software is a drafting tool, not medical device
2. **USER RESPONSIBILITY** - Licensed professional assumes full responsibility
3. **NO PHI INPUT** - Users must de-identify content
4. **EPHEMERAL PROCESSING** - No storage of transcriptions/reports
5. **USE AT YOUR OWN RISK** - "AS IS" warranty disclaimer
6. **INDEMNIFICATION** - User indemnifies company
7. **LIMITATION OF LIABILITY** - No liability for clinical decisions/outcomes

## Privacy Policy Key Points

- **What We Collect:** Account info, usage metadata, payment info via Stripe
- **What We Do NOT Collect:** PHI, report content, transcription content, audio
- **Data Processing:** All AI processing is ephemeral, content immediately discarded
- **Third-Party Services:** OpenAI, Stripe, Supabase, Vercel (with links to their policies)
- **User Rights:** Access data, export data, delete account

## Decisions Made

- Used placeholder `[Company Legal Name]` where formal legal entity name would go
- Used `legal@airad.io` for Terms contact and `privacy@airad.io` for Privacy contact
- Styled legal pages consistently with existing app design tokens
- Footer includes "For licensed healthcare professionals only" professional disclaimer

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Legal foundation pages are complete and accessible
- Footer provides navigation to legal documents from landing page
- Ready for Phase 22: Sign-up acknowledgment checkbox
- Ready for Phase 23: Persistent AI banner during report generation
- Ready for Phase 24: Page-level warnings

---
*Phase: 21-legal-documents*
*Completed: 2026-01-20*
