# Roadmap: AI Radiologist - Production Integration

## Milestones

- ✅ **v1.0 MVP** - Phases 1-11 (shipped 2026-01-16)
- ✅ **v1.1 Production Readiness** - Phases 12-14 (shipped 2026-01-17)
- 🚧 **v1.2 Template Experience** - Phases 15, 17, 18 (in progress)
- 📋 **v1.3 Production Infrastructure** - Phases 16, 19 (planned)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details>
<summary>✅ v1.0 MVP (Phases 1-11) - SHIPPED 2026-01-16</summary>

### Phase 1: Database Foundation
**Goal**: Verified database schema with RLS security
**Requirements**: DB-01, DB-02
**Plans**: 1 plan (complete)

### Phase 2: Authentication
**Goal**: Users can sign up, verify email, log in, and reset password
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Plans**: 1 plan (complete)

### Phase 3: Template System
**Goal**: Users can manage personal templates with real database storage
**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05, TMPL-06
**Plans**: 2 plans (complete)

### Phase 4: AI Report Generation
**Goal**: Users can generate and stream AI radiology reports
**Requirements**: REPORT-01, REPORT-03, REPORT-05
**Plans**: 1 plan (complete)

### Phase 5: Voice Transcription
**Goal**: Users can transcribe voice input using Whisper API
**Requirements**: REPORT-02
**Plans**: 1 plan (complete)

### Phase 6: AI Template Suggestions
**Goal**: Users can get AI-assisted template recommendations
**Requirements**: TMPL-07
**Plans**: 1 plan (complete)

### Phase 7: PDF Export
**Goal**: Users can export reports as professional PDFs
**Requirements**: REPORT-04
**Plans**: 1 plan (complete)

### Phase 8: User Settings & Macros
**Goal**: Users can manage preferences and macros
**Requirements**: SETT-01, SETT-02, SETT-03
**Plans**: 2 plans (complete)

### Phase 9: Stripe Billing
**Goal**: Users can subscribe and system tracks usage
**Requirements**: BILL-01, BILL-02, BILL-03
**Plans**: 2 plans (complete)

### Phase 10: Admin Dashboard
**Goal**: Admins can manage users and templates
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03
**Plans**: 1 plan (complete)

### Phase 11: UI/UX Overhaul
**Goal**: Transform the application with cutting-edge visual design
**Requirements**: UX-01, UX-02, UX-03
**Plans**: 7 plans (complete)

</details>

<details>
<summary>✅ v1.1 Production Readiness (Phases 12-14) - SHIPPED 2026-01-17</summary>

**Milestone Goal:** Polish the workspace UX, wire all buttons to working APIs, align AI prompts with reference documentation, and improve export functionality.

### Phase 12: Workspace Consolidation
**Goal**: Single workspace hub with all workflow functionality
**Plans**: 2 plans (complete)

### Phase 13: AI Prompt Alignment
**Goal**: Production-quality AI outputs matching reference documentation
**Plans**: 1 plan (complete)

### Phase 14: Export Enhancement
**Goal**: Professional document export with multiple format options
**Plans**: 1 plan (complete)

</details>

## 🚧 v1.2 Template Experience (IN PROGRESS)

**Milestone Goal:** Overhaul the template creation and management experience with AI-assisted workflows, making it easy for radiologists to create, customize, and maintain templates.

### Phase 15: Template Creation UX Overhaul
**Goal**: AI-assisted template builder with intuitive creation pathways
**Depends on**: Phase 14
**Requirements**: V1.2-TMPL-01
**Success Criteria** (what must be TRUE):
  1. Users can create templates via multiple pathways (manual, AI-assisted, clone, import)
  2. AI can generate structured templates from freeform user descriptions
  3. Section management UI allows add/edit/delete/reorder operations
  4. Live preview shows rendered template as user edits
  5. Validation ensures saved templates conform to schema (never fails on load)
  6. Clone workflow allows starting from existing template
**Research**: Likely (UX patterns for template builders, AI-assisted form generation)
**Research topics**: Template builder UX patterns, drag-drop section editors, AI form generation
**Plans**: 5 plans in 3 waves

Plans:
- [x] 15-01: Foundation - Dependencies + Drag-Drop Components (Wave 1)
- [x] 15-02: AI Generation Endpoint with Structured Output (Wave 1)
- [x] 15-03: Preview + Pathway Modal Components (Wave 1)
- [x] 15-04: Editor Integration - Split Pane + Import (Wave 2)
- [x] 15-05: AI Flow Wiring + Verification Checkpoint (Wave 3)

