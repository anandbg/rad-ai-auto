# Codebase Structure

**Analysis Date:** 2025-01-16

## Directory Layout

```
rad-ai-auto/
├── app/                          # Next.js 14 application root
│   ├── app/                      # App Router directory (pages, layouts, API routes)
│   │   ├── (protected)/          # Route group: requires authentication
│   │   │   ├── admin/            # Admin-only pages (users, templates, institutions)
│   │   │   ├── billing/          # Subscription management
│   │   │   ├── brand-templates/  # PDF branding templates
│   │   │   ├── dashboard/        # User dashboard
│   │   │   ├── generate/         # Report generation
│   │   │   ├── macros/           # Transcription macros
│   │   │   ├── productivity/     # Usage statistics
│   │   │   ├── settings/         # User settings
│   │   │   ├── templates/        # Report templates CRUD
│   │   │   ├── transcribe/       # Audio transcription
│   │   │   ├── welcome/          # Onboarding flow
│   │   │   └── layout.tsx        # Protected layout with sidebar
│   │   ├── api/                  # API Route handlers
│   │   │   ├── admin/            # Admin endpoints
│   │   │   ├── billing/          # Billing endpoints
│   │   │   ├── stripe/           # Stripe webhooks
│   │   │   └── templates/        # Template endpoints
│   │   ├── forgot-password/      # Password reset request
│   │   ├── login/                # Login page
│   │   ├── reset-password/       # Password reset form
│   │   ├── signup/               # Registration page
│   │   ├── verify-email/         # Email verification
│   │   ├── layout.tsx            # Root layout (providers)
│   │   └── page.tsx              # Landing page
│   ├── components/               # Reusable React components
│   │   ├── ui/                   # UI primitives (button, card, dialog, etc.)
│   │   ├── layout/               # Layout components (sidebar)
│   │   └── features/             # Feature-specific components (empty)
│   ├── lib/                      # Shared utilities and services
│   │   ├── auth/                 # Authentication (context, CSRF, session)
│   │   ├── edge/                 # Edge runtime utilities (empty)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── preferences/          # User preferences context
│   │   ├── server/               # Server-only utilities (empty)
│   │   ├── shared/               # Shared utilities (cn.ts)
│   │   ├── storage/              # Storage utilities (IndexedDB)
│   │   ├── supabase/             # Supabase client configurations
│   │   └── validation/           # Zod validation schemas
│   ├── types/                    # TypeScript type definitions
│   ├── tests/                    # Test files
│   │   ├── unit/                 # Unit tests (Vitest)
│   │   └── e2e/                  # E2E tests (Playwright)
│   ├── supabase/                 # Supabase config
│   │   └── migrations/           # Database migrations (empty)
│   ├── styles/                   # Global styles
│   │   └── globals.css           # CSS with design tokens
│   ├── public/                   # Static assets
│   ├── middleware.ts             # Next.js middleware (auth)
│   ├── package.json              # Dependencies
│   ├── tsconfig.json             # TypeScript config
│   ├── tailwind.config.ts        # Tailwind config
│   ├── vitest.config.ts          # Vitest config
│   └── playwright.config.ts      # Playwright config
├── .planning/                    # Planning and documentation
│   └── codebase/                 # Architecture documentation
├── .auto-claude/                 # Auto-Claude tooling
└── CLAUDE.md                     # Project instructions
```

## Directory Purposes

**`app/app/` (App Router):**
- Purpose: Next.js 14 App Router pages, layouts, and API routes
- Contains: `page.tsx`, `layout.tsx`, `route.ts` files
- Key files:
  - `app/app/layout.tsx` - Root layout with providers
  - `app/app/(protected)/layout.tsx` - Authenticated layout with sidebar

**`app/app/(protected)/`:**
- Purpose: All routes requiring authentication
- Contains: Feature pages organized by domain
- Key files:
  - `dashboard/page.tsx` - Main dashboard
  - `generate/page.tsx` - Report generation (1200+ lines, feature-rich)
  - `templates/page.tsx` - Template listing

**`app/app/api/`:**
- Purpose: Backend API endpoints
- Contains: Route handlers with HTTP method exports
- Key files:
  - `stripe/webhook/route.ts` - Stripe webhook handler
  - `templates/validate/route.ts` - Template validation
  - `admin/users/route.ts` - User management

**`app/components/ui/`:**
- Purpose: Reusable UI primitives
- Contains: Radix-based accessible components
- Key files:
  - `button.tsx` - Button with variants (primary, secondary, outline, ghost, danger)
  - `dialog.tsx` - Modal dialog wrapper
  - `card.tsx` - Card container
  - `toast.tsx` - Toast notifications with context

**`app/lib/`:**
- Purpose: Shared business logic and utilities
- Contains: Context providers, hooks, clients, utilities
- Key files:
  - `auth/auth-context.tsx` - AuthProvider and useAuth hook
  - `supabase/client.ts` - Browser Supabase client
  - `supabase/server.ts` - Server Supabase client
  - `supabase/middleware.ts` - Middleware Supabase client

