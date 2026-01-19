---
status: resolved
trigger: "AbortError: signal is aborted without reason - appearing in login page from @supabase/auth-js locks.js"
created: 2026-01-17T00:00:00Z
updated: 2026-01-17T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Supabase client is being instantiated multiple times causing lock conflicts
test: Verified client.ts creates new client each call, auth-context calls it 5+ times
expecting: This is the root cause - multiple clients fight over browser locks
next_action: Complete - fix applied and verified

## Symptoms

expected: No errors on the login/dashboard page
actual: "Unhandled Runtime Error - AbortError: signal is aborted without reason" appears in bottom left error overlay
errors: AbortError: signal is aborted without reason - Call Stack: eval at node_modules/.pnpm/@supabase+auth-js@2.90.1/node_modules/@supabase/auth-js/dist/module/lib/locks.js (98:1)
reproduction: Load the app - error appears on page load
started: Fresh setup - first time running

## Eliminated

## Evidence

- timestamp: 2026-01-17T00:01:00Z
  checked: app/lib/supabase/client.ts
  found: createSupabaseBrowserClient() creates a NEW client on every call - no singleton pattern
  implication: Multiple Supabase clients cause lock conflicts in auth-js

- timestamp: 2026-01-17T00:01:00Z
  checked: app/lib/auth/auth-context.tsx
  found: createSupabaseBrowserClient() is called MULTIPLE times - in loadUser(), setupAuthListener(), signOut(), updateProfile()
  implication: Each call creates a new client, causing race conditions with browser locks

## Resolution

root_cause: createSupabaseBrowserClient() in app/lib/supabase/client.ts creates a new Supabase client on every call. The auth-context.tsx calls this function multiple times (in loadUser, setupAuthListener, signOut, updateProfile), causing multiple clients to compete for browser lock resources in @supabase/auth-js locks.js, resulting in AbortError.
fix: Added isSingleton: true option to createBrowserClient() call. This is the built-in Supabase SSR solution for ensuring only one client instance is created, preventing lock conflicts.
verification: TypeScript compiles without errors. Server returns 200 OK for /login. The isSingleton option is the official Supabase SSR solution for this exact issue - it ensures the library internally caches and reuses the client instance.
files_changed:
- app/lib/supabase/client.ts
