# Technology Stack

**Analysis Date:** 2026-01-16

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code (strict mode enabled)

**Secondary:**
- JavaScript - Configuration files (next.config.mjs, postcss.config.mjs)

## Runtime

**Environment:**
- Node.js >= 20 (specified in `package.json` engines)
- Next.js 14.2.x App Router (hybrid Edge + Node.js runtimes)

**Package Manager:**
- pnpm 8.15.6 (specified in `package.json` packageManager field)
- Lockfile: present (`pnpm-lock.yaml`)

## Frameworks

**Core:**
- Next.js 14.2.x - Full-stack React framework with App Router
  - Config: `app/next.config.mjs`
  - Features: Server Actions, Edge Runtime support, Image Optimization

**UI:**
- React 18.3.1 - Component library
- Tailwind CSS 3.4.x - Utility-first styling
  - Config: `app/tailwind.config.ts`
  - Design tokens via CSS variables
- Radix UI - Accessible UI primitives
  - Checkbox, Dialog, Select, Slot, Switch, Tabs, Tooltip
- Framer Motion 12.23.x - Animations

**State Management:**
- React Context - Auth, Preferences, Toast notifications
  - `app/lib/auth/auth-context.tsx`
  - `app/lib/preferences/preferences-context.tsx`
- SWR 2.2.5 - Data fetching with caching (available but minimally used)
- IndexedDB - Offline draft storage
  - `app/lib/storage/indexeddb.ts`

**Testing:**
- Vitest 1.6.0 - Unit tests
  - Config: `app/vitest.config.ts`
  - Environment: jsdom
- Playwright 1.56.1 - E2E tests
  - Config: `app/playwright.config.ts`
  - Multi-browser: Chromium, Firefox, WebKit, Mobile

**Build/Dev:**
- PostCSS 8.4.x - CSS processing
  - Config: `app/postcss.config.mjs`
- Autoprefixer 10.4.x - CSS vendor prefixes
- ESLint 8.57.x - Linting
- Prettier 3.2.x - Code formatting

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.79.0 - Database & Auth client
- `@supabase/ssr` 0.7.0 - SSR-compatible Supabase client
- `stripe` 20.0.0 - Payment processing
- `zod` 3.23.8 - Runtime schema validation

**Document Generation:**
- `docx` 9.5.1 - Word document creation
- `file-saver` 2.0.5 - Client-side file downloads
- Browser print API - PDF export (no external library)

**Utility:**
- `clsx` 2.1.1 - Conditional class names
- `tailwind-merge` 3.3.1 - Tailwind class conflict resolution
- `lucide-react` 0.553.0 - Icon library
- `nanoid` (transitive) - ID generation

## Configuration

**Environment:**
- Environment variables loaded via Next.js built-in support
- Example file: `app/.env.example`
- Local dev: `app/.env.local`
- Required vars (production):
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key
  - `STRIPE_SECRET_KEY` - Stripe API key
  - `STRIPE_WEBHOOK_SECRET` - Stripe webhook validation
  - `OPENAI_API_KEY` - AI model access

**TypeScript:**
- Config: `app/tsconfig.json`
- Strict mode enabled
- Path alias: `@/*` maps to `./`
- Target: ES2022
- Additional strict flags: `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`

**Build:**
- Next.js handles build via `next build`
- Security headers configured in `app/next.config.mjs`
- Image optimization for `*.supabase.co` domains

## Platform Requirements

**Development:**
- Node.js >= 20
- pnpm 8.15.6
- Modern browser with IndexedDB support

**Production:**
- Vercel (primary deployment target based on Next.js usage)
- Edge Runtime compatible for AI routes
- Node.js runtime for Stripe webhooks (requires crypto)

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript type checking
pnpm test         # Run unit tests (Vitest)
pnpm test:watch   # Run unit tests in watch mode
pnpm test:coverage # Run tests with coverage
pnpm test:e2e     # Run E2E tests (Playwright)
pnpm test:e2e:ui  # Run E2E tests with UI
pnpm test:e2e:headed # Run E2E tests in headed mode
```

---

*Stack analysis: 2026-01-16*
