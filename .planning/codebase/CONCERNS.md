# Codebase Concerns

**Analysis Date:** 2026-01-16

## Tech Debt

**Stripe Webhook Handler - Incomplete Event Processing:**
- Issue: All webhook event handlers have `TODO` comments with no actual implementation
- Files: `app/app/api/stripe/webhook/route.ts` (lines 75-112)
- Impact: Subscription activation, credit allocation, plan downgrades, and payment notifications are not functional. Users will not receive credits or have subscriptions properly managed.
- Fix approach: Implement each TODO section to update Supabase profiles/subscriptions tables, allocate credits to `credits_ledger`, and send user notifications

**Debug Code in Production Settings Page:**
- Issue: "Preferences Debug" card displays raw JSON preferences in production UI
- Files: `app/app/(protected)/settings/page.tsx` (lines 565-579)
- Impact: Exposes internal state to users, unprofessional UX
- Fix approach: Remove debug card or gate behind `NODE_ENV === 'development'` check

**Heavy localStorage Usage Instead of Database:**
- Issue: Multiple features store data in localStorage instead of Supabase, causing data loss on device change
- Files:
  - `app/app/(protected)/macros/page.tsx` (lines 71-104) - macros stored locally
  - `app/app/(protected)/admin/institutions/page.tsx` (lines 33-46) - institutions stored locally
  - `app/app/(protected)/templates/[id]/page.tsx` (lines 64-103) - template versions stored locally
  - `app/app/(protected)/transcribe/page.tsx` (lines 156-184) - usage stats stored locally
  - `app/app/(protected)/dashboard/page.tsx` (line 12) - usage stats from localStorage
- Impact: User data is not persisted across devices/browsers, data loss on cache clear
- Fix approach: Migrate to Supabase tables with proper RLS policies for each data type

**Large Monolithic Page Components:**
- Issue: Page components contain 800-1200 lines with embedded business logic
- Files:
  - `app/app/(protected)/generate/page.tsx` (1211 lines)
  - `app/app/(protected)/templates/[id]/page.tsx` (1125 lines)
  - `app/app/(protected)/macros/page.tsx` (1113 lines)
  - `app/app/(protected)/transcribe/page.tsx` (1081 lines)
- Impact: Difficult to test, maintain, and refactor. Business logic mixed with UI concerns
- Fix approach: Extract hooks for data fetching/mutations, separate presentation components, create service modules

**Simulated AI Generation:**
- Issue: Report generation uses setTimeout instead of actual OpenAI API calls
- Files: `app/app/(protected)/generate/page.tsx` (lines 411-443)
- Impact: No actual AI-powered report generation, just template placeholder concatenation
- Fix approach: Implement OpenAI API integration with streaming SSE response

## Known Bugs

**Type Coercion with `as any`:**
- Symptoms: Type safety bypassed for `normalFindings` property access
- Files: `app/app/(protected)/templates/[id]/page.tsx` (line 300)
- Trigger: Loading a template that may or may not have `normalFindings` field
- Workaround: Cast to `any` to avoid TypeScript error
- Fix: Define proper Template interface with optional `normalFindings` field

## Security Considerations

**Admin Route Protection - Client-Side Only:**
- Risk: Admin routes protection relies on client-side role check after page load
- Files: `app/middleware.ts` (line 52 comment), `app/lib/auth/auth-context.tsx` (line 68)
- Current mitigation: Middleware checks auth but comment notes "admin route protection is handled client-side"
- Recommendations: Add server-side role verification in middleware or API route handlers before rendering admin pages

**No Supabase RLS Policies Detected:**
- Risk: Database queries may not be properly scoped to authenticated users
- Files: No migration files found in `app/supabase/migrations/`
- Current mitigation: API routes manually check `user.id` in queries
- Recommendations: Create SQL migration files with RLS policies for all tables (profiles, templates_personal, templates_global, credits_ledger)

**Console Logging of Sensitive Operations:**
- Risk: Sensitive data may be logged in production
- Files:
  - `app/app/(protected)/settings/page.tsx` (line 244) - logs user ID on cascade delete
  - `app/app/(protected)/admin/institutions/[id]/page.tsx` (lines 174-175) - logs invite emails and links
  - `app/app/api/stripe/webhook/route.ts` (line 59) - logs verified event details
- Current mitigation: None
- Recommendations: Use structured logging with log levels, redact sensitive fields in production

