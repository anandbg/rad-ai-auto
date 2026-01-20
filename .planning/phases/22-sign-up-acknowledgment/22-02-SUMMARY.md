---
phase: 22-sign-up-acknowledgment
plan: 02
subsystem: authentication
tags: [legal, acknowledgment, modal, first-use, radix-ui, supabase]

# Dependency graph
requires:
  - phase-21 (Legal Documents - Terms of Service page)
  - phase-22-01 (Sign-up checkboxes - consent already captured)
provides:
  - first-use-acknowledgment-modal (non-dismissible modal for existing users)
  - terms-persistence (database tracking of acknowledgment timestamp)
affects:
  - phase-23 (AI Banner - all legal gates now in place)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Non-dismissible modal using Radix Dialog without close button
    - Escape key prevention via onEscapeKeyDown handler
    - Pointer events outside prevention via onPointerDownOutside
    - Server-side profile query for acknowledgment status

# File tracking
key-files:
  created:
    - app/supabase/migrations/20260120000000_add_terms_acknowledged.sql
    - app/app/api/user/acknowledge-terms/route.ts
    - app/components/legal/first-use-acknowledgment-modal.tsx
  modified:
    - app/types/database.ts
    - app/app/(protected)/layout.tsx

# Decisions
decisions:
  - id: non-dismissible-dialog
    choice: "Build non-dismissible modal by intercepting Escape and outside clicks"
    rationale: "Ensures users cannot bypass acknowledgment - required for legal compliance"
  - id: fail-open-profile-query
    choice: "If profile query fails, allow access (don't show modal)"
    rationale: "Modal is legal nicety, not security gate - UX should not be blocked by DB errors"
  - id: server-component-layout
    choice: "Query profile in server component layout, pass to client modal"
    rationale: "Reduces client-side loading states, data available on first render"

# Metrics
metrics:
  duration: ~15m (with human verification checkpoint)
  completed: 2026-01-20
---

# Phase 22 Plan 02: First-Use Acknowledgment Modal Summary

Non-dismissible first-login acknowledgment modal with database persistence for existing users.

## What Was Built

### 1. Database Migration (`app/supabase/migrations/20260120000000_add_terms_acknowledged.sql`)
- Added `terms_acknowledged_at` TIMESTAMPTZ column to profiles table
- Nullable column (NULL = not yet acknowledged, timestamp = acknowledged)
- Partial index for efficient lookup of unacknowledged users
- Descriptive column comment for documentation

### 2. TypeScript Types (`app/types/database.ts`)
- Added `terms_acknowledged_at: string | null` to Profile interface
- Enables type-safe access to acknowledgment status

### 3. API Endpoint (`app/app/api/user/acknowledge-terms/route.ts`)
- POST endpoint at `/api/user/acknowledge-terms`
- Requires authentication (returns 401 if not logged in)
- Sets `terms_acknowledged_at` to current ISO timestamp
- Error handling with appropriate HTTP status codes

### 4. Modal Component (`app/components/legal/first-use-acknowledgment-modal.tsx`)
- Non-dismissible dialog built on Radix UI primitives
- Escape key blocked via `onEscapeKeyDown` handler
- Outside clicks blocked via `onPointerDownOutside` handler
- No X close button in header
- Content per ACK-01 requirement:
  - Title: "Important: Read Before Continuing"
  - Warning icon (AlertTriangle, amber)
  - 5 bullet points of acknowledgments
  - "I Understand and Accept" button
  - "You will only see this message once" note
- Loading state on button during API call
- Error handling with toast notification

### 5. Protected Layout Integration (`app/app/(protected)/layout.tsx`)
- Server-side query for user's acknowledgment status
- Passes `showAcknowledgmentModal` boolean to client component
- Modal rendered if `terms_acknowledged_at` is NULL
- Fail-open on query errors (allows access if DB query fails)
- Modal overlays app content until acknowledged

## Commits

| Commit | Description |
|--------|-------------|
| `bf359a5` | Add terms_acknowledged_at migration |
| `a82e4e1` | Add terms_acknowledged_at to Profile type |
| `1dff556` | Add acknowledge-terms API endpoint |
| `26144d0` | Create first-use acknowledgment modal |
| `e014583` | Integrate acknowledgment modal in protected layout |

## Verification Results

All tests passed during human verification checkpoint:

- [x] Modal appears for unacknowledged users
- [x] Modal has correct content (title, icon, 5 bullet points, button)
- [x] Escape key does not close modal
- [x] Clicking outside does not close modal
- [x] Button click closes modal
- [x] Database updated with timestamp
- [x] Modal does not reappear after refresh
- [x] `npm run build` succeeds

## Deviations from Plan

None - plan executed exactly as written.

## Requirements Satisfied

- **ACK-01**: First-use acknowledgment modal with all required content and behavior
- **ACK-01a**: Modal cannot be dismissed without explicit acknowledgment
- **ACK-01b**: Acknowledgment persists in database
- **ACK-01c**: Modal only appears once per user

## Next Phase Readiness

Phase 22 complete. All sign-up acknowledgment requirements satisfied:
- [x] Sign-up checkboxes (22-01): Consent captured at registration
- [x] First-use modal (22-02): Acknowledgment for existing/returning users

Prerequisites for Phase 23 (AI Banner):
- [x] All legal gates in place
- [x] Authentication flow has consent requirements
- [x] Database tracks acknowledgment status
