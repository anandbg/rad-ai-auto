# AI Radiologist - Production Integration

## Current Milestone: v3.0 Cost-Optimized AI Infrastructure

**Goal:** Replace OpenAI with near-zero-cost self-hosted or alternative AI models for report generation and transcription, while maintaining output quality and scaling to 200 concurrent users.

**Target features:**
- Replace GPT-4o report generation with cost-optimized model (Gemma 4, Llama 3, Mistral, etc.) via Cloudflare Workers AI, Replicate, Together AI, or similar
- Replace Whisper transcription with cost-optimized speech-to-text (Workers AI Whisper, Deepgram, open-source alternatives)
- Scale rate limiting and infrastructure from 50-75 to 200 simultaneous users
- Model output quality validation — ensure replacements match current GPT-4o radiology report quality
- Fallback/failover strategy if primary model degrades
- Cost monitoring and tracking to verify savings

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

- [ ] Replace GPT-4o with cost-optimized model for radiology report generation
- [ ] Replace Whisper with cost-optimized speech-to-text for transcription
- [ ] Research and select optimal model hosting (Cloudflare Workers AI, Replicate, Together AI, self-hosted, etc.)
- [ ] Scale concurrent user capacity from 75 to 200 simultaneous users
- [ ] Implement model quality validation (compare output with GPT-4o baseline)
- [ ] Add fallback/failover when primary model degrades
- [ ] Implement cost monitoring and tracking

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

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-05 after milestone v3.0 started*
