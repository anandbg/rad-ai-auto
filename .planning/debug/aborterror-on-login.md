---
status: verifying
trigger: "AbortError appears after successful login - Supabase auth lock mechanism throws signal is aborted without reason"
created: 2026-01-18T00:00:00Z
updated: 2026-01-18T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Supabase auth-js locks.js throws AbortError due to navigator.locks API timing issues during login/navigation. The existing error suppressor used useEffect which fired AFTER hydration, missing early errors.
test: Fix applied - synchronous script in head now catches AbortError before React hydrates
expecting: AbortError toast should no longer appear after login
next_action: User verification required - start dev server and test login flow

## Symptoms

expected: Clean login without error notifications
actual: AbortError notification appears in bottom-left corner after successful login. Clicking reveals "Unhandled Runtime Error - AbortError: signal is aborted without reason"
errors: AbortError at node_modules/.pnpm/@supabase+auth-js@2.90.1/node_modules/@supabase/auth-js/dist/module/lib/locks.js (98:1)
reproduction: Log in to the app
started: Recent change - started after some code or dependency update

## Eliminated

## Evidence

- timestamp: 2026-01-18T00:01:00Z
  checked: app/lib/supabase/client.ts
  found: Client uses createBrowserClient with isSingleton: true option. Comment mentions this prevents lock conflicts.
  implication: Singleton pattern is already attempted but error still occurs.

- timestamp: 2026-01-18T00:02:00Z
  checked: app/components/error-suppressors.tsx
  found: ErrorSuppressors component exists and handles AbortError via window event listeners. Uses useEffect to attach listeners.
  implication: Error suppressor is REACTIVE (useEffect) - listeners only attach AFTER component mounts, but error may fire during/before hydration.

- timestamp: 2026-01-18T00:03:00Z
  checked: app/app/layout.tsx
  found: ErrorSuppressors is rendered as first child in body, before AuthProvider. Order is correct.
  implication: The problem is timing - useEffect fires too late, not component order.

- timestamp: 2026-01-18T00:04:00Z
  checked: Web research - Supabase GitHub issues
  found: Known issue with Supabase auth-js locks (GitHub #1594, #1517, #936). navigator.locks API can throw AbortError when lock acquisition is interrupted during navigation/route changes. Error is benign - doesn't affect auth functionality.
  implication: This is a known Supabase issue. The fix must suppress the error BEFORE React hydration to catch it at the right time.

- timestamp: 2026-01-18T00:05:00Z
  checked: auth-context.tsx flow
  found: AuthProvider uses onAuthStateChange which triggers when navigating after login. Login page redirects via router.push() + router.refresh() which can cause lock contention.
  implication: The login flow triggers auth state changes that race with navigation, causing lock abort.

- timestamp: 2026-01-18T00:06:00Z
  checked: Fix implementation
  found: Added synchronous script in head that uses capture:true on window error/unhandledrejection listeners. Script checks for AbortError with message containing "aborted" and prevents propagation.
  implication: Script runs before any JS modules load, ensuring errors are caught at the earliest possible moment.

- timestamp: 2026-01-18T00:07:00Z
  checked: TypeScript compilation
  found: npx tsc --noEmit passes with no errors
  implication: Code change is syntactically valid TypeScript/JSX

## Resolution

root_cause: Two issues discovered:
1. ErrorSuppressors component uses useEffect to attach error listeners, but useEffect runs AFTER React hydration. The AbortError from Supabase auth-js locks.js fires during/before hydration.
2. Session restoration bug: onAuthStateChange handler only handled SIGNED_IN/SIGNED_OUT events, not INITIAL_SESSION. On browser reopen, Supabase fires INITIAL_SESSION (not SIGNED_IN), so profile data wasn't reloaded - causing "loading" state for user name.

fix:
1. Added synchronous inline script in HTML head that catches AbortError BEFORE React hydrates.
2. Updated auth-context.tsx onAuthStateChange handler to also handle INITIAL_SESSION and TOKEN_REFRESHED events, plus added setIsLoading(false) after profile load.

verification: TypeScript compiles successfully. Manual verification required:
- Login to app → no AbortError toast
- Close browser, reopen → user name loads correctly (not stuck on "loading")

files_changed: [app/app/layout.tsx, app/lib/auth/auth-context.tsx]
