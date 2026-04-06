-- Migration: 20260116_003_profile_trigger
-- Description: Add trigger to automatically create profile when user signs up
-- Fixes: profiles-not-populated-on-signup bug

-- ============================================================================
-- FUNCTION: Handle new user signup
-- Creates a profile row automatically when a user is inserted into auth.users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'radiologist'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Create profile on auth.users INSERT
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile row when a new user signs up via Supabase Auth';
