---
status: verifying
trigger: "institution-members-rls-recursion - PostgreSQL error 42P17 infinite recursion in policy for relation institution_members when fetching templates"
created: 2026-01-18T00:00:00Z
updated: 2026-01-18T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED - Fix applied using SECURITY DEFINER helper functions
test: Modified migration file with helper functions to break recursion
expecting: Templates API should work without infinite recursion error
next_action: User needs to reset and reapply Supabase migrations to test the fix

## Symptoms

expected: Templates API should return templates without errors
actual: Error "infinite recursion detected in policy for relation 'institution_members'" with code 42P17
errors: PostgreSQL error 42P17 appearing in terminal when hitting /api/templates/list endpoint
reproduction: Load the dashboard or any page that fetches templates
started: Just started today, was working before

## Eliminated

## Evidence

- timestamp: 2026-01-18T00:01:00Z
  checked: /api/templates/list route handler
  found: Route queries templates_personal and templates_global tables, plus profiles table
  implication: The recursion happens when checking RLS policies during these queries

- timestamp: 2026-01-18T00:02:00Z
  checked: 20260116020000_rls_policies.sql lines 112-121
  found: |
    Policy "Institution admin can view all members" on institution_members:
    ```sql
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
    ```
    This policy queries institution_members while being a policy ON institution_members - infinite recursion!
  implication: ROOT CAUSE IDENTIFIED - self-referential RLS policy

- timestamp: 2026-01-18T00:03:00Z
  checked: templates_personal SELECT policy at lines 190-200
  found: |
    Policy "Users can view shared templates from their institution" queries institution_members:
    ```sql
    AND EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = templates_personal.institution_id
      AND institution_members.user_id = auth.uid()
    )
    ```
    When templates_personal query runs, it triggers institution_members RLS, which triggers the recursive policy
  implication: Chain is: templates_personal query -> institution_members RLS -> recursive self-reference

## Resolution

root_cause: |
  The "Institution admin can view all members" policy on institution_members table (lines 112-121 in
  20260116020000_rls_policies.sql) contains a self-referential subquery that causes infinite recursion.

  When any query touches institution_members (directly or via another table's RLS policy like
  templates_personal's "view shared templates" policy), PostgreSQL evaluates the RLS policies.
  The "admin can view all members" policy does `SELECT FROM institution_members AS im` which
  triggers RLS evaluation again, causing infinite recursion.

fix: |
  Added two SECURITY DEFINER helper functions:
  1. is_institution_admin(inst_id UUID) - checks if user is admin of institution
  2. is_institution_member(inst_id UUID) - checks if user is member of institution

  Updated the following policies to use these functions instead of self-referential subqueries:
  - institutions: "Members can view their institution" - now uses is_institution_member()
  - institutions: "Institution admin can update" - now uses is_institution_admin()
  - institution_members: "Institution admin can view all members" - now uses is_institution_admin()
  - institution_members: "Institution admin can add members" - now uses is_institution_admin()
  - institution_members: "Institution admin can remove members" - now uses is_institution_admin()
  - templates_personal: "Users can view shared templates from their institution" - now uses is_institution_member()

verification: Pending - need to apply migration and test /api/templates/list
files_changed:
  - app/supabase/migrations/20260116020000_rls_policies.sql