### Phase 17: Landing Page Integration
**Goal**: Marketing landing page as app entry point with auth routing
**Depends on**: Phase 14
**Requirements**: V1.2-LAND-01
**Success Criteria** (what must be TRUE):
  1. Landing page displays at root URL (/) as first page visitors see
  2. "Sign In" and "Try Platform Free" buttons route to auth pages
  3. Authenticated users redirect from landing to workspace
  4. All landing page components render correctly (hero, features, pricing, demo carousel)
  5. Demo carousel screenshots work (placeholder OK for now, replace later)
  6. Responsive design works on mobile, tablet, desktop
**Research**: None (landing page already exists in /landing folder)
**Plans**: 2 plans

Plans:
- [x] 17-01: Foundation - Copy components, screenshots, update styles/Tailwind (Wave 1)
- [x] 17-02: Integration - Wire to root URL with auth redirect + verify (Wave 2)

### Phase 18: Landing Page Carousel Enhancement
**Goal**: Replace placeholder carousel with real app screenshots showcasing key features
**Depends on**: Phase 17
**Requirements**: V1.2-LAND-02
**Success Criteria** (what must be TRUE):
  1. Browser automation captures screenshots of all key app features
  2. Carousel displays real screenshots instead of placeholders
  3. Supporting text explains selling points clearly and compellingly
  4. Screenshots showcase: workspace, voice transcription, AI generation, templates, PDF export
  5. Carousel demonstrates the complete workflow value proposition
  6. Images are optimized for web delivery (size/format)
**Research**: None (browser automation with Playwright via agent-browser skill)
**Plans**: 1 plan (complete)

Plans:
- [x] 18-01: Screenshot capture, WebP optimization, carousel update + verification (Wave 1)

## 📋 v1.3 Production Infrastructure (PLANNED)

**Milestone Goal:** Set up production-grade infrastructure with separate development and production environments, all under UK company identity. Start with free tiers for validation, upgrade to paid when launching commercially.

### Phase 16: Infrastructure & Environment Setup
**Goal**: Production-ready infrastructure with dev/prod separation under company identity
**Depends on**: None (can run in parallel with Phase 15)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05

**Success Criteria** (what must be TRUE):
  1. Company domain registered and DNS configured
  2. Company email set up via domain provider
  3. Standard Google account created under company email (for OAuth ownership)
  4. Supabase organization with separate dev and prod projects (free tier OK)
  5. Vercel account with environment-specific configuration (hobby tier OK for validation)
  6. Google OAuth credentials configured for both dev and prod environments
  7. Environment variables properly scoped across all environments
  8. Database migration workflow documented and tested (dev → prod)
  9. All services registered under company identity (upgrade path documented)

**Sub-phases:**

#### 16.1: Company Identity & Domain
- Register company domain (e.g., yourcompany.com or .co.uk)
- Set up DNS management (via registrar or Cloudflare)
- Create company email using domain (e.g., admin@yourcompany.com)
  - Options: Domain provider email forwarding, Zoho Mail free tier, or similar
- Create standard Google account using company email address
- Document all account credentials securely (password manager)

#### 16.2: Supabase Setup (Free → Pro)
- Create Supabase organization under company identity
- **Development Project**:
  - Name: `airad-dev`
  - Region: Flexible (your preference for dev)
  - Used for: Local development, PR previews, testing
- **Production Project**:
  - Name: `airad-prod`
  - Region: US East (N. Virginia) - good global latency
  - Used for: Live production traffic
- Enable connection pooling (PgBouncer) on both
- Set up database migration workflow:
  - Migrations version controlled in repo
  - Apply to dev first, then prod after verification
- Document connection strings and API keys per environment

**Free tier limits** (fine for validation):
- 2 projects included ✓
- 500MB database per project
- Shared compute (slower under load)
- No automated daily backups

**Upgrade to Pro (~$50/month) when**:
- Approaching 500MB database
- Need dedicated compute for performance
- Ready for production traffic
- Want point-in-time recovery backups

#### 16.3: Vercel Setup (Hobby → Pro)
- Create Vercel account under company identity
- Connect GitHub repository
- Configure environment variables with proper scoping:
  ```
  Environment          → Supabase Project
  ─────────────────────────────────────────
  Development (local)  → airad-dev
  Preview (PR branches)→ airad-dev
  Production (main)    → airad-prod
  ```
- Set up custom domain (from 16.1)
- Test deployment pipeline

