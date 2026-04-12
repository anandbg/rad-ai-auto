
-- ============================================
-- Migration: 20260116010000_initial_schema.sql
-- ============================================
-- Migration: 20260116_001_initial_schema
-- Description: Create initial database schema for AI Radiologist application
-- Phase: 01-database-foundation, Plan: 01, Task: 1

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles
CREATE TYPE user_role AS ENUM ('radiologist', 'admin');

-- Subscription plans
CREATE TYPE subscription_plan AS ENUM ('free', 'plus', 'pro');

-- Subscription status
CREATE TYPE subscription_status AS ENUM (
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete'
);

-- Template type
CREATE TYPE template_type AS ENUM ('global', 'personal');

-- Transcription status
CREATE TYPE transcribe_status AS ENUM (
  'uploaded',
  'processing',
  'completed',
  'deleted',
  'failed'
);

-- Credit transaction reason
CREATE TYPE credit_reason AS ENUM ('allocation', 'debit', 'topup', 'refund');

-- Letterhead position
CREATE TYPE letterhead_position AS ENUM ('top', 'left', 'right');

-- Institution member role
CREATE TYPE institution_role AS ENUM ('member', 'admin');

-- ============================================================================
-- TABLES (in dependency order)
-- ============================================================================

-- 1. Profiles - User profiles linked to auth.users
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  specialty TEXT,
  institution TEXT,
  institution_id UUID,
  role user_role NOT NULL DEFAULT 'radiologist',
  style_preferences JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for primary lookup
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- 2. Institutions - Organizations (future use)
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  branding_defaults JSONB,
  billing_email TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for institution lookups
CREATE INDEX idx_institutions_created_by ON institutions(created_by);

-- Add foreign key from profiles to institutions after institutions table exists
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_institution
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL;

-- 3. Institution members - User-institution relationships
CREATE TABLE institution_members (
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role institution_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (institution_id, user_id)
);

-- Index for user membership lookups
CREATE INDEX idx_institution_members_user_id ON institution_members(user_id);

-- 4. Templates global - Admin-managed global templates
CREATE TABLE templates_global (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  modality TEXT NOT NULL,
  body_part TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for published template filtering
CREATE INDEX idx_templates_global_is_published ON templates_global(is_published);
CREATE INDEX idx_templates_global_modality ON templates_global(modality);
CREATE INDEX idx_templates_global_body_part ON templates_global(body_part);

-- 5. Templates personal - User-owned templates
CREATE TABLE templates_personal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origin_global_id UUID REFERENCES templates_global(id) ON DELETE SET NULL,
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  name TEXT NOT NULL,
  modality TEXT NOT NULL,
  body_part TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user template listing
CREATE INDEX idx_templates_personal_user_id ON templates_personal(user_id);
CREATE INDEX idx_templates_personal_modality ON templates_personal(modality);
CREATE INDEX idx_templates_personal_is_default ON templates_personal(user_id, is_default);

-- 6. Template versions - Version history for templates
CREATE TABLE template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL,
  template_type template_type NOT NULL,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for template version lookups
CREATE INDEX idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX idx_template_versions_lookup ON template_versions(template_id, template_type);

-- 7. Brand templates - User branding configurations
CREATE TABLE brand_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  letterhead_url TEXT,
  letterhead_position letterhead_position NOT NULL DEFAULT 'top',
  letterhead_size JSONB,
  typography JSONB,
  colors JSONB,
  footer_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user brand template listing
CREATE INDEX idx_brand_templates_user_id ON brand_templates(user_id);
CREATE INDEX idx_brand_templates_is_default ON brand_templates(user_id, is_default);

-- 8. Macro categories - Macro organization
CREATE TABLE macro_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES macro_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user macro category listing
CREATE INDEX idx_macro_categories_user_id ON macro_categories(user_id);
CREATE INDEX idx_macro_categories_parent ON macro_categories(parent_id);

-- 9. Transcription macros - Text replacement shortcuts
CREATE TABLE transcription_macros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES macro_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  replacement_text TEXT NOT NULL,
  is_global BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_smart BOOLEAN NOT NULL DEFAULT false,
  smart_context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user macro listing
CREATE INDEX idx_transcription_macros_user_id ON transcription_macros(user_id);
CREATE INDEX idx_transcription_macros_category ON transcription_macros(category_id);
CREATE INDEX idx_transcription_macros_active ON transcription_macros(user_id, is_active);

-- 10. Subscriptions - Stripe subscription state
CREATE TABLE subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for Stripe customer lookups
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- 11. Subscription limits - Plan feature limits (reference table)
CREATE TABLE subscription_limits (
  plan subscription_plan PRIMARY KEY,
  max_reports_per_month INTEGER NOT NULL,
  max_transcriptions_per_month INTEGER NOT NULL,
  max_transcription_minutes INTEGER NOT NULL,
  max_personal_templates INTEGER NOT NULL,
  max_brand_templates INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '{}'
);

-- Insert default subscription limits
INSERT INTO subscription_limits (plan, max_reports_per_month, max_transcriptions_per_month, max_transcription_minutes, max_personal_templates, max_brand_templates, features)
VALUES
  ('free', 10, 5, 30, 5, 1, '{"advanced_export": false, "custom_branding": false, "priority_support": false}'),
  ('plus', 100, 50, 300, 25, 5, '{"advanced_export": true, "custom_branding": true, "priority_support": false}'),
  ('pro', -1, -1, -1, -1, -1, '{"advanced_export": true, "custom_branding": true, "priority_support": true}');

-- 12. Credits ledger - Credit transactions
CREATE TABLE credits_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason credit_reason NOT NULL,
  meta JSONB,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);

