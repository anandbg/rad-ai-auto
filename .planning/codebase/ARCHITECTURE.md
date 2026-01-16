# Architecture

**Analysis Date:** 2025-01-16

## Pattern Overview

**Overall:** Next.js 14 App Router with layered architecture

**Key Characteristics:**
- Server-side middleware for authentication/authorization
- Client-side React Context for state management (Auth, Preferences)
- API routes using Next.js Route Handlers (RSC pattern)
- Supabase for authentication and database with Row-Level Security
- Separation between public routes, auth routes, and protected routes via route groups

## Layers

**Presentation Layer:**
- Purpose: UI components and page rendering
- Location: `app/app/`, `app/components/`
- Contains: Page components (`.tsx`), UI primitives, layout components
- Depends on: Auth context, Preferences context, Supabase client
- Used by: End users via browser

**Application Layer (API Routes):**
- Purpose: Backend logic, data validation, external integrations
- Location: `app/app/api/`
- Contains: Route handlers (`route.ts`), webhook handlers
- Depends on: Supabase server client, Stripe SDK, Zod validation
- Used by: Presentation layer via fetch, external webhooks (Stripe)

**Context Layer:**
- Purpose: Client-side state management and cross-cutting concerns
- Location: `app/lib/auth/`, `app/lib/preferences/`
- Contains: React Context providers (AuthProvider, PreferencesProvider)
- Depends on: Supabase browser client
- Used by: All client components needing auth or preferences

**Data Access Layer:**
- Purpose: Database communication and external API clients
- Location: `app/lib/supabase/`, `app/lib/storage/`
- Contains: Supabase clients (browser, server, middleware), IndexedDB utilities
- Depends on: Supabase SDK, browser IndexedDB API
- Used by: Context layer, API routes, page components

**Shared/Utility Layer:**
- Purpose: Reusable utilities, types, validation schemas
- Location: `app/lib/shared/`, `app/lib/validation/`, `app/types/`
- Contains: Helper functions (`cn.ts`), Zod schemas, TypeScript types
- Depends on: External libraries (clsx, tailwind-merge, zod)
- Used by: All other layers

## Data Flow

**Authentication Flow:**

1. User visits protected route
2. Next.js middleware (`app/middleware.ts`) intercepts request
3. Middleware calls `updateSession()` from `app/lib/supabase/middleware.ts`
4. Supabase validates session cookie and returns user
5. If no user, middleware redirects to `/login?redirect={path}`
6. If user exists, request continues to page component
7. Page component reads user from `useAuth()` hook (AuthContext)

**Report Generation Flow:**

1. User selects template and enters findings on `/generate` page
2. Component stores draft to localStorage + IndexedDB (offline support)
3. User clicks "Generate Report" button
4. Component simulates AI generation (OpenAI integration TODO)
5. Generated report displayed in sections
6. Credit deducted via Supabase `credits_ledger` table insert
7. User exports as PDF or DOCX using client-side libraries

**Stripe Webhook Flow:**

1. Stripe sends webhook POST to `/api/stripe/webhook`
2. Route handler validates `stripe-signature` header
3. Webhook secret verified via `stripe.webhooks.constructEvent()`
4. Event type routed to appropriate handler (subscription created, payment, etc.)
5. Database updated accordingly (TODO: implementation)

**State Management:**

- **Authentication State:** React Context (`AuthContext`) initialized from Supabase session, listens to auth state changes
- **User Preferences:** React Context (`PreferencesContext`) persisted to localStorage, per-user keyed
- **Local Drafts:** localStorage + IndexedDB for offline resilience
- **Server State:** Supabase Postgres with RLS, accessed via Supabase client SDK

## Key Abstractions

**Supabase Client Trio:**
- Purpose: Database/auth access across different execution contexts
- Examples:
  - `app/lib/supabase/client.ts` - Browser client for React components
  - `app/lib/supabase/server.ts` - Server client for API routes/RSC
  - `app/lib/supabase/middleware.ts` - Middleware client for auth checks
- Pattern: Factory functions that configure cookie handling per context

**React Context Providers:**
- Purpose: Provide global state to component tree
- Examples:
  - `app/lib/auth/auth-context.tsx` - AuthProvider
  - `app/lib/preferences/preferences-context.tsx` - PreferencesProvider
  - `app/components/ui/toast.tsx` - ToastProvider
- Pattern: Context + custom hook (`useAuth`, `usePreferences`, `useToast`)

**UI Component Primitives:**
- Purpose: Consistent, accessible UI building blocks
- Examples:
  - `app/components/ui/button.tsx` - Button with variants
  - `app/components/ui/dialog.tsx` - Modal dialog (Radix-based)
  - `app/components/ui/card.tsx` - Card container
- Pattern: Radix UI primitives + Tailwind styling + forwardRef

**Validation Schemas:**
- Purpose: Single source of truth for data validation (client + server)
- Examples: `app/lib/validation/template-schema.ts`
- Pattern: Zod schemas exported for use in forms and API routes

## Entry Points

**Root Layout:**
- Location: `app/app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Sets up provider hierarchy (AuthProvider > PreferencesProvider > ToastProvider), global CSS, metadata

**Middleware:**
- Location: `app/middleware.ts`
- Triggers: All non-static requests matching config matcher
- Responsibilities: Session refresh, protected route guarding, auth route redirection

**Protected Layout:**
- Location: `app/app/(protected)/layout.tsx`
- Triggers: All routes under `/(protected)/` group
- Responsibilities: Sidebar navigation, command palette, session timeout tracking

**API Entry Points:**
- Location: `app/app/api/*/route.ts`
- Triggers: HTTP requests to `/api/*` paths
- Responsibilities: Authentication check, business logic, database operations

**Public Pages:**
- Location: `app/app/page.tsx`, `app/app/login/page.tsx`, `app/app/signup/page.tsx`
- Triggers: Direct navigation or redirects
- Responsibilities: Landing page, authentication forms

## Error Handling

**Strategy:** Try-catch with user-friendly error messages

**Patterns:**
- API routes return structured JSON with `error` and `message` fields
- Status codes: 400 (validation), 401 (unauthorized), 403 (forbidden), 500 (server)
- Client components catch errors and display via toast notifications
- Form validation uses Zod with custom error formatting (`formatZodErrors`)

**Example API Error Response:**
```typescript
{
  success: false,
  error: 'Validation Error',
  message: 'Template data failed validation',
  validationErrors: { name: 'Template name is required' }
}
```

## Cross-Cutting Concerns

**Logging:**
- Console logging with prefixed messages (e.g., `[Stripe Webhook]`, `[IndexedDB]`)
- No centralized logging service configured

**Validation:**
- Zod schemas shared between client and server
- Server-side validation endpoint at `/api/templates/validate`
- Client-side form validation with same schemas

**Authentication:**
- Supabase Auth with email/password (Google OAuth planned)
- JWT stored in HTTP-only cookies
- Role-based access control (radiologist, admin)
- CSRF protection via custom hook (`useCsrf`)

**Security Headers:**
- Configured in `next.config.mjs` for API routes
- X-Frame-Options, X-XSS-Protection, X-Content-Type-Options

---

*Architecture analysis: 2025-01-16*
