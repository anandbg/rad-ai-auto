---
created: 2026-01-18T11:21
title: Add Google OAuth authentication
area: auth
files:
  - app/lib/supabase/client.ts
  - app/lib/auth/
---

## Problem

Currently, the application only supports email/password authentication. Users expect modern social login options, particularly Google/Gmail OAuth, for faster onboarding and better UX.

Benefits:
- Faster signup/login flow (no password creation)
- Improved trust and security (OAuth 2.0)
- Reduced friction for radiologists who use Google Workspace
- Better mobile experience (native Google sign-in)

## Solution

Implement Google OAuth provider via Supabase Auth alongside existing email/password authentication.

**Implementation steps:**

1. **Supabase Configuration:**
   - Enable Google provider in Supabase dashboard
   - Configure OAuth credentials (Client ID, Client Secret from Google Cloud Console)
   - Set authorized redirect URIs

2. **Code Changes:**
   - Update `app/lib/supabase/client.ts` to add Google sign-in method
   - Add "Continue with Google" button to login/signup UI
   - Ensure RLS policies work for OAuth users (check profile creation trigger)
   - Handle OAuth callback route if not already present

3. **User Experience:**
   - Add Google button to login page with proper branding
   - Maintain existing email/password option
   - Handle edge cases (existing email via password trying to login with Google)
   - Ensure profile is created/linked on first OAuth login

4. **Testing:**
   - Test OAuth flow end-to-end
   - Verify profile creation for new OAuth users
   - Test switching between auth methods with same email
   - Verify session persistence

**Reference:**
- Supabase docs: https://supabase.com/docs/guides/auth/social-login/auth-google
- Existing auth: `app/lib/auth/` (if mock-auth was removed, check current structure)