-- Index for usage queries
CREATE INDEX idx_credits_ledger_user_id ON credits_ledger(user_id);
CREATE INDEX idx_credits_ledger_user_created ON credits_ledger(user_id, created_at);

-- 13. Report sessions - AI generation history
CREATE TABLE report_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL,
  template_ref JSONB NOT NULL,
  options JSONB,
  model TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  credits_consumed INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user report history
CREATE INDEX idx_report_sessions_user_id ON report_sessions(user_id);
CREATE INDEX idx_report_sessions_user_created ON report_sessions(user_id, created_at);

-- 14. Transcribe sessions - Whisper transcription history
CREATE TABLE transcribe_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL,
  status transcribe_status NOT NULL DEFAULT 'uploaded',
  storage_bytes INTEGER NOT NULL DEFAULT 0,
  storage_expires_at TIMESTAMPTZ NOT NULL,
  encryption TEXT NOT NULL,
  nonce_b64 TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Index for user transcription history
CREATE INDEX idx_transcribe_sessions_user_id ON transcribe_sessions(user_id);
CREATE INDEX idx_transcribe_sessions_session_id ON transcribe_sessions(session_id);
CREATE INDEX idx_transcribe_sessions_status ON transcribe_sessions(user_id, status);

-- 15. User preferences - User settings
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  default_template_id UUID REFERENCES templates_personal(id) ON DELETE SET NULL,
  default_brand_template_id UUID REFERENCES brand_templates(id) ON DELETE SET NULL,
  yolo_mode_enabled BOOLEAN NOT NULL DEFAULT false,
  keyboard_shortcuts_enabled BOOLEAN NOT NULL DEFAULT true,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_institutions_updated_at
  BEFORE UPDATE ON institutions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_global_updated_at
  BEFORE UPDATE ON templates_global
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_personal_updated_at
  BEFORE UPDATE ON templates_personal
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_templates_updated_at
  BEFORE UPDATE ON brand_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcription_macros_updated_at
  BEFORE UPDATE ON transcription_macros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcribe_sessions_updated_at
  BEFORE UPDATE ON transcribe_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles linked to Supabase auth.users';
