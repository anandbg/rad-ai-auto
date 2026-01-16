# Requirements: AI Radiologist - Production Integration

**Defined:** 2026-01-16
**Core Value:** A radiologist can sign up, generate a real AI report from voice/text input, and export it as a PDF. The complete user journey must work end-to-end.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can sign up with email and password using Supabase Auth
- [x] **AUTH-02**: User receives email verification after signup
- [x] **AUTH-03**: User can reset password via email link
- [x] **AUTH-04**: User session persists across browser refresh

### Report Generation

- [x] **REPORT-01**: User can generate radiology report using GPT-4o from text input
- [x] **REPORT-02**: User can transcribe voice input to text using Whisper API
- [x] **REPORT-03**: User can view generated report with section-based display (findings, impressions, recommendations)
- [x] **REPORT-04**: User can export generated report as professional PDF
- [x] **REPORT-05**: User receives report text via SSE streaming as GPT-4o generates it

### Templates

- [x] **TMPL-01**: User can create personal templates stored in real database
- [x] **TMPL-02**: User can read/list their templates from database
- [x] **TMPL-03**: User can update their existing templates
- [x] **TMPL-04**: User can delete their personal templates
- [x] **TMPL-05**: User can clone global templates to personal collection
- [x] **TMPL-06**: Templates are validated using Zod schemas before save
- [x] **TMPL-07**: User can get AI-assisted suggestions for template creation/improvement

### Billing

- [x] **BILL-01**: User can subscribe to a plan via Stripe (test mode)
- [x] **BILL-02**: System processes Stripe webhook events (payment success, subscription changes)
- [x] **BILL-03**: User can view their usage statistics (reports generated, transcriptions)

### Settings

- [x] **SETT-01**: User preferences are stored in real database
- [x] **SETT-02**: User can create and manage personal macros (text shortcuts)
- [x] **SETT-03**: User can update their profile (display name, email settings)

### Admin

- [ ] **ADMIN-01**: Admin can view and manage users in real database
- [ ] **ADMIN-02**: Admin can publish/unpublish global templates
- [ ] **ADMIN-03**: Admin can view system-wide usage analytics

### Database

- [x] **DB-01**: Supabase schema verified and aligned with codebase expectations
- [x] **DB-02**: Row-Level Security policies enforce data isolation per user

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-V2-01**: User can sign in with Google OAuth
- **AUTH-V2-02**: User can enable two-factor authentication

### Billing

- **BILL-V2-01**: Credit ledger tracks AI usage with purchase/spend transactions
- **BILL-V2-02**: User can purchase additional credits

### Features

- **FEAT-V2-01**: Offline draft storage with IndexedDB
- **FEAT-V2-02**: Streaming transcription feedback
- **FEAT-V2-03**: Streaming template suggestions
- **FEAT-V2-04**: DOCX export option

### Admin

- **ADMIN-V2-01**: Admin can suspend/ban users
- **ADMIN-V2-02**: Admin can view audit logs

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Google OAuth | Defer until email/password auth is solid |
| Production deployment | Focus on local end-to-end first |
| HIPAA compliance hardening | Future phase |
| Institution/multi-tenant features | Phase 2 scope |
| Advanced template versioning | Phase 2 scope |
| Mobile app | Web-first approach |
| Real-time collaboration | High complexity, not core value |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1 | Complete |
| DB-02 | Phase 1 | Complete |
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| TMPL-01 | Phase 3 | Complete |
| TMPL-02 | Phase 3 | Complete |
| TMPL-03 | Phase 3 | Complete |
| TMPL-04 | Phase 3 | Complete |
| TMPL-05 | Phase 3 | Complete |
| TMPL-06 | Phase 3 | Complete |
| REPORT-01 | Phase 4 | Complete |
| REPORT-03 | Phase 4 | Complete |
| REPORT-05 | Phase 4 | Complete |
| REPORT-02 | Phase 5 | Complete |
| TMPL-07 | Phase 6 | Complete |
| REPORT-04 | Phase 7 | Complete |
| SETT-01 | Phase 8 | Complete |
| SETT-02 | Phase 8 | Complete |
| SETT-03 | Phase 8 | Complete |
| BILL-01 | Phase 9 | Complete |
| BILL-02 | Phase 9 | Complete |
| BILL-03 | Phase 9 | Complete |
| ADMIN-01 | Phase 10 | Pending |
| ADMIN-02 | Phase 10 | Pending |
| ADMIN-03 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27 ✓
- Unmapped: 0

---
*Requirements defined: 2026-01-16*
*Last updated: 2026-01-16 after Phase 9 completion*