**`app/types/`:**
- Purpose: TypeScript type definitions
- Contains: Database types, API types, domain types
- Key files:
  - `database.ts` - Supabase table types
  - `index.ts` - API response types, re-exports

**`app/styles/`:**
- Purpose: Global CSS and design tokens
- Contains: Tailwind base, components, utilities
- Key files: `globals.css` - CSS variables for theming

## Key File Locations

**Entry Points:**
- `app/app/layout.tsx`: Root layout, provider hierarchy
- `app/middleware.ts`: Authentication middleware
- `app/app/page.tsx`: Landing page

**Configuration:**
- `app/package.json`: Dependencies and scripts
- `app/tsconfig.json`: TypeScript configuration with path aliases
- `app/tailwind.config.ts`: Tailwind theme extensions
- `app/next.config.mjs`: Next.js configuration

**Core Logic:**
- `app/lib/auth/auth-context.tsx`: Authentication state management
- `app/lib/supabase/*.ts`: Database client configurations
- `app/app/(protected)/generate/page.tsx`: Report generation feature

**Testing:**
- `app/tests/e2e/auth.spec.ts`: Authentication E2E tests
- `app/tests/setup.ts`: Test setup
- `app/vitest.config.ts`: Vitest configuration
- `app/playwright.config.ts`: Playwright configuration

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- Layouts: `layout.tsx` (Next.js convention)
- API Routes: `route.ts` (Next.js convention)
- Components: `kebab-case.tsx` (e.g., `command-palette.tsx`)
- Utilities: `kebab-case.ts` (e.g., `template-schema.ts`)
- Types: `kebab-case.ts` (e.g., `database.ts`)
- Tests: `*.spec.ts` (Playwright), `*.test.ts` (Vitest)

**Directories:**
- Route Groups: `(group-name)` - parentheses for Next.js route groups
- Dynamic Routes: `[param]` - brackets for dynamic segments
- Feature Areas: `kebab-case` (e.g., `brand-templates`)
- Utilities: `kebab-case` (e.g., `lib/shared`)

**Exports:**
- Components: PascalCase named export (e.g., `export function Button()`)
- Hooks: camelCase with `use` prefix (e.g., `export function useAuth()`)
- Utilities: camelCase (e.g., `export function cn()`)
- Types: PascalCase (e.g., `export interface AuthUser`)

## Where to Add New Code

**New Feature Page:**
- Primary code: `app/app/(protected)/{feature-name}/page.tsx`
- With sub-routes: `app/app/(protected)/{feature-name}/[id]/page.tsx`
- Tests: `app/tests/e2e/{feature-name}.spec.ts`

**New API Endpoint:**
- Implementation: `app/app/api/{resource}/route.ts`
- With sub-resources: `app/app/api/{resource}/{action}/route.ts`
- Admin endpoints: `app/app/api/admin/{resource}/route.ts`

**New UI Component:**
- Primitive (button, input): `app/components/ui/{component-name}.tsx`
- Layout (header, footer): `app/components/layout/{component-name}.tsx`
- Feature-specific: `app/components/features/{feature-name}/{component-name}.tsx`

**New Custom Hook:**
- General purpose: `app/lib/hooks/use-{name}.ts`
- Auth-related: `app/lib/auth/{name}.ts`
- Feature-specific: Keep in feature page or extract to hooks

**New Type Definition:**
- Database types: `app/types/database.ts`
- API types: `app/types/index.ts`
- Feature-specific: Co-locate in feature file or create `app/types/{feature}.ts`

**New Validation Schema:**
- Implementation: `app/lib/validation/{resource}-schema.ts`
- Export in schema file for client + server use

**Utilities:**
- Shared: `app/lib/shared/{utility-name}.ts`
- Supabase: `app/lib/supabase/{client-type}.ts`
- Storage: `app/lib/storage/{storage-type}.ts`

## Special Directories

**`app/app/(protected)/`:**
- Purpose: Authenticated route group
- Generated: No
- Committed: Yes
- Note: Parentheses make it a route group (not in URL path)

**`app/.next/`:**
- Purpose: Next.js build output
- Generated: Yes (on `npm run build` or `npm run dev`)
- Committed: No (in `.gitignore`)

**`app/node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (on `pnpm install`)
- Committed: No (in `.gitignore`)

**`app/supabase/migrations/`:**
- Purpose: Database schema migrations
- Generated: No (manually created)
- Committed: Yes
- Note: Currently empty, migrations stored elsewhere

**`.planning/codebase/`:**
- Purpose: Architecture documentation for AI assistants
- Generated: By `/gsd:map-codebase` command
- Committed: Yes

---

*Structure analysis: 2025-01-16*
