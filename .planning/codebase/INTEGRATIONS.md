# External Integrations

**Analysis Date:** 2026-01-16

## APIs & External Services

**AI/ML:**
- OpenAI - Text generation and transcription
  - SDK/Client: Direct API calls (planned, see `app/.env.example`)
  - Auth: `OPENAI_API_KEY`
  - Models: GPT-4o for generation, Whisper for transcription
  - Status: Environment configured, implementation scaffolded in `app/app/(protected)/generate/page.tsx`

**Payments:**
- Stripe - Subscription billing
  - SDK/Client: `stripe` v20.0.0
  - Auth: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - Webhook: `STRIPE_WEBHOOK_SECRET`
  - Implementation: `app/app/api/stripe/webhook/route.ts`, `app/app/api/billing/invoices/route.ts`
  - API Version: 2025-04-30.basil

**Caching (Planned):**
- Upstash Redis - Rate limiting, template caching
  - Auth: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - Status: Environment vars configured, not yet implemented

## Data Storage

**Database:**
- Supabase PostgreSQL
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Pooler: `SUPABASE_POOLER_URL` (PgBouncer)
  - Admin: `SUPABASE_SERVICE_ROLE_KEY`
  - Client Libraries:
    - Browser: `app/lib/supabase/client.ts` - `createSupabaseBrowserClient()`
    - Server: `app/lib/supabase/server.ts` - `createSupabaseServerClient()`
    - Middleware: `app/lib/supabase/middleware.ts` - `updateSession()`

**Tables (from types):**
- `profiles` - User profile data
- `subscriptions` - Stripe subscription mapping
- `credits_ledger` - Credit tracking with idempotency
- `templates_global` - Admin-managed templates
- `templates_personal` - User templates
- `brand_templates` - Custom branding
- `transcription_macros` - Text shortcuts
- `report_sessions` - Generation history
- `transcribe_sessions` - Audio processing records
- `user_preferences` - App settings

**File Storage:**
- Supabase Storage - Temporary audio files
  - Bucket: `TRANSCRIBE_STORAGE_BUCKET` (audio-temp)
  - Encryption: `TRANSCRIBE_ENCRYPTION_KEY`
  - TTL: 5 minutes (HIPAA compliance)

**Client Storage:**
- IndexedDB - Offline draft persistence
  - Implementation: `app/lib/storage/indexeddb.ts`
  - Database: `ai-radiologist-drafts`
  - Stores: `drafts` (keyed by id, indexed by userId, type, savedAt)
- localStorage - User preferences, session drafts

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Methods: Email/Password (implemented), Google OAuth (planned)
  - Session: Cookie-based with 7-day expiry
  - Implementation:
    - Context: `app/lib/auth/auth-context.tsx`
    - Middleware: `app/middleware.ts`, `app/lib/supabase/middleware.ts`
    - Session utils: `app/lib/auth/session.ts`

**Route Protection:**
- Middleware-based auth checking
- Protected routes: `/dashboard`, `/transcribe`, `/generate`, `/templates`, `/brand-templates`, `/macros`, `/billing`, `/settings`, `/admin`, `/productivity`
- Admin routes: `/admin/*` (role-based)
- Auth routes (redirect if logged in): `/login`, `/signup`

**User Roles:**
- `radiologist` - Standard user
- `admin` - Full system access

## Monitoring & Observability

**Error Tracking:**
- Console logging (no external service configured)
- Structured log format: `[Service Name] Message`

**Logs:**
- Server-side: `console.log/error` with prefixes
- Client-side: Browser console
- Webhook logs: `[Stripe Webhook]` prefix

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from Next.js App Router patterns)
- Edge Runtime for AI routes
- Node.js Runtime for Stripe webhooks

**CI Pipeline:**
- Not explicitly configured in repository
- Playwright configured for CI mode with retries

## Environment Configuration

**Required env vars:**
```
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_POOLER_URL

# OpenAI (required for AI features)
OPENAI_API_KEY
OPENAI_MODEL_GENERATE=gpt-4o
OPENAI_MODEL_WHISPER=whisper-1

# Stripe (required for billing)
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID_PLUS
STRIPE_PRICE_ID_PRO

# Storage (required for transcription)
TRANSCRIBE_STORAGE_BUCKET
TRANSCRIBE_ENCRYPTION_KEY

# Redis (optional - caching)
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# App config
NODE_ENV
NEXT_PUBLIC_APP_URL
```

**Secrets location:**
- Local: `app/.env.local` (gitignored)
- Production: Environment variables in hosting platform

## Webhooks & Callbacks

**Incoming:**
- `POST /api/stripe/webhook` - Stripe events
  - Signature validation required
  - Events handled:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`

**Outgoing:**
- None configured

## API Routes

**Billing:**
- `GET /api/billing/invoices` - Fetch user invoices from Stripe
- `POST /api/billing/portal` - Get Stripe customer portal URL (planned)
- `POST /api/billing/checkout` - Create Stripe checkout session (planned)

**Templates:**
- `GET /api/templates/list` - List available templates
- `POST /api/templates/validate` - Validate template data

**Admin:**
- `GET /api/admin/users` - List users (admin only)

**Stripe:**
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## Integration Patterns

**Supabase Client Creation:**
```typescript
// Browser (client components)
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
const supabase = createSupabaseBrowserClient();

// Server (API routes, Server Components)
import { createSupabaseServerClient } from '@/lib/supabase/server';
const supabase = await createSupabaseServerClient();
```

**Stripe Initialization:**
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion
});
```

**Validation (Shared client/server):**
```typescript
import { templateFormSchema } from '@/lib/validation/template-schema';
const result = templateFormSchema.safeParse(data);
```

---

*Integration audit: 2026-01-16*
