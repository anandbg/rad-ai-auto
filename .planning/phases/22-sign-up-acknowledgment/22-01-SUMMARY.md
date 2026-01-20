---
phase: 22-sign-up-acknowledgment
plan: 01
subsystem: authentication
tags: [legal, consent, signup, validation, zod, radix-ui]

# Dependency graph
requires:
  - phase-21 (Legal Documents - Terms of Service page)
provides:
  - mandatory-consent-gate (users cannot signup without accepting ToS)
  - phi-acknowledgment (users acknowledge no PHI/PII upload)
affects:
  - phase-23 (AI Banner - authentication context established)

# Tech tracking
tech-stack:
  added:
    - Radix UI Checkbox component (@radix-ui/react-checkbox)
  patterns:
    - Zod literal(true) for mandatory checkbox validation
    - Centralized validation schema in lib/validation/

# File tracking
key-files:
  created:
    - app/lib/validation/signup-schema.ts
    - app/components/ui/checkbox.tsx
  modified:
    - app/app/signup/page.tsx

# Decisions
decisions:
  - id: use-zod-literal-true
    choice: "Use z.literal(true) for checkbox validation instead of z.boolean().refine()"
    rationale: "Cleaner API, better error messages, TypeScript enforces true value"
  - id: create-checkbox-component
    choice: "Create reusable Checkbox component with error display"
    rationale: "Checkbox component didn't exist, needed for consistent UI pattern"
  - id: terms-link-new-tab
    choice: "Open Terms of Service link in new tab"
    rationale: "Preserve signup form state while user reviews terms"

# Metrics
metrics:
  duration: 2m 22s
  completed: 2026-01-20
---

# Phase 22 Plan 01: Sign-Up Legal Acknowledgment Summary

Mandatory ToS acceptance and no-PHI acknowledgment checkboxes with Zod validation schema.

## What Was Built

### 1. Signup Validation Schema (`app/lib/validation/signup-schema.ts`)
- Extended signup form schema with two new boolean fields
- `acceptTerms`: Must be `true` - "You must accept the Terms of Service to continue"
- `acceptNoPhiPolicy`: Must be `true` - "You must acknowledge the no personal data policy to continue"
- Uses `z.literal(true)` for strict validation requiring explicit consent
- Exported both schema and inferred TypeScript type

### 2. Checkbox UI Component (`app/components/ui/checkbox.tsx`)
- Reusable checkbox built on Radix UI primitives
- Supports label prop (string or JSX for inline links)
- Built-in error message display below checkbox
- Proper accessibility: aria-invalid, aria-describedby
- Focus ring styling consistent with design system
- Disabled state handling

### 3. Updated Signup Page (`app/app/signup/page.tsx`)
- Imports shared schema from validation file (removed inline schema)
- Added two consent checkboxes between password fields and submit button
- Terms checkbox links to `/terms` (opens in new tab with rel="noopener noreferrer")
- PHI checkbox has plain text label (no link needed)
- Form submission blocked until both checkboxes checked
- Validation errors display on submit attempt
- Test IDs added for E2E testing

## Commits

| Commit | Description |
|--------|-------------|
| `203cf8a` | Create signup validation schema with legal consent fields |
| `64ad354` | Add legal consent checkboxes to signup form |

## Verification Results

- [x] `npm run build` succeeds without errors
- [x] Signup page renders both checkboxes
- [x] Schema validates acceptTerms and acceptNoPhiPolicy fields
- [x] Terms link points to `/terms`
- [x] Proper accessibility attributes applied

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Created Checkbox UI component**
- **Found during:** Task 2 execution
- **Issue:** Checkbox component referenced in plan didn't exist
- **Fix:** Created full Radix UI-based Checkbox component with label and error support
- **Files created:** `app/components/ui/checkbox.tsx`
- **Commit:** `64ad354`

**2. [Rule 1 - Bug] Fixed React hooks conditional call**
- **Found during:** Build verification
- **Issue:** `React.useId()` was called conditionally (`id || React.useId()`)
- **Fix:** Call `useId()` unconditionally first, then use result
- **Files modified:** `app/components/ui/checkbox.tsx`
- **Commit:** `64ad354`

## Requirements Satisfied

- **GATE-01**: User cannot submit signup without accepting Terms of Service
- **GATE-02**: User cannot submit signup without acknowledging no-PHI policy

## Next Phase Readiness

Phase 22 complete. Prerequisites for Phase 23 (AI Banner):
- [x] Authentication flow has legal consent gate
- [x] Terms of Service page exists at /terms
- [x] Signup form validates consent before account creation