**Hobby tier limits** (for validation only):
- ⚠️ Non-commercial use per ToS
- No team collaboration
- 100GB bandwidth
- Basic analytics

**Upgrade to Pro (~$20/month) before**:
- Launching commercially (required by ToS)
- Need team members
- Want deployment protection
- Production traffic

#### 16.4: Google OAuth Configuration
- Create Google Cloud project under company Google account
- Configure OAuth consent screen:
  - App name: AI Radiologist
  - User support email: company email
  - Authorized domains: your registered domain
  - App logo: product logo
- Create **two** OAuth 2.0 credential sets:
  - **Development credentials**:
    - Authorized redirect: `http://localhost:3000/auth/callback`
    - Used in: Supabase dev project
  - **Production credentials**:
    - Authorized redirect: `https://yourdomain.com/auth/callback`
    - Used in: Supabase prod project
- Update Supabase Auth → Providers → Google in both projects

#### 16.5: Environment Strategy & Documentation
- Create comprehensive `.env.example` documenting all variables
- Environment variable matrix:
  ```
  Variable                          Dev              Prod
  ────────────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL         dev-url          prod-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY    dev-anon-key     prod-anon-key
  SUPABASE_SERVICE_ROLE_KEY        dev-service-key  prod-service-key
  GOOGLE_CLIENT_ID                 dev-client-id    prod-client-id
  GOOGLE_CLIENT_SECRET             dev-secret       prod-secret
  STRIPE_SECRET_KEY                test-key         live-key
  STRIPE_WEBHOOK_SECRET            test-webhook     live-webhook
  OPENAI_API_KEY                   shared or separate for cost tracking
  ```
- Create `DEPLOYMENT.md` guide with:
  - How to run locally against dev
  - How to deploy to production
  - How to run database migrations
  - Troubleshooting common issues
- Test complete pipeline: local → PR preview → production

**Estimated Monthly Costs:**

*Start Free (validation phase):*
| Service | Tier | Cost (USD) |
|---------|------|------------|
| Supabase | Free (2 projects) | $0 |
| Vercel | Hobby | $0 |
| Domain | Annual (~$12-15) | ~$1 |
| Email | Free tier (Zoho/forwarding) | $0 |
| Google Cloud | OAuth free tier | $0 |
| **Total** | | **~$1/month** |

*Production (when launching):*
| Service | Tier | Cost (USD) |
|---------|------|------------|
| Supabase Pro | 2 projects | ~$50 |
| Vercel Pro | 1 team | ~$20 |
| Domain | Annual (~$12-15) | ~$1 |
| Email | Free tier (Zoho/forwarding) | $0 |
| Google Cloud | OAuth free tier | $0 |
| **Total** | | **~$71/month** |

**Research**: Minimal (standard platform setup, well-documented)
**Plans**: 5 plans (one per sub-phase)

Plans:
- [ ] 16-01: Company Identity & Domain Setup
- [ ] 16-02: Supabase Pro Configuration (Dev + Prod)
- [ ] 16-03: Vercel Pro Configuration
- [ ] 16-04: Google OAuth Configuration
- [ ] 16-05: Environment Strategy & Documentation

### Phase 19: Stripe Production Setup
**Goal**: Complete Stripe integration with webhook configuration, testing, and production readiness
**Depends on**: Phase 16 (needs production domain for webhook URL)
**Requirements**: STRIPE-PROD-01, STRIPE-PROD-02, STRIPE-PROD-03

**Current State** (from browser inspection 2026-01-19):
- ✅ Products configured: Pro Plan (£20/mo), Plus Plan (£10/mo)
- ✅ Price IDs match environment variables
- ✅ 3 active test subscriptions working
- ✅ Checkout API functional (`/api/billing/checkout`)
- ✅ Customer Portal API functional (`/api/billing/portal`)
- ✅ Invoice History API functional (`/api/billing/invoices`)
- ✅ Webhook handler code exists (`/api/stripe/webhook`)
- ⚠️ **NO webhook endpoint configured in Stripe Dashboard**
- ⚠️ Subscription status changes won't sync without webhooks