**CSRF Token Validation Gaps:**
- Risk: CSRF validation only on specific forms, not consistent across all mutations
- Files:
  - `app/app/signup/page.tsx` (line 77) - has CSRF check
  - `app/app/(protected)/templates/new/page.tsx` (line 353) - has CSRF check
  - `app/app/forgot-password/page.tsx` (line 33) - has CSRF check
- Current mitigation: Some forms have CSRF validation
- Recommendations: Implement consistent CSRF protection middleware for all state-changing operations

## Performance Bottlenecks

**Multiple Supabase Client Instantiations:**
- Problem: Supabase client created via dynamic import on each call
- Files:
  - `app/app/(protected)/generate/page.tsx` (lines 128, 224, 458)
  - `app/lib/auth/auth-context.tsx` (lines 45, 86, 124, 139)
- Cause: `await import('@/lib/supabase/client')` called repeatedly in effects and handlers
- Improvement path: Create singleton client instance at module level, import directly

**No Query Caching or SWR Usage:**
- Problem: Templates and user data fetched on every page load without caching
- Files:
  - `app/app/(protected)/generate/page.tsx` (lines 216-277) - fetches templates on mount
  - `app/app/(protected)/templates/page.tsx` - refetches all templates each visit
- Cause: useEffect with direct Supabase calls, no deduplication
- Improvement path: Implement SWR/React Query for data fetching with cache invalidation

## Fragile Areas

**Draft Restoration Logic:**
- Files: `app/app/(protected)/generate/page.tsx` (lines 153-291)
- Why fragile: Multiple overlapping draft sources (localStorage, IndexedDB, URL params) with complex precedence rules
- Safe modification: Test all draft scenarios - offline recovery, URL transcript, localStorage draft
- Test coverage: No unit tests for draft restoration logic

**Auth State Subscription Cleanup:**
- Files: `app/lib/auth/auth-context.tsx` (lines 82-119)
- Why fragile: Async subscription setup with cleanup function that may be called before subscription is ready
- Safe modification: Ensure `subscription` variable is set before cleanup runs
- Test coverage: No tests for auth state change handling

## Scaling Limits

**localStorage Data Storage:**
- Current capacity: ~5MB per origin
- Limit: Browser will throw when localStorage quota exceeded
- Scaling path: Migrate to IndexedDB (already partially implemented) or Supabase for all persistent data

**Single Supabase Query for All Templates:**
- Current capacity: Fetches all personal + global templates in two queries
- Limit: Performance degrades with hundreds of templates per user
- Scaling path: Implement pagination, lazy loading, or virtualized lists

## Dependencies at Risk

**None Critical Detected**
- Stack uses well-maintained dependencies (Next.js 14, Supabase, Stripe)

## Missing Critical Features

**OpenAI Integration:**
- Problem: AI report generation and transcription are simulated
- Blocks: Core product value proposition - AI-assisted radiology reports
- Files: `app/app/(protected)/generate/page.tsx` (lines 411-443), `app/app/(protected)/transcribe/page.tsx` (lines 360-475)

**Email Verification Flow:**
- Problem: Verify email page exists but unclear if Supabase email templates configured
- Blocks: Account security for email/password auth
- Files: `app/app/verify-email/page.tsx`

**Rate Limiting:**
- Problem: No Upstash Redis integration detected for rate limiting
- Blocks: Protection against API abuse, required for production deployment
- Files: None - needs implementation

## Test Coverage Gaps

**Minimal E2E Test Suite:**
- What's not tested: Only 5 E2E tests exist, all for basic auth flow
- Files: `app/tests/e2e/auth.spec.ts` (49 lines, 5 tests)
- Risk: Core workflows (generate report, transcribe, templates CRUD, billing) have zero automated tests
- Priority: High - need E2E tests for:
  - Report generation flow
  - Template creation/editing
  - Stripe checkout flow
  - Admin user management

**No Unit Tests:**
- What's not tested: All business logic, utility functions, hooks
- Files: Only `app/tests/setup.ts` exists, no actual unit test files
- Risk: Regressions in core logic undetected
- Priority: High - need unit tests for:
  - Modality detection (`detectModality` in transcribe/page.tsx)
  - Draft save/restore logic
  - Credit calculation logic
  - Auth context state management

**No Integration Tests for API Routes:**
- What's not tested: All API routes (`/api/admin/users`, `/api/templates/list`, `/api/stripe/webhook`)
- Files: `app/app/api/**/*.ts`
- Risk: API contract changes break clients silently
- Priority: Medium - need integration tests for auth, authorization, and response formats

---

*Concerns audit: 2026-01-16*
