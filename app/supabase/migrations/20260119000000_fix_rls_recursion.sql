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