**Success Criteria** (what must be TRUE):
  1. Webhook endpoint registered in Stripe Dashboard (test + production)
  2. All subscription lifecycle events handled:
     - `checkout.session.completed` → activates subscription
     - `customer.subscription.created` → syncs new subscription
     - `customer.subscription.updated` → syncs plan changes
     - `customer.subscription.deleted` → downgrades to free
     - `invoice.payment_succeeded` → confirms payment
     - `invoice.payment_failed` → marks subscription past_due
  3. Webhook signature verification working (prevents spoofing)
  4. Database `subscriptions` table updates correctly from webhooks
  5. End-to-end test: signup → checkout → webhook → subscription active
  6. Stripe CLI local testing documented and working
  7. Production webhook URL configured with correct events
  8. Error handling for webhook failures (logging, retry awareness)

**Sub-phases:**

#### 19.1: Local Webhook Testing Setup
- Install Stripe CLI (`brew install stripe/stripe-cli/stripe`)
- Authenticate CLI with test account
- Document local testing workflow:
  ```bash
  # Terminal 1: Run app
  npm run dev

  # Terminal 2: Forward webhooks
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```
- Verify webhook secret from CLI matches `STRIPE_WEBHOOK_SECRET`
- Test each event type with CLI triggers:
  ```bash
  stripe trigger checkout.session.completed
  stripe trigger customer.subscription.updated
  stripe trigger invoice.payment_failed
  ```
- Verify database updates for each event

#### 19.2: Webhook Handler Verification
- Review `/api/stripe/webhook` handler for all event types
- Ensure proper error handling and logging
- Verify signature validation using `STRIPE_WEBHOOK_SECRET`
- Test idempotency (same event processed twice safely)
- Add missing event handlers if needed:
  - `customer.subscription.trial_will_end` (if using trials)
  - `invoice.upcoming` (for usage-based billing notifications)
- Verify RLS bypass for service role operations

#### 19.3: Production Webhook Configuration
- Navigate to Stripe Dashboard → Developers → Webhooks
- Add endpoint: `https://{production-domain}/api/stripe/webhook`
- Select events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- Copy webhook signing secret to production env vars
- Test with Stripe Dashboard "Send test webhook" feature
- Verify endpoint shows successful delivery

#### 19.4: End-to-End Subscription Flow Test
- Create new test user account
- Navigate to billing page
- Click "Upgrade to Plus"
- Complete Stripe Checkout with test card `4242 4242 4242 4242`
- Verify:
  - Redirect back to app with success
  - `subscriptions` table updated with correct plan
  - User sees "Plus" plan on billing page
  - Usage limits reflect Plus tier
- Test upgrade flow: Plus → Pro
- Test downgrade/cancellation via Customer Portal
- Test failed payment with card `4000 0000 0000 0002`

#### 19.5: Production Credentials & Go-Live
- Switch from test to live mode in Stripe Dashboard
- Create production products/prices (or copy from test)
- Update production environment variables:
  - `STRIPE_SECRET_KEY` → `sk_live_...`
  - `STRIPE_WEBHOOK_SECRET` → live webhook secret
  - `STRIPE_PRICE_ID_PLUS` → live price ID
  - `STRIPE_PRICE_ID_PRO` → live price ID
- Keep `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
- Verify live webhook endpoint receiving events
- Document rollback procedure if issues arise

**Environment Variables Required:**
```
# Test Mode (development)
STRIPE_SECRET_KEY=sk_test_51SYQ7v5pdloqz3iU...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SYQ7v5pdloqz3iU...
STRIPE_WEBHOOK_SECRET=whsec_... (from CLI or Dashboard)
STRIPE_PRICE_ID_PLUS=price_1SYroR5pdloqz3iUt6OouMIa
STRIPE_PRICE_ID_PRO=price_1SYroo5pdloqz3iUPISotOU2

