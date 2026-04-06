-- Migration: 20260116040000_backfill_profiles
-- Description: Backfill profiles for any existing users who signed up before trigger was created
-- One-time fix for profiles-not-populated-on-signup bug

-- Insert profiles for any existing auth.users who don't have a profile yet
INSERT INTO public.profiles (user_id, name, role)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  'radiologist'::user_role
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.users.id
);

-- Add comment
COMMENT ON TABLE profiles IS 'User profiles linked to Supabase auth.users. Auto-created by on_auth_user_created trigger.';
