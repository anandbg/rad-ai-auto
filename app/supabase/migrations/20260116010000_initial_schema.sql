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