COMMENT ON TABLE institutions IS 'Organizations for institutional accounts (future use)';
COMMENT ON TABLE institution_members IS 'User-institution membership relationships';
COMMENT ON TABLE templates_global IS 'Admin-managed global report templates';
COMMENT ON TABLE templates_personal IS 'User-owned personal report templates';
COMMENT ON TABLE template_versions IS 'Version history for templates';
COMMENT ON TABLE brand_templates IS 'User branding configurations for PDF export';
COMMENT ON TABLE macro_categories IS 'Categories for organizing transcription macros';
COMMENT ON TABLE transcription_macros IS 'Text replacement shortcuts for transcription';
COMMENT ON TABLE subscriptions IS 'Stripe subscription state for billing';
COMMENT ON TABLE subscription_limits IS 'Feature limits per subscription plan';
COMMENT ON TABLE credits_ledger IS 'Credit transaction history for usage tracking';
COMMENT ON TABLE report_sessions IS 'AI report generation history';
COMMENT ON TABLE transcribe_sessions IS 'Whisper transcription session history';
COMMENT ON TABLE user_preferences IS 'User application settings and preferences';

-- ============================================
-- Migration: 20260116020000_rls_policies.sql
-- ============================================
-- Migration: 20260116_002_rls_policies
-- Description: Enable Row-Level Security and create access policies
-- Phase: 01-database-foundation, Plan: 01, Task: 2

-- ============================================================================
-- ENABLE ROW-LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_macros ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcribe_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS and avoid recursion)
-- ============================================================================

