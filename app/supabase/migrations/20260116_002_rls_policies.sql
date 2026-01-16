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
-- HELPER FUNCTION: Check if current user is admin
-- ============================================================================

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
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institutions.id
      AND institution_members.user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Creator can insert institution"
  ON institutions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Institution admin can update"
  ON institutions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institutions.id
      AND institution_members.user_id = auth.uid()
      AND institution_members.role = 'admin'
    )
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
    EXISTS (
      SELECT 1 FROM institution_members AS im
      WHERE im.institution_id = institution_members.institution_id
      AND im.user_id = auth.uid()
      AND im.role = 'admin'
    )
  );

CREATE POLICY "Institution admin can add members"
  ON institution_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM institution_members AS im
      WHERE im.institution_id = institution_members.institution_id
      AND im.user_id = auth.uid()
      AND im.role = 'admin'
    )
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
    EXISTS (
      SELECT 1 FROM institution_members AS im
      WHERE im.institution_id = institution_members.institution_id
      AND im.user_id = auth.uid()
      AND im.role = 'admin'
    )
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
    AND EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = templates_personal.institution_id
      AND institution_members.user_id = auth.uid()
    )
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

-- Add comment for documentation
COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user has admin role. Used in RLS policies.';
