# AI Radiologist - Production Integration

## Current Milestone: v1.4 Legal Compliance

**Goal:** Research and implement all legal requirements for global commercial launch of an AI radiology decision-support tool, including disclaimers, terms of service, and privacy-preserving architecture.

**Target features:**
- Research global compliance requirements for AI decision-support tools (US, EU, major markets)
- Implement Terms of Service, Privacy Policy, and AI usage disclaimers
- Add in-app consent flows and acknowledgment mechanisms
- Ensure data architecture enforces no-PHI-storage policy (reports/transcriptions ephemeral)
- Add appropriate liability disclaimers and "not medical advice" guardrails
- Document compliance posture for commercial launch

## What This Is

An AI-powered radiology report generation application that helps radiologists create detailed medical reports through voice transcription and AI-assisted generation. Currently a functional UI prototype with mock data — this project connects it to real backends (Supabase, OpenAI, Stripe) for end-to-end functionality.

## Core Value

A radiologist can sign up, generate a real AI report from voice/text input, and export it as a PDF. The complete user journey must work end-to-end.

## Requirements

### Validated

- ✓ Next.js 14 App Router architecture with protected/public route groups — existing
- ✓ UI component library (Radix + Tailwind + Framer Motion) — existing
- ✓ Page structure: auth flows, dashboard, templates, generate, settings, admin — existing
- ✓ Supabase client configuration (browser, server, middleware) — existing
- ✓ Auth context and session management patterns — existing
- ✓ Template system UI with CRUD operations — existing
- ✓ Report generation UI with section-based display — existing
- ✓ PDF/DOCX export functionality (client-side) — existing
- ✓ IndexedDB offline draft storage — existing
- ✓ Zod validation schemas for templates — existing
- ✓ Stripe SDK integration patterns — existing
- ✓ Protected route middleware — existing
- ✓ Real Supabase Auth (email/password) — v1.0
- ✓ Supabase schema with RLS policies — v1.0
- ✓ Template CRUD connected to database — v1.0
- ✓ User preferences in database — v1.0
- ✓ GPT-4o streaming report generation — v1.0
- ✓ Whisper voice transcription — v1.0
- ✓ AI template suggestions — v1.0
- ✓ Stripe billing (subscriptions, credits, webhooks) — v1.0
- ✓ Admin dashboard with user management — v1.0
- ✓ Macros system in database — v1.0
- ✓ 3-panel application shell with motion system — v1.0

### Active

- [ ] Research global AI decision-support compliance (HIPAA exemptions, GDPR, MDR, FDA guidance)
- [ ] Draft Terms of Service with appropriate liability limitations
- [ ] Draft Privacy Policy documenting no-PHI-storage architecture
- [ ] Implement AI disclaimer banners and consent acknowledgments
- [ ] Add "Decision Support Only" disclaimers throughout the app
- [ ] Verify ephemeral data handling (transcriptions auto-delete, reports not persisted)
- [ ] Document compliance posture for investors/partners

### Out of Scope

- Google OAuth — defer until email/password auth is solid
- Production deployment — focus on local end-to-end first
- HIPAA compliance hardening — future phase
- Institution/multi-tenant features — Phase 2 scope
- Advanced template versioning — Phase 2 scope

## Context

**Current State:**
- Substantial Next.js application with complete UI structure
- All features use mock data or stubbed API responses
- Auth context exists but uses mock authentication
- Supabase project exists but schema alignment uncertain
- OpenAI integration stubbed (simulates responses)
- Stripe webhooks have signature validation but no real handlers

**Codebase Map:**
- Architecture documented in `.planning/codebase/ARCHITECTURE.md`
- Stack documented in `.planning/codebase/STACK.md`
- 7 analysis documents available

**Key Files:**
- `app/lib/auth/auth-context.tsx` — Auth provider (currently mock)
- `app/lib/supabase/` — Supabase client trio
- `app/app/api/` — API routes (many stubbed)
- `app/app/(protected)/generate/page.tsx` — Report generation UI

## Constraints

- **Database**: Supabase PostgreSQL with Row-Level Security — existing project
- **AI Provider**: OpenAI (GPT-4o for text, Whisper for audio) — cost-conscious usage
- **Payments**: Stripe test mode — no real charges during development
- **Runtime**: Next.js Edge for AI routes, Node.js for Stripe webhooks
- **Package Manager**: pnpm 8.15.6

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Real Supabase Auth over custom | Leverages existing Supabase setup, secure by default | — Pending |
| GPT-4o with low temperature (0.2) | Deterministic medical reports, consistency | — Pending |
| Stripe test mode first | Safe development, easy to flip to production | — Pending |
| Full user journey priority | End-to-end flow proves architecture works | — Pending |

---
*Last updated: 2026-01-20 after milestone v1.4 started*
