# Roadmap: AI Radiologist - Production Integration

## Overview

Transform a functional UI prototype into a production-ready AI radiology application. The journey starts with database verification, builds through authentication and core features (templates, AI reports, voice transcription), adds monetization via Stripe, and completes with admin capabilities. Each phase delivers working functionality that can be verified end-to-end.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Database Foundation** - Verify and align Supabase schema with RLS
- [x] **Phase 2: Authentication** - Real Supabase Auth with email/password
- [x] **Phase 3: Template System** - CRUD operations connected to real database
- [x] **Phase 4: AI Report Generation** - GPT-4o streaming report generation
- [x] **Phase 5: Voice Transcription** - Whisper API voice-to-text
- [x] **Phase 6: AI Template Suggestions** - GPT-4o template recommendations
- [x] **Phase 7: PDF Export** - Professional PDF report export
- [x] **Phase 8: User Settings & Macros** - Preferences and macros in database
- [ ] **Phase 9: Stripe Billing** - Subscriptions and usage tracking
- [ ] **Phase 10: Admin Dashboard** - User and template management

## Phase Details

### Phase 1: Database Foundation
**Goal**: Verified database schema with RLS security
**Depends on**: Nothing (first phase)
**Requirements**: DB-01, DB-02
**Success Criteria** (what must be TRUE):
  1. Supabase schema matches codebase type definitions
  2. RLS policies prevent cross-user data access
  3. Database migrations run without errors
**Research**: Unlikely (existing Supabase project)
**Plans**: TBD

Plans:
- [x] 01-01: Schema verification and alignment

### Phase 2: Authentication
**Goal**: Users can sign up, verify email, log in, and reset password
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can create account with email/password
  2. User receives verification email after signup
  3. User can log in and session persists across refresh
  4. User can reset password via email link
**Research**: Unlikely (Supabase Auth patterns established)
**Plans**: TBD

Plans:
- [x] 02-01: Replace mock auth with real Supabase Auth

### Phase 3: Template System
**Goal**: Users can manage personal templates with real database storage
**Depends on**: Phase 2
**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05, TMPL-06
**Success Criteria** (what must be TRUE):
  1. User can create a new template (saved to database)
  2. User can view list of their templates
  3. User can edit and delete their templates
  4. User can clone a global template to personal collection
  5. Invalid templates are rejected with validation errors
**Research**: Unlikely (existing UI patterns, CRUD operations)
**Plans**: TBD

Plans:
- [x] 03-01: Connect template CRUD to database
- [x] 03-02: Global template cloning

### Phase 4: AI Report Generation
**Goal**: Users can generate and stream AI radiology reports
**Depends on**: Phase 3
**Requirements**: REPORT-01, REPORT-03, REPORT-05
**Success Criteria** (what must be TRUE):
  1. User can enter clinical findings text
  2. User receives streamed AI response in real-time
  3. Generated report displays in section-based format
  4. Report generation respects user's selected template
**Research**: Likely (OpenAI GPT-4o API, SSE streaming patterns)
**Research topics**: GPT-4o structured output for medical reports, SSE streaming in Next.js Edge
**Plans**: TBD

Plans:
- [x] 04-01: GPT-4o report generation with SSE streaming

### Phase 5: Voice Transcription
**Goal**: Users can transcribe voice input using Whisper API
**Depends on**: Phase 4
**Requirements**: REPORT-02
**Success Criteria** (what must be TRUE):
  1. User can record or upload audio
  2. Audio is transcribed to text via Whisper
  3. Transcribed text populates input field for report generation
**Research**: Likely (Whisper API, audio file handling)
**Research topics**: Whisper API file formats, chunked upload patterns
**Plans**: TBD

Plans:
- [x] 05-01: Whisper API integration

### Phase 6: AI Template Suggestions
**Goal**: Users can get AI-assisted template recommendations
**Depends on**: Phase 4
**Requirements**: TMPL-07
**Success Criteria** (what must be TRUE):
  1. User can request AI suggestions for template improvement
  2. Suggestions are relevant to radiology domain
**Research**: Likely (GPT-4o for suggestions)
**Research topics**: Prompt engineering for template suggestions
**Plans**: TBD

Plans:
- [x] 06-01: AI template suggestion feature

### Phase 7: PDF Export
**Goal**: Users can export reports as professional PDFs
**Depends on**: Phase 4
**Requirements**: REPORT-04
**Success Criteria** (what must be TRUE):
  1. User can export generated report as PDF
  2. PDF has professional formatting suitable for medical records
**Research**: Unlikely (existing client-side PDF export)
**Plans**: TBD

Plans:
- [x] 07-01: Verify and enhance PDF export

### Phase 8: User Settings & Macros
**Goal**: Users can manage preferences and macros
**Depends on**: Phase 2
**Requirements**: SETT-01, SETT-02, SETT-03
**Success Criteria** (what must be TRUE):
  1. User preferences persist across sessions
  2. User can create, edit, and delete macros
  3. User can update profile information
**Research**: Unlikely (standard CRUD operations)
**Plans**: TBD

Plans:
- [x] 08-01: Preferences database integration
- [x] 08-02: Macros CRUD API

### Phase 9: Stripe Billing
**Goal**: Users can subscribe and system tracks usage
**Depends on**: Phase 2
**Requirements**: BILL-01, BILL-02, BILL-03
**Success Criteria** (what must be TRUE):
  1. User can subscribe to a plan via Stripe checkout
  2. Subscription changes are processed via webhooks
  3. User can view their usage statistics
**Research**: Likely (Stripe API, webhooks)
**Research topics**: Stripe subscription lifecycle, webhook event handling, usage metering
**Plans**: TBD

Plans:
- [ ] 09-01: Stripe checkout integration
- [ ] 09-02: Webhook handlers and usage tracking

### Phase 10: Admin Dashboard
**Goal**: Admins can manage users and templates
**Depends on**: Phase 3
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03
**Success Criteria** (what must be TRUE):
  1. Admin can view list of all users
  2. Admin can publish/unpublish global templates
  3. Admin can view system-wide analytics
**Research**: Unlikely (existing admin UI patterns)
**Plans**: TBD

Plans:
- [ ] 10-01: Connect admin features to database

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Database Foundation | 1/1 | Complete | 2026-01-16 |
| 2. Authentication | 1/1 | Complete | 2026-01-16 |
| 3. Template System | 2/2 | Complete | 2026-01-16 |
| 4. AI Report Generation | 1/1 | Complete | 2026-01-16 |
| 5. Voice Transcription | 1/1 | Complete | 2026-01-16 |
| 6. AI Template Suggestions | 1/1 | Complete | 2026-01-16 |
| 7. PDF Export | 1/1 | Complete | 2026-01-16 |
| 8. User Settings & Macros | 2/2 | Complete | 2026-01-16 |
| 9. Stripe Billing | 0/2 | Not started | - |
| 10. Admin Dashboard | 0/1 | Not started | - |

---
*Roadmap created: 2026-01-16*
