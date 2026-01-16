# AI Radiologist - Production Integration

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

### Active

- [ ] Replace mock auth with real Supabase Auth (email/password)
- [ ] Verify and align Supabase schema with codebase expectations
- [ ] Connect template CRUD to real database (remove mock data)
- [ ] Connect user preferences to real database
- [ ] Implement real GPT-4o report generation (replace simulation)
- [ ] Implement real Whisper voice transcription
- [ ] Implement AI-assisted template suggestions
- [ ] Connect Stripe billing (test mode) — subscriptions, credits, webhooks
- [ ] Connect admin user management to real database
- [ ] Connect macros system to real database
- [ ] Verify credit ledger and usage tracking works end-to-end

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
*Last updated: 2026-01-16 after initialization*
