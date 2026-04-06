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

- [x] **ADMIN-01**: Admin can view and manage users in real database
- [x] **ADMIN-02**: Admin can publish/unpublish global templates
- [x] **ADMIN-03**: Admin can view system-wide usage analytics

### Database

- [x] **DB-01**: Supabase schema verified and aligned with codebase expectations
- [x] **DB-02**: Row-Level Security policies enforce data isolation per user

### UI/UX

- [x] **UX-01**: Application has modern, distinctive visual design (not generic medical app look)
- [x] **UX-02**: Consistent design language across all pages with smooth micro-interactions
- [x] **UX-03**: Responsive design works beautifully on desktop and tablet viewports

## v1.1 Requirements

Production readiness polish. Workspace consolidation, AI prompt alignment, export enhancement.

### Workspace

- [x] **V1.1-WS-01**: Dashboard uses 2-panel layout (sidebar + workspace, no reports panel)
- [x] **V1.1-WS-02**: Workspace hub has all buttons wired to real APIs with file upload support

### AI Quality

- [x] **V1.1-AI-01**: AI system prompts align with reference documentation for production-quality outputs

### Export

- [ ] **V1.1-EX-01**: PDF export triggers direct download with report content only (no print dialog)
- [ ] **V1.1-EX-02**: Word/DOCX download option available for reports

## v1.4 Requirements

Legal compliance through disclaimer-first approach. Maximum liability protection via ubiquitous warnings.

### Core Legal Documents

- [x] **LEGAL-01**: Terms of Service with maximum liability protection (use at own risk, user responsibility, indemnification, no warranties, owners not responsible)
- [x] **LEGAL-02**: Simple Privacy Policy stating data is ephemeral and not stored

### Sign-Up Gate

- [x] **GATE-01**: Sign-up requires checkbox: "I accept the Terms of Service and understand this tool is provided as-is with no warranties"
- [x] **GATE-02**: Sign-up requires checkbox: "I understand I must NOT upload patient-identifiable or personal information"

### First-Use Acknowledgment

- [x] **ACK-01**: First login shows mandatory modal that cannot be dismissed without acknowledgment: "This is an AI drafting tool. I am solely responsible for reviewing all output. The owners accept no responsibility for any decisions made using this tool."

### Persistent App-Wide Disclaimer Banner

- [x] **BANNER-01**: Every authenticated page displays a persistent disclaimer banner (not dismissible) with text like: "⚠️ Do not upload personal data. AI-generated content requires review. Use at your own risk."
- [x] **BANNER-02**: Banner is visually prominent but not obstructive (e.g., slim top bar, contrasting color)

### Page-Specific Warnings

- [x] **WARN-01**: Dashboard shows reminder card: "This is a drafting tool. Do not enter patient-identifiable or personal information."
- [x] **WARN-02**: Voice transcription interface shows warning before recording: "Audio is processed by AI and not stored. Do not dictate personal identifiers."
- [x] **WARN-03**: Report generation page shows warning: "AI-generated draft. Review and verify all content before use."
- [x] **WARN-04**: Template creation shows note: "Templates should not contain personal information."

### Report Output Disclaimers

- [x] **OUTPUT-01**: Every generated report displays header: "AI-GENERATED DRAFT — NOT REVIEWED"
- [x] **OUTPUT-02**: Every generated report displays footer: "Generated with AI assistance. User is solely responsible for accuracy. Not medical advice."
- [x] **OUTPUT-03**: PDF/DOCX exports include the same header and footer disclaimers

### Settings Reminder

- [x] **SETT-01**: Settings page includes "Data & Privacy" section explaining ephemeral processing and user responsibility

## v1.5 Requirements

Report formatting customization. Users can personalize how list items appear in generated reports.

### Report Formatting

- [x] **FMT-01**: User can access list style preferences in Settings page
- [x] **FMT-02**: User can choose from 5 list styles: Bullet (•), Dash (-), Arrow (→), Numbered (1.), None
- [x] **FMT-03**: User can set list style per report section (Clinical Info, Technique, Findings, Impression, etc.)
- [x] **FMT-04**: User can apply a style to all sections at once ("Apply to All" action)
- [x] **FMT-05**: Default style is Bullet (•) for new users
- [x] **FMT-06**: List style preference applies only to newly generated reports
- [x] **FMT-07**: List style renders correctly in PDF export
- [x] **FMT-08**: List style renders correctly in Word export

## v3.0 Requirements

Cost-optimized AI infrastructure. Replace OpenAI with Groq for ~93% cost reduction while maintaining medical report quality.

### Provider Infrastructure

- [x] **INFRA-01**: System reads AI model provider and model name from environment variables, enabling deploy-time switching without code changes
- [x] **INFRA-02**: Provider abstraction layer decouples model selection from API route handlers, so swapping models requires zero route changes

### Report Generation Migration

