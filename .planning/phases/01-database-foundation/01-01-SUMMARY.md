---
phase: 01-database-foundation
plan: 01
subsystem: database
tags: [postgresql, supabase, rls, migrations, enums, indexes]

# Dependency graph
requires: []
provides:
  - 15 database tables matching TypeScript type definitions
  - 8 PostgreSQL enums for type-safe constraints
  - Row-Level Security policies for user data isolation
  - Default subscription limits reference data
  - Database indexes for common query patterns
affects: [02-auth-provider, 03-stripe-integration, 04-openai-integration, 05-core-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RLS user isolation via auth.uid() = user_id"
    - "Admin role check via is_admin() helper function"
    - "Automatic updated_at via trigger functions"
    - "JSONB for flexible nested data (content, config)"

key-files:
  created:
    - app/supabase/migrations/20260116_001_initial_schema.sql
    - app/supabase/migrations/20260116_002_rls_policies.sql
  modified: []

key-decisions:
  - "Used PostgreSQL enums instead of text constraints for type safety"
  - "Created is_admin() helper function for reusable admin checks in RLS"
  - "Made credits_ledger and template_versions immutable (no update/delete)"
  - "Used JSONB for all flexible config fields to avoid schema changes"
  - "Inserted default subscription_limits in migration for immediate use"

patterns-established:
  - "RLS pattern: Users own their data via auth.uid() = user_id"
  - "RLS pattern: Published content readable by all authenticated users"
  - "RLS pattern: Admin-only writes checked via is_admin() function"
  - "Migration pattern: Schema first (001), then RLS (002)"

# Metrics
duration: 12min
completed: 2026-01-16
---

# Phase 1 Plan 1: Database Schema and RLS Summary

**PostgreSQL schema with 15 tables, 8 enums, and Row-Level Security policies enforcing user data isolation**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-16T10:30:00Z
- **Completed:** 2026-01-16T10:42:00Z
- **Tasks:** 3
- **Files created:** 2

## Accomplishments

- Created complete database schema matching all TypeScript interfaces in `app/types/database.ts`
- Implemented Row-Level Security on all 15 tables with user isolation policies
- Established admin role checking via `is_admin()` helper function
- Added automatic `updated_at` triggers for all mutable tables
- Inserted default subscription limits for free, plus, and pro plans

## Task Commits

Each task was committed atomically:

1. **Task 1: Create initial schema migration** - `381015b` (feat)
2. **Task 2: Create RLS policies migration** - `6ad60ae` (feat)
3. **Task 3: Verify schema alignment** - (verification only, no commit)

## Files Created/Modified

- `app/supabase/migrations/20260116_001_initial_schema.sql` - Complete database schema with 15 tables, 8 enums, indexes, and triggers
- `app/supabase/migrations/20260116_002_rls_policies.sql` - RLS policies for all tables with user isolation and admin access patterns

## Schema Overview

### Tables Created (15)

| Table | Purpose | RLS Pattern |
|-------|---------|-------------|
| `profiles` | User profiles linked to auth.users | User owns own data |
| `institutions` | Organizations (future use) | Creator/member access |
| `institution_members` | User-institution relationships | Member/admin access |
| `templates_global` | Admin-managed templates | Published read, admin write |
| `templates_personal` | User-owned templates | User owns own data |
| `template_versions` | Version history | Based on parent ownership |
| `brand_templates` | PDF export branding | User owns own data |
| `macro_categories` | Macro organization | User owns own data |
| `transcription_macros` | Text replacement shortcuts | User owns own data |
| `subscriptions` | Stripe subscription state | User owns own data |
| `subscription_limits` | Plan feature limits | Reference data, read-only |
| `credits_ledger` | Credit transactions | User owns own data, immutable |
| `report_sessions` | AI generation history | User owns own data, immutable |
| `transcribe_sessions` | Transcription history | User owns own data |
| `user_preferences` | User settings | User owns own data |

### Enums Created (8)

- `user_role` ('radiologist', 'admin')
- `subscription_plan` ('free', 'plus', 'pro')
- `subscription_status` ('active', 'trialing', 'past_due', 'canceled', 'incomplete')
- `template_type` ('global', 'personal')
- `transcribe_status` ('uploaded', 'processing', 'completed', 'deleted', 'failed')
- `credit_reason` ('allocation', 'debit', 'topup', 'refund')
- `letterhead_position` ('top', 'left', 'right')
- `institution_role` ('member', 'admin')

## Decisions Made

1. **PostgreSQL enums for type constraints** - More type-safe than text columns with CHECK constraints, matches TypeScript union types directly

2. **is_admin() helper function** - Reusable function for admin role checks across multiple RLS policies, reduces code duplication and ensures consistent admin detection

3. **Immutable audit tables** - `credits_ledger`, `report_sessions`, and `template_versions` have no UPDATE/DELETE policies to preserve audit trail integrity

4. **JSONB for config fields** - Used JSONB for `content`, `style_preferences`, `typography`, `colors`, `footer_config`, etc. to allow schema flexibility without migrations

5. **Default subscription_limits data** - Inserted during migration to ensure plans have limits immediately, preventing runtime errors on new deployments

6. **Automatic updated_at triggers** - All mutable tables have triggers to auto-update `updated_at` on any UPDATE, ensuring accurate timestamps without application logic

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

1. **Docker not running** - Could not apply migrations locally or generate Supabase types because Docker daemon was not running. Verification was done manually by comparing SQL schema with TypeScript interfaces.

2. **Pre-existing TypeScript errors** - The `pnpm typecheck` command failed with 58 pre-existing errors in the codebase, unrelated to database schema. These are documented in `.planning/codebase/CONCERNS.md` and need separate resolution.

## User Setup Required

**Database migration requires Supabase configuration.** Before the schema can be applied:

1. **Start Supabase locally:**
   ```bash
   cd app && supabase start
   ```
   (Requires Docker to be running)

2. **Apply migrations:**
   ```bash
   cd app && supabase db push
   ```

3. **Or for remote Supabase project:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

4. **Generate TypeScript types (optional):**
   ```bash
   npx supabase gen types typescript --local > types/supabase.ts
   ```

## Verification Checklist

- [x] Schema migration file created with valid PostgreSQL syntax
- [x] RLS policies migration file created with valid PostgreSQL syntax
- [x] All 15 tables defined with correct column types
- [x] All 8 enums defined matching TypeScript types
- [x] Foreign key constraints with proper cascade behavior
- [x] Indexes created for common query patterns
- [x] RLS enabled on all tables
- [x] User isolation policies (auth.uid() = user_id)
- [x] Admin access policies (is_admin() function)
- [x] Default subscription_limits data inserted
- [ ] Migrations applied to Supabase (requires Docker)
- [ ] Generated types match database.ts (requires Docker)

## Next Phase Readiness

**Ready for:**
- Phase 02 (Auth Provider): Schema supports user profiles, authentication state
- Phase 03 (Stripe Integration): Schema supports subscriptions, credits_ledger
- Phase 04 (OpenAI Integration): Schema supports report_sessions, transcribe_sessions

**Blockers:**
- Migrations must be applied before any database operations work
- Docker must be running for local Supabase development

**Recommendations:**
- Fix pre-existing TypeScript errors to enable clean type checking
- Apply migrations to a Supabase project before starting Phase 02

---
*Phase: 01-database-foundation*
*Completed: 2026-01-16*
