-- Migration: 20260120000000_add_terms_acknowledged
-- Description: Add terms acknowledgment tracking to profiles
-- Phase: 22-sign-up-acknowledgment, Plan: 02, Task: 1

-- Add column to track when user acknowledged terms
ALTER TABLE profiles
  ADD COLUMN terms_acknowledged_at TIMESTAMPTZ;

-- Index for quick lookup of unacknowledged users (optional, for admin queries)
CREATE INDEX idx_profiles_terms_acknowledged ON profiles(terms_acknowledged_at)
  WHERE terms_acknowledged_at IS NULL;

COMMENT ON COLUMN profiles.terms_acknowledged_at IS
  'Timestamp when user acknowledged first-use terms modal. NULL = not yet acknowledged.';
