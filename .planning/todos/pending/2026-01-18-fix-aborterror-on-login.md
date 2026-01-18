---
created: 2026-01-18T11:08
title: Fix AbortError on login
area: auth
files:
  - node_modules/.pnpm/@supabase+auth-js@2.90.1/node_modules/@supabase/auth-js/dist/module/lib/locks.js:98:1
---

## Problem

After logging in, users see "1 error" notification in the bottom-left corner. Clicking on the error reveals:

**Error:** "Unhandled Runtime Error - AbortError: signal is aborted without reason"

**Call Stack:**
```
eval
node_modules/.pnpm/@supabase+auth-js@2.90.1/node_modules/@supabase/auth-js/dist/module/lib/locks.js (98:1)
```

This appears to be related to the Supabase auth lock mechanism, possibly from:
- Session initialization race conditions
- AbortController signal timing issues
- Auth state synchronization between client/server

The error occurs immediately after successful login and doesn't prevent functionality, but creates poor UX with persistent error notification.

## Solution

TBD - Need to investigate:
1. Review Supabase auth client initialization in `app/lib/supabase/client.ts`
2. Check if auth state is being accessed before session is fully initialized
3. Look for AbortController usage in auth flow
4. Consider upgrading @supabase/auth-js if this is a known issue in 2.90.1
5. Add proper error boundary or suppress this specific abort error if benign