-- Check if current user is admin (app-level admin role)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is admin of a specific institution
-- Uses SECURITY DEFINER to bypass RLS on institution_members (avoids infinite recursion)
CREATE OR REPLACE FUNCTION is_institution_admin(inst_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM institution_members
    WHERE institution_members.institution_id = inst_id
    AND institution_members.user_id = auth.uid()
    AND institution_members.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is a member of a specific institution
-- Uses SECURITY DEFINER to bypass RLS on institution_members (avoids infinite recursion)
CREATE OR REPLACE FUNCTION is_institution_member(inst_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM institution_members
    WHERE institution_members.institution_id = inst_id
    AND institution_members.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROFILES POLICIES
-- User can only access their own profile
-- ============================================================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- ============================================================================
-- INSTITUTIONS POLICIES
-- Members can view their institution, admin can manage
-- ============================================================================

CREATE POLICY "Members can view their institution"
  ON institutions FOR SELECT
  USING (
    is_institution_member(institutions.id)
    OR created_by = auth.uid()
  );

CREATE POLICY "Creator can insert institution"
  ON institutions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Institution admin can update"
  ON institutions FOR UPDATE
  USING (
    is_institution_admin(institutions.id)
    OR created_by = auth.uid()
  );

CREATE POLICY "Institution admin can delete"
  ON institutions FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- INSTITUTION MEMBERS POLICIES
-- Members can view membership, institution admin can manage
-- ============================================================================

CREATE POLICY "Members can view own membership"
  ON institution_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Institution admin can view all members"
  ON institution_members FOR SELECT
  USING (
    -- Use SECURITY DEFINER function to avoid infinite recursion
    is_institution_admin(institution_members.institution_id)
  );

CREATE POLICY "Institution admin can add members"
  ON institution_members FOR INSERT
  WITH CHECK (
    -- Use SECURITY DEFINER function to avoid infinite recursion
    is_institution_admin(institution_members.institution_id)
    OR (
      -- Creator of institution can add first member
      EXISTS (
        SELECT 1 FROM institutions
        WHERE institutions.id = institution_members.institution_id
        AND institutions.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Institution admin can remove members"
  ON institution_members FOR DELETE
  USING (
    -- Use SECURITY DEFINER function to avoid infinite recursion
    is_institution_admin(institution_members.institution_id)
    OR user_id = auth.uid()  -- Users can leave
  );

-- ============================================================================
-- TEMPLATES GLOBAL POLICIES
-- All authenticated users can read published templates
-- Only admins can manage global templates
-- ============================================================================

CREATE POLICY "Anyone can view published global templates"
  ON templates_global FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all global templates"
  ON templates_global FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert global templates"
  ON templates_global FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update global templates"
  ON templates_global FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete global templates"
  ON templates_global FOR DELETE
  USING (is_admin());

-- ============================================================================
-- TEMPLATES PERSONAL POLICIES
-- User can only CRUD their own personal templates
-- ============================================================================

CREATE POLICY "Users can view own personal templates"
  ON templates_personal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared templates from their institution"
  ON templates_personal FOR SELECT
  USING (
    is_shared = true
    AND institution_id IS NOT NULL
    -- Use SECURITY DEFINER function to avoid infinite recursion on institution_members
    AND is_institution_member(templates_personal.institution_id)
  );

CREATE POLICY "Users can insert own personal templates"
  ON templates_personal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal templates"
  ON templates_personal FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own personal templates"
  ON templates_personal FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TEMPLATE VERSIONS POLICIES
-- Access based on parent template ownership
-- ============================================================================

CREATE POLICY "Users can view versions of own personal templates"
  ON template_versions FOR SELECT
  USING (
    template_type = 'personal'
    AND EXISTS (
      SELECT 1 FROM templates_personal
      WHERE templates_personal.id = template_versions.template_id
      AND templates_personal.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view versions of published global templates"
  ON template_versions FOR SELECT
  USING (
    template_type = 'global'
    AND EXISTS (
      SELECT 1 FROM templates_global
      WHERE templates_global.id = template_versions.template_id
      AND templates_global.is_published = true
    )
  );

CREATE POLICY "Admins can view all template versions"
  ON template_versions FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can insert versions of own personal templates"
  ON template_versions FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (
      (template_type = 'personal' AND EXISTS (
        SELECT 1 FROM templates_personal
        WHERE templates_personal.id = template_versions.template_id
        AND templates_personal.user_id = auth.uid()
      ))
      OR (template_type = 'global' AND is_admin())
    )
  );

CREATE POLICY "Admins can insert global template versions"
  ON template_versions FOR INSERT
  WITH CHECK (
    template_type = 'global'
    AND is_admin()
    AND auth.uid() = created_by
  );

-- No update/delete on versions - they are immutable history

-- ============================================================================
-- BRAND TEMPLATES POLICIES
-- User can only CRUD their own brand templates
-- ============================================================================

CREATE POLICY "Users can view own brand templates"
  ON brand_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand templates"
  ON brand_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand templates"
  ON brand_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand templates"
  ON brand_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- MACRO CATEGORIES POLICIES
-- User can only CRUD their own macro categories
-- ============================================================================

CREATE POLICY "Users can view own macro categories"
  ON macro_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own macro categories"
  ON macro_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own macro categories"
  ON macro_categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own macro categories"
  ON macro_categories FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRANSCRIPTION MACROS POLICIES
-- User can only CRUD their own macros
-- ============================================================================

CREATE POLICY "Users can view own transcription macros"
  ON transcription_macros FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcription macros"
  ON transcription_macros FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcription macros"
  ON transcription_macros FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcription macros"
  ON transcription_macros FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SUBSCRIPTIONS POLICIES
-- User can only access their own subscription
-- ============================================================================

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No delete policy - subscriptions are managed by Stripe webhooks

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (is_admin());

-- ============================================================================
-- SUBSCRIPTION LIMITS POLICIES
-- All authenticated users can read (reference data)
-- Only admins can modify
-- ============================================================================

CREATE POLICY "All authenticated users can view subscription limits"
  ON subscription_limits FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert subscription limits"
  ON subscription_limits FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update subscription limits"
  ON subscription_limits FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete subscription limits"
  ON subscription_limits FOR DELETE
  USING (is_admin());

-- ============================================================================
-- CREDITS LEDGER POLICIES
-- User can only access their own credit entries
-- ============================================================================

CREATE POLICY "Users can view own credits ledger"
  ON credits_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits ledger"
  ON credits_ledger FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No update/delete - credit entries are immutable audit log

-- Admins can view all credit entries
CREATE POLICY "Admins can view all credits ledger"
  ON credits_ledger FOR SELECT
  USING (is_admin());

-- ============================================================================
-- REPORT SESSIONS POLICIES
-- User can only access their own report sessions
-- ============================================================================

CREATE POLICY "Users can view own report sessions"
  ON report_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own report sessions"
  ON report_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No update/delete - report sessions are immutable history

-- Admins can view all report sessions
CREATE POLICY "Admins can view all report sessions"
  ON report_sessions FOR SELECT
  USING (is_admin());

-- ============================================================================
-- TRANSCRIBE SESSIONS POLICIES
-- User can only access their own transcribe sessions
-- ============================================================================

CREATE POLICY "Users can view own transcribe sessions"
  ON transcribe_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcribe sessions"
  ON transcribe_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcribe sessions"
  ON transcribe_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No delete - sessions are soft-deleted via deleted_at

-- Admins can view all transcribe sessions
CREATE POLICY "Admins can view all transcribe sessions"
  ON transcribe_sessions FOR SELECT
  USING (is_admin());

-- ============================================================================
-- USER PREFERENCES POLICIES
-- User can only access their own preferences
-- ============================================================================

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SERVICE ROLE BYPASS
-- Note: The service role key (used by backend/webhooks) bypasses RLS by default
-- This is correct behavior - webhooks and server-side operations need full access
-- ============================================================================

-- Add comments for documentation
COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user has admin role. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION is_institution_admin(UUID) IS 'Check if current user is admin of given institution. Uses SECURITY DEFINER to bypass RLS on institution_members and avoid infinite recursion.';
COMMENT ON FUNCTION is_institution_member(UUID) IS 'Check if current user is member of given institution. Uses SECURITY DEFINER to bypass RLS on institution_members and avoid infinite recursion.';

-- ============================================
-- Migration: 20260116030000_profile_trigger.sql
-- ============================================
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

-- ============================================
-- Migration: 20260116040000_backfill_profiles.sql
-- ============================================
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

-- ============================================
-- Migration: 20260119000000_fix_rls_recursion.sql
-- ============================================
-- Migration: 20260119000000_fix_rls_recursion
-- Description: Fix infinite recursion in institution_members RLS policies
-- Root cause: Self-referential policies querying institution_members within their own USING clause

-- ============================================================================
-- CREATE SECURITY DEFINER HELPER FUNCTIONS
-- These bypass RLS when checking institution membership to avoid recursion
-- ============================================================================

-- Check if current user is admin of a specific institution
CREATE OR REPLACE FUNCTION is_institution_admin(inst_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM institution_members
    WHERE institution_members.institution_id = inst_id
    AND institution_members.user_id = auth.uid()
    AND institution_members.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is a member of a specific institution
CREATE OR REPLACE FUNCTION is_institution_member(inst_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM institution_members
    WHERE institution_members.institution_id = inst_id
    AND institution_members.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DROP AND RECREATE PROBLEMATIC POLICIES
-- ============================================================================

-- Drop old policies that caused recursion
DROP POLICY IF EXISTS "Institution admin can view all members" ON institution_members;
DROP POLICY IF EXISTS "Institution admin can add members" ON institution_members;
DROP POLICY IF EXISTS "Institution admin can remove members" ON institution_members;
DROP POLICY IF EXISTS "Members can view their institution" ON institutions;
DROP POLICY IF EXISTS "Institution admin can update" ON institutions;
DROP POLICY IF EXISTS "Users can view shared templates from their institution" ON templates_personal;

-- Recreate institution_members policies using helper functions
CREATE POLICY "Institution admin can view all members"
  ON institution_members FOR SELECT
  USING (
    is_institution_admin(institution_members.institution_id)
  );

CREATE POLICY "Institution admin can add members"
  ON institution_members FOR INSERT
  WITH CHECK (
    is_institution_admin(institution_members.institution_id)
    OR (
      EXISTS (
        SELECT 1 FROM institutions
        WHERE institutions.id = institution_members.institution_id
        AND institutions.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Institution admin can remove members"
  ON institution_members FOR DELETE
  USING (
    is_institution_admin(institution_members.institution_id)
    OR user_id = auth.uid()
  );

-- Recreate institutions policies using helper functions
CREATE POLICY "Members can view their institution"
  ON institutions FOR SELECT
  USING (
    is_institution_member(institutions.id)
    OR created_by = auth.uid()
  );

CREATE POLICY "Institution admin can update"
  ON institutions FOR UPDATE
  USING (
    is_institution_admin(institutions.id)
    OR created_by = auth.uid()
  );

-- Recreate templates_personal policy using helper function
CREATE POLICY "Users can view shared templates from their institution"
  ON templates_personal FOR SELECT
  USING (
    is_shared = true
    AND institution_id IS NOT NULL
    AND is_institution_member(templates_personal.institution_id)
  );

-- Add comments
COMMENT ON FUNCTION is_institution_admin(UUID) IS 'Check if current user is admin of given institution. Uses SECURITY DEFINER to bypass RLS on institution_members and avoid infinite recursion.';
COMMENT ON FUNCTION is_institution_member(UUID) IS 'Check if current user is member of given institution. Uses SECURITY DEFINER to bypass RLS on institution_members and avoid infinite recursion.';

-- ============================================
-- Migration: 20260120000000_add_terms_acknowledged.sql
-- ============================================
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

-- ============================================
-- Migration: 20260120100000_add_list_style_preferences.sql
-- ============================================
-- Migration: Add list_style_preferences to user_preferences table
-- Purpose: Allow users to customize list styles per report section

-- Add JSONB column for list style preferences with default values
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS list_style_preferences JSONB DEFAULT '{
  "clinicalInfo": "bullet",
  "technique": "bullet",
  "comparison": "bullet",
  "findings": "bullet",
  "impression": "bullet"
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN user_preferences.list_style_preferences IS 'JSON object with list style preferences per report section (clinicalInfo, technique, comparison, findings, impression). Values: bullet, dash, arrow, numbered, none';

-- ============================================
-- Migration: 20260122000000_stripe_webhook_events.sql
-- ============================================
-- Track processed Stripe webhook events for idempotency
-- Prevents duplicate processing if Stripe retries delivery

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE, -- Stripe event ID (evt_xxx)
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB, -- Optional: store event data for debugging
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups by event_id
CREATE INDEX idx_stripe_webhook_events_event_id ON stripe_webhook_events(event_id);

-- Clean up old events after 30 days (optional maintenance)
-- This can be done via a scheduled job or manual cleanup

COMMENT ON TABLE stripe_webhook_events IS 'Tracks processed Stripe webhook events for idempotency';

-- ============================================
-- Migration: 20260407000000_stripe_idempotency_and_invoices.sql
-- ============================================
-- 1. Make processed_at NULLable so we can insert "received but not yet processed"
--    rows. The previous schema had `NOT NULL DEFAULT NOW()` which made every
--    insert look "processed", causing failed events to be skipped on retry.
ALTER TABLE stripe_webhook_events
  ALTER COLUMN processed_at DROP NOT NULL,
  ALTER COLUMN processed_at DROP DEFAULT;

-- Backfill: any existing rows are assumed processed (historical data).
UPDATE stripe_webhook_events SET processed_at = COALESCE(processed_at, created_at);

-- 2. New table for invoice records (created on invoice.payment_succeeded).
CREATE TABLE IF NOT EXISTS stripe_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id TEXT NOT NULL UNIQUE,           -- in_xxx
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,                       -- nullable (one-off invoices)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_paid INTEGER NOT NULL,                      -- in minor units (pence)
  currency TEXT NOT NULL,
  status TEXT NOT NULL,                              -- paid, open, void, etc.
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  hosted_invoice_url TEXT,
  invoice_pdf TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_invoices_customer ON stripe_invoices(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_user ON stripe_invoices(user_id);

COMMENT ON TABLE stripe_invoices IS 'Persisted invoice records from Stripe invoice.payment_succeeded webhooks';
