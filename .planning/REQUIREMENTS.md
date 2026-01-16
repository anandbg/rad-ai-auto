# Requirements: AI Radiologist - Production Integration

**Defined:** 2026-01-16
**Core Value:** A radiologist can sign up, generate a real AI report from voice/text input, and export it as a PDF. The complete user journey must work end-to-end.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password using Supabase Auth
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: User can reset password via email link
- [ ] **AUTH-04**: User session persists across browser refresh

### Report Generation

- [ ] **REPORT-01**: User can generate radiology report using GPT-4o from text input
- [ ] **REPORT-02**: User can transcribe voice input to text using Whisper API
- [ ] **REPORT-03**: User can view generated report with section-based display (findings, impressions, recommendations)
- [ ] **REPORT-04**: User can export generated report as professional PDF
- [ ] **REPORT-05**: User receives report text via SSE streaming as GPT-4o generates it

### Templates

- [ ] **TMPL-01**: User can create personal templates stored in real database
- [ ] **TMPL-02**: User can read/list their templates from database
- [ ] **TMPL-03**: User can update their existing templates
- [ ] **TMPL-04**: User can delete their personal templates
- [ ] **TMPL-05**: User can clone global templates to personal collection
- [ ] **TMPL-06**: Templates are validated using Zod schemas before save
- [ ] **TMPL-07**: User can get AI-assisted suggestions for template creation/improvement

### Billing

- [ ] **BILL-01**: User can subscribe to a plan via Stripe (test mode)
- [ ] **BILL-02**: System processes Stripe webhook events (payment success, subscription changes)
- [ ] **BILL-03**: User can view their usage statistics (reports generated, transcriptions)

### Settings

- [ ] **SETT-01**: User preferences are stored in real database
- [ ] **SETT-02**: User can create and manage personal macros (text shortcuts)
- [ ] **SETT-03**: User can update their profile (display name, email settings)

### Admin

- [ ] **ADMIN-01**: Admin can view and manage users in real database
- [ ] **ADMIN-02**: Admin can publish/unpublish global templates
- [ ] **ADMIN-03**: Admin can view system-wide usage analytics

### Database

- [ ] **DB-01**: Supabase schema verified and aligned with codebase expectations
- [ ] **DB-02**: Row-Level Security policies enforce data isolation per user

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
| AUTH-01 | - | Pending |
| AUTH-02 | - | Pending |
| AUTH-03 | - | Pending |
| AUTH-04 | - | Pending |
| REPORT-01 | - | Pending |
| REPORT-02 | - | Pending |
| REPORT-03 | - | Pending |
| REPORT-04 | - | Pending |
| REPORT-05 | - | Pending |
| TMPL-01 | - | Pending |
| TMPL-02 | - | Pending |
| TMPL-03 | - | Pending |
| TMPL-04 | - | Pending |
| TMPL-05 | - | Pending |
| TMPL-06 | - | Pending |
| TMPL-07 | - | Pending |
| BILL-01 | - | Pending |
| BILL-02 | - | Pending |
| BILL-03 | - | Pending |
| SETT-01 | - | Pending |
| SETT-02 | - | Pending |
| SETT-03 | - | Pending |
| ADMIN-01 | - | Pending |
| ADMIN-02 | - | Pending |
| ADMIN-03 | - | Pending |
| DB-01 | - | Pending |
| DB-02 | - | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 0
- Unmapped: 27 ⚠️ (will be mapped by create-roadmap)

---
*Requirements defined: 2026-01-16*
*Last updated: 2026-01-16 after initial definition*