- [x] **GEN-01**: Report generation uses Groq Llama 4 Scout instead of GPT-4o, producing radiology reports at ~96% lower cost
- [x] **GEN-02**: System prompt is adapted for open-source models with explicit reasoning chains, under 2K tokens, maintaining anti-hallucination rules
- [x] **GEN-03**: Quality validation baseline exists with 20+ test cases across modalities (MRI, CT, X-ray, ultrasound) comparing Llama 4 output against GPT-4o baseline

### Transcription Migration

- [x] **TRANS-01**: Voice transcription uses Groq Whisper v3 Turbo instead of OpenAI Whisper, with medical vocabulary hints for radiology terminology

### Reliability

- [ ] **REL-01**: Fallback chain automatically routes to OpenAI GPT-4o when Groq is unavailable or returns errors, with no user action required

### Cost Management

- [x] **COST-01**: Cost tracking uses actual token counts from provider responses instead of hardcoded estimates, with per-provider pricing

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
| Patient data storage | Creates liability, keep ephemeral model |
| Report history/storage | Don't store what we tell users not to input |
| Accuracy/performance claims | Never make claims without documented methodology |
| Complex GDPR compliance | Disclaimer-based approach instead |
| Cookie consent banner | Minimal analytics, overkill for startup |
| Self-hosted LLM inference | Breakeven at 5-10M tokens/month; project estimates ~500K |
| Fine-tuned radiology model | Requires curated medical training data, 3-6 month project |
| User-selectable models | Creates UX confusion, multiplies QA surface area |
| Custom prompt editor | Risks medically unsafe reports if users modify anti-hallucination rules |
| Multi-provider load balancing (5+) | Diminishing returns; 3 providers (Groq, Together AI, OpenAI) is manageable |
| Intelligent model routing | Requires production traffic data; defer to v3.1+ |
| A/B quality dashboard | Requires routing + telemetry infrastructure; defer to v3.2+ |
| Canary deployment | Requires routing + dashboard; defer to v3.2+ |
| Cloudflare Workers AI | Extra hop from Vercel adds latency; Groq is cheaper and simpler |
| Gemma 4 | No medical benchmarks; Llama has RSNA validation backing |

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
| ADMIN-01 | Phase 10 | Complete |
| ADMIN-02 | Phase 10 | Complete |
| ADMIN-03 | Phase 10 | Complete |
| UX-01 | Phase 11 | Complete |
| UX-02 | Phase 11 | Complete |
| UX-03 | Phase 11 | Complete |
| V1.1-WS-01 | Phase 12 | Complete |
| V1.1-WS-02 | Phase 12 | Complete |
| V1.1-AI-01 | Phase 13 | Complete |
| V1.1-EX-01 | Phase 14 | Pending |
| V1.1-EX-02 | Phase 14 | Pending |
| LEGAL-01 | Phase 21 | Complete |
| LEGAL-02 | Phase 21 | Complete |
| GATE-01 | Phase 22 | Complete |
| GATE-02 | Phase 22 | Complete |
| ACK-01 | Phase 22 | Complete |
| BANNER-01 | Phase 23 | Complete |
| BANNER-02 | Phase 23 | Complete |
| WARN-01 | Phase 24 | Complete |
| WARN-02 | Phase 24 | Complete |
| WARN-03 | Phase 24 | Complete |
| WARN-04 | Phase 24 | Complete |
| OUTPUT-01 | Phase 25 | Complete |
| OUTPUT-02 | Phase 25 | Complete |
| OUTPUT-03 | Phase 25 | Complete |
| SETT-01 (v1.4) | Phase 26 | Pending |
| FMT-01 | Phase 27 | Complete |
| FMT-02 | Phase 27 | Complete |
| FMT-03 | Phase 27 | Complete |
| FMT-04 | Phase 27 | Complete |
| FMT-05 | Phase 27 | Complete |
| FMT-06 | Phase 27 | Complete |
| FMT-07 | Phase 27 | Complete |
| FMT-08 | Phase 27 | Complete |
| INFRA-01 | Phase 31 | Complete |
| INFRA-02 | Phase 31 | Complete |
| GEN-01 | Phase 32 | Complete |
| GEN-02 | Phase 32 | Complete |
| GEN-03 | Phase 32 | Complete |
| TRANS-01 | Phase 33 | Complete |
| REL-01 | Phase 34 | Pending |
| COST-01 | Phase 34 | Complete |

**Coverage:**
- v1 requirements: 30 total (all complete)
- v1.1 requirements: 5 total (3 complete, 2 pending)
- v1.4 requirements: 15 total (14 complete, 1 pending)
- v1.5 requirements: 8 total (8 complete)
- v3.0 requirements: 8 total (0 complete, 8 pending)
- Mapped to phases: 66
- Unmapped: 0

---
*Requirements defined: 2026-01-16*
*Last updated: 2026-04-05 after v3.0 roadmap created (Phases 31-34)*
