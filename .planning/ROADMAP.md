# Roadmap: AI Radiologist - Production Integration

## Milestones

- ✅ **v1.0 MVP** - Phases 1-11 (shipped 2026-01-16)
- ✅ **v1.1 Production Readiness** - Phases 12-14 (shipped 2026-01-17)
- 🚧 **v1.2 Template Experience** - Phases 15, 17 (in progress)
- 📋 **v1.3 Production Infrastructure** - Phase 16 (planned)

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
- [ ] 15-01: Foundation - Dependencies + Drag-Drop Components (Wave 1)
- [ ] 15-02: AI Generation Endpoint with Structured Output (Wave 1)
- [ ] 15-03: Preview + Pathway Modal Components (Wave 1)
- [ ] 15-04: Editor Integration - Split Pane + Import (Wave 2)
- [ ] 15-05: AI Flow Wiring + Verification Checkpoint (Wave 3)

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
- [ ] 17-01: Foundation - Copy components, screenshots, update styles/Tailwind (Wave 1)
- [ ] 17-02: Integration - Wire to root URL with auth redirect + verify (Wave 2)

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

## Progress

**Execution Order:**
Phases execute in numeric order: 15 → 16 → ...

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-11 | v1.0 | 18/18 | Complete | 2026-01-16 |
| 12-14 | v1.1 | 4/4 | Complete | 2026-01-17 |
| 15. Template Creation UX | v1.2 | 0/5 | Planned | - |
| 16. Infrastructure Setup | v1.3 | 0/5 | Planned | - |
| 17. Landing Page Integration | v1.2 | 0/2 | Planned | - |

---
*Roadmap created: 2026-01-16*
*v1.1 added: 2026-01-17*
*v1.2 added: 2026-01-18*
*v1.3 added: 2026-01-18*
*Phase 17 added: 2026-01-18*
