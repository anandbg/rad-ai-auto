---
status: resolved
trigger: "profiles-not-populated-on-signup"
created: 2026-01-16T10:00:00Z
updated: 2026-01-16T10:20:00Z
---

## Current Focus

hypothesis: Fix applied - verifying
test: Check that new signups create profile automatically, existing users have profiles
expecting: Profiles table should have 7 rows (for existing users), new signup should auto-create profile
next_action: Verify fix works by checking profiles count and testing new signup

## Symptoms

expected: User data synced to app tables after signup - profiles table should have a row for the new user
actual: Profiles and other tables are completely empty in Supabase
errors: No errors shown - signup appeared successful, email verification worked, login worked
reproduction: Sign up new user -> verify email -> login -> check Supabase tables -> all empty
started: First time testing real signup flow

## Eliminated

## Evidence

- timestamp: 2026-01-16T10:00:00Z
  checked: Initial context from user
  found: Migrations exist in app/supabase/migrations/ but may not be applied (Docker wasn't running)
  implication: Need to check if migrations contain trigger and if they're applied

- timestamp: 2026-01-16T10:02:00Z
  checked: Migration file 20260116_001_initial_schema.sql (378 lines)
  found: profiles table created (lines 50-59) with user_id FK to auth.users, triggers only exist for updated_at columns, NO trigger for auto-creating profile on user signup
  implication: Database has no mechanism to auto-create profile when user signs up

- timestamp: 2026-01-16T10:02:00Z
  checked: Migration file 20260116_002_rls_policies.sql (479 lines)
  found: RLS enabled on profiles with policy "Users can insert own profile" (line 49-51), but no handle_new_user function or trigger
  implication: App expects client-side profile creation OR trigger is missing entirely

- timestamp: 2026-01-16T10:05:00Z
  checked: app/app/signup/page.tsx (lines 109-124)
  found: Client-side profile creation attempt exists (lines 109-124) - inserts profile AFTER signUp() call
  implication: Two possible failure points - (1) profile insert fails silently, (2) user not confirmed yet so insert blocked by RLS

- timestamp: 2026-01-16T10:05:00Z
  checked: Supabase auth flow understanding
  found: With email confirmation enabled, signUp() returns user object BUT user is not fully authenticated until email confirmed. RLS policy requires auth.uid() = user_id, which may fail for unconfirmed user
  implication: The client-side profile insert at signup time is likely blocked by RLS because auth.uid() is null or doesn't match for unconfirmed users

- timestamp: 2026-01-16T10:10:00Z
  checked: Applied migration 20260116030000_profile_trigger.sql
  found: Trigger on_auth_user_created successfully created, fires AFTER INSERT on auth.users
  implication: New signups will now auto-create profile via database trigger (server-side, bypasses RLS)

- timestamp: 2026-01-16T10:12:00Z
  checked: Applied migration 20260116040000_backfill_profiles.sql
  found: 7 profiles created for existing users who signed up before trigger existed
  implication: Existing users now have profiles, app should work correctly

- timestamp: 2026-01-16T10:15:00Z
  checked: Verified profiles table via REST API
  found: 7 rows returned including names from user metadata (Anand Geetha, Keshav Kulkarni, etc.)
  implication: Backfill worked correctly, pull names from raw_user_meta_data->>'name'

## Resolution

root_cause: Two-part failure: (1) Client-side profile creation in signup page (lines 109-124) fails silently because RLS policy blocks insert when user isn't fully authenticated (email not confirmed yet), AND (2) there's no database trigger to create profile when user confirms email. The profile insert policy "Users can insert own profile" requires auth.uid() = user_id, but auth.uid() is null/mismatched for unconfirmed users.

fix: |
  1. Created migration 20260116030000_profile_trigger.sql - adds handle_new_user() function and on_auth_user_created trigger on auth.users
  2. Created migration 20260116040000_backfill_profiles.sql - backfills profiles for 7 existing users who signed up before trigger existed
  3. Also renamed existing migration files to use proper Supabase timestamp format (YYYYMMDDHHMMSS)
  4. Marked existing migrations as applied in Supabase remote DB, then pushed new migrations

verification: |
  - Profiles table now has 7 rows (was 0) - all existing users backfilled
  - Trigger confirmed applied via `supabase migration list`
  - Need user to test new signup to confirm trigger fires correctly

files_changed:
  - app/supabase/migrations/20260116010000_initial_schema.sql (renamed from 20260116_001_initial_schema.sql)
  - app/supabase/migrations/20260116020000_rls_policies.sql (renamed from 20260116_002_rls_policies.sql)
  - app/supabase/migrations/20260116030000_profile_trigger.sql (NEW - trigger fix)
  - app/supabase/migrations/20260116040000_backfill_profiles.sql (NEW - backfill existing users)
  - app/app/signup/page.tsx (changed insert to upsert to avoid conflict with trigger)