# Live Mode (production)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (from Dashboard live endpoint)
STRIPE_PRICE_ID_PLUS=price_live_...
STRIPE_PRICE_ID_PRO=price_live_...
```

**Stripe Dashboard URLs:**
- Test Dashboard: https://dashboard.stripe.com/test
- Webhooks: https://dashboard.stripe.com/test/webhooks
- Products: https://dashboard.stripe.com/test/products
- Subscriptions: https://dashboard.stripe.com/test/subscriptions

**Research**: None (standard Stripe integration, well-documented)
**Plans**: 3 plans (consolidated from original 5)

Plans:
- [x] 19-01: Local Webhook Testing Setup with Stripe CLI
- [x] 19-02: Webhook Handler Verification & E2E Testing
- [x] 19-03: Production Webhook Configuration & Go-Live Checklist

### Phase 20: Vercel Deployment Readiness
**Goal**: Production-ready Vercel deployment with all checks, optimizations, and best practices
**Depends on**: Phase 16 (infrastructure setup)
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03

**Success Criteria** (what must be TRUE):
  1. Build succeeds with zero errors and zero warnings
  2. All environment variables properly configured for preview and production
  3. Edge runtime compatibility verified for all API routes
  4. Bundle size analyzed and optimized (no unnecessary dependencies)
  5. Image optimization configured (next/image, WebP, proper sizing)
  6. Security headers configured (CSP, HSTS, X-Frame-Options)
  7. Performance audit passes (Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1)
  8. Error monitoring/logging configured (Vercel Analytics or Sentry)
  9. Preview deployments working for PR branches
  10. Production deployment checklist verified

**Sub-phases:**

#### 20.1: Build & Compatibility Audit
- Run `next build` and fix all warnings/errors
- Verify Edge runtime compatibility for API routes
- Check for Node.js-only dependencies in Edge routes
- Ensure all dynamic routes have proper generateStaticParams or dynamic config
- Fix any "Dynamic server usage" warnings
- Verify middleware works correctly

#### 20.2: Environment & Configuration
- Audit all environment variables needed for production
- Configure Vercel environment variables:
  - Development (local): from .env.local
  - Preview (PR branches): from Vercel dashboard
  - Production (main): from Vercel dashboard
- Verify NEXT_PUBLIC_* variables are client-safe
- Set up Vercel project settings:
  - Node.js version: 20.x
  - Build command: `pnpm build`
  - Output directory: `.next`
  - Install command: `pnpm install`

#### 20.3: Performance Optimization
- Analyze bundle size with `@next/bundle-analyzer`
- Remove unused dependencies
- Implement dynamic imports for heavy components
- Configure image optimization:
  - Use next/image for all images
  - Set up remotePatterns for external images
  - Ensure WebP format for screenshots
- Enable ISR/static generation where applicable
- Configure caching headers for static assets

#### 20.4: Security & Headers
- Configure security headers in next.config.js:
  ```js
  headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(self)' },
  ]
  ```
- Review and configure Content Security Policy
- Ensure HTTPS-only cookies
- Verify Supabase RLS policies are production-ready
- Check for exposed secrets in client bundle

#### 20.5: Monitoring & Deployment
- Enable Vercel Analytics (free tier)
- Configure error tracking (Vercel or Sentry)
- Set up deployment notifications
- Create production deployment checklist:
  - [ ] All tests passing
  - [ ] Environment variables set
  - [ ] Domain configured
  - [ ] SSL certificate active
  - [ ] Webhook URLs updated
  - [ ] Database migrations applied
- Test preview deployment workflow
- Verify rollback capability
- Document deployment process in DEPLOYMENT.md

**Vercel Configuration Reference:**

```json
// vercel.json (if needed)
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

**Research**: Minimal (standard Vercel/Next.js best practices)
**Plans**: 5 plans (one per sub-phase)

Plans:
- [ ] 20-01: Build & Compatibility Audit
- [ ] 20-02: Environment & Configuration Setup
- [ ] 20-03: Performance Optimization & Bundle Analysis
- [ ] 20-04: Security Headers & Production Hardening
- [ ] 20-05: Monitoring, Analytics & Deployment Checklist

## Progress

**Execution Order:**
Phases execute in numeric order: 15 → 16 → ...

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-11 | v1.0 | 18/18 | Complete | 2026-01-16 |
| 12-14 | v1.1 | 4/4 | Complete | 2026-01-17 |
| 15. Template Creation UX | v1.2 | 5/5 | Complete | 2026-01-19 |
| 16. Infrastructure Setup | v1.3 | 0/5 | Planned | - |
| 17. Landing Page Integration | v1.2 | 2/2 | Complete | 2026-01-18 |
| 18. Landing Page Carousel Enhancement | v1.2 | 1/1 | Complete | 2026-01-19 |
| 19. Stripe Production Setup | v1.3 | 3/3 | Complete | 2026-01-19 |
| 20. Vercel Deployment Readiness | v1.3 | 5/5 | Complete | 2026-01-20 |

---
*Roadmap created: 2026-01-16*
*v1.1 added: 2026-01-17*
*v1.2 added: 2026-01-18*
*v1.3 added: 2026-01-18*
*Phase 17 added: 2026-01-18*
*Phase 18 added: 2026-01-19*
*Phase 19 added: 2026-01-19 (Stripe Production Setup - from browser inspection findings)*
*Phase 20 added: 2026-01-19 (Vercel Deployment Readiness - build checks, performance, security, monitoring)*
