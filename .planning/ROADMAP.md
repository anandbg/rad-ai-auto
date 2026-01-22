# Roadmap: AI Radiologist - Production Integration

## Milestones

- ✅ **v1.0 MVP** — Phases 1-11 (shipped 2026-01-16) → [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Production Readiness** — Phases 12-14 (shipped 2026-01-17) → [archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 Template Experience** — Phases 15, 17, 18 (shipped 2026-01-20) → [archive](milestones/v1.2-ROADMAP.md)
- ⚠️ **v1.3 Production Infrastructure** — Phases 16, 19, 20 (code complete, deployment pending) → [archive](milestones/v1.3-ROADMAP.md)
- ✅ **v1.4 Legal Compliance** — Phases 21-26 (shipped 2026-01-20) → [archive](milestones/v1.4-ROADMAP.md)
- ✅ **v1.5 Report Formatting** — Phase 27 (shipped 2026-01-20) → [archive](milestones/v1.5-ROADMAP.md)
- 🚧 **v2.0 Production Launch** — Phase 28 (in progress)

## 🚧 v2.0 Production Launch

**Milestone Goal:** Complete all manual infrastructure setup and deploy to production.

### Phase 28: Production Deployment

**Goal:** Set up production infrastructure and deploy the application
**Status:** Not started
**Plans:** 5 plans (matching original Phase 16 scope + go-live)

This phase consolidates all deferred infrastructure work:

#### 28.1: Company Identity & Domain (Manual)
- [ ] Register company domain
- [ ] Set up DNS management
- [ ] Create company email
- [ ] Create Google account under company email
- [ ] Document credentials securely

#### 28.2: Supabase Production Setup (Manual)
- [ ] Create Supabase organization under company identity
- [ ] Create `airad-prod` project (production)
- [ ] Enable connection pooling (PgBouncer)
- [ ] Run database migrations on production
- [ ] Document connection strings

#### 28.3: Vercel Production Setup (Manual)
- [ ] Create Vercel account under company identity
- [ ] Connect GitHub repository
- [ ] Configure environment variables (Production scope)
- [ ] Set up custom domain
- [ ] Test deployment pipeline

#### 28.4: Google OAuth Production (Manual)
- [ ] Create Google Cloud project under company account
- [ ] Configure OAuth consent screen
- [ ] Create production OAuth credentials
- [ ] Configure Supabase Auth → Google provider
- [ ] Test OAuth flow on production

#### 28.5: Stripe Production Go-Live (Manual)
From `.planning/phases/19-stripe-production-setup/PRODUCTION-CHECKLIST.md`:
- [ ] Complete pre-launch manual testing (checkout, upgrade, cancel, failure)
- [ ] Switch to Stripe Live Mode
- [ ] Create Live products/prices
- [ ] Create Production Webhook Endpoint
- [ ] Configure Vercel Production Environment Variables
- [ ] Post-launch verification with real card

**Dependencies:** All code phases complete. This is manual infrastructure work.

**Reference Documents:**
- Original Phase 16 scope: See ROADMAP archive v1.3
- Stripe checklist: `.planning/phases/19-stripe-production-setup/PRODUCTION-CHECKLIST.md`
- Vercel verification: `.planning/phases/20-vercel-deployment-readiness/20-VERIFICATION.md`
- Deployment guide: `app/DEPLOYMENT.md`

## Progress Summary

| Milestone | Phases | Plans | Status |
|-----------|--------|-------|--------|
| v1.0 MVP | 1-11 | 18 | ✅ Shipped 2026-01-16 |
| v1.1 Production Readiness | 12-14 | 4 | ✅ Shipped 2026-01-17 |
| v1.2 Template Experience | 15, 17, 18 | 8 | ✅ Shipped 2026-01-20 |
| v1.3 Production Infrastructure | 16, 19, 20 | 13 | ⚠️ Code complete, Phase 16 deferred |
| v1.4 Legal Compliance | 21-26 | 7 | ✅ Shipped 2026-01-20 |
| v1.5 Report Formatting | 27 | 2 | ✅ Shipped 2026-01-20 |
| **v2.0 Production Launch** | **28** | **5** | 🚧 In progress |

---
*Roadmap created: 2026-01-16*
*Batch archived: 2026-01-22 (v1.0, v1.1, v1.3, v1.4, v1.5)*
*v2.0 added: 2026-01-22 (consolidates deferred Phase 16 + go-live)*
