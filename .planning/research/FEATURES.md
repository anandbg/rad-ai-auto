# Legal Compliance Features Research

**Researched:** 2026-01-20
**Domain:** AI Medical Decision-Support Legal Compliance
**Confidence:** HIGH (verified against FDA, EU MDR, GDPR, TGA official sources and recent regulatory updates)

## Executive Summary

AI Radiologist operates as a **clinical decision-support tool** (not a diagnostic tool), which places it in a favorable regulatory category - the FDA's 21st Century Cures Act explicitly excludes certain CDS tools from medical device oversight when they support (not replace) clinical decision-making with transparent recommendations that clinicians independently review. The app's ephemeral data model (no PHI storage) further reduces compliance burden since HIPAA's strictest requirements apply primarily to entities that "create, receive, maintain, or transmit" PHI.

For global commercial launch, the critical compliance features are: (1) clear "not medical advice" disclaimers, (2) AI use disclosure, (3) explicit terms/privacy policy acceptance, and (4) transparent data handling communication. Trust-building differentiators include deletion confirmation UX, granular consent controls, and tiered transparency about AI involvement. The key anti-feature is avoiding any form of persistent patient data storage, which would trigger significantly more onerous HIPAA Business Associate and EU MDR requirements.

## Regulatory Classification Context

### Why This Matters for Feature Selection

| Classification | Regulatory Burden | AI Radiologist Status |
|----------------|-------------------|----------------------|
| **Diagnostic SaMD** | FDA 510(k)/De Novo, EU MDR Class IIa+, full QMS | NOT this - we don't diagnose |
| **Clinical Decision Support (Non-Device)** | Minimal federal regulation, state disclosure laws | THIS - supports radiologist judgment |
| **Health/Wellness App** | FTC oversight only | NOT this - involves clinical workflow |

**AI Radiologist qualifies as Non-Device CDS because it:**
1. Does NOT acquire/process medical images directly (radiologist inputs findings)
2. Provides recommendations radiologists independently evaluate
3. Does NOT make autonomous clinical decisions
4. Provides transparent basis for recommendations (template + AI generation)

**Source:** [FDA CDS FAQs](https://www.fda.gov/medical-devices/software-medical-device-samd/clinical-decision-support-software-frequently-asked-questions-faqs)

---

## Table Stakes Features (Must Have Before Launch)

### 1. "Not Medical Advice" Disclaimer System

**Requirement:** Clear, prominent disclaimers that the tool does not provide medical advice and does not replace professional judgment.

**Implementation:**

| Location | Format | Content |
|----------|--------|---------|
| Login/Signup | Checkbox acknowledgment | "I understand this tool assists with documentation and does not provide medical advice" |
| Report Generation UI | Persistent banner | "AI-ASSISTED DOCUMENTATION - Review all content before clinical use" |
| Generated Reports | Footer on every report | "Generated using AI assistance. Not a substitute for professional medical judgment." |
| Terms of Service | Dedicated section | Full legal disclaimer with liability limitation |

**Legal Basis:**
- California AB 3030 (effective Jan 2025): Requires AI disclosure for clinical communications
- Texas SB 1188 (effective Sept 2025): Requires AI-generated records review by licensed practitioners
- General liability protection best practice

**Confidence:** HIGH - verified against [California AB 3030](https://www.afslaw.com/perspectives/alerts/california-requires-disclaimers-health-care-providers-ai-generated-patient) and [Texas regulations](https://www.fenwick.com/insights/publications/the-new-regulatory-reality-for-ai-in-healthcare-how-certain-states-are-reshaping-compliance)

---

### 2. AI Use Disclosure

**Requirement:** Inform users clearly when AI is involved in content generation.

**Implementation:**

| Touchpoint | Disclosure |
|------------|------------|
| Transcription output | "Transcribed using AI (OpenAI Whisper)" |
| Report generation | "Report generated using AI (GPT-4o) based on your input" |
| Template suggestions | "AI-suggested templates" badge |
| First use onboarding | Explanation of AI role in workflow |

**Legal Basis:**
- FDA 2025 guidance: Clear statement that device uses AI with plain-language description
- U.S. Blueprint for AI Bill of Rights: Right to notice and explanation
- State laws (CA, TX, PA, IL) requiring AI disclosure in healthcare

**Confidence:** HIGH - verified against [FDA AI guidance](https://www.ballardspahr.com/insights/alerts-and-articles/2025/08/fda-issues-guidance-on-ai-for-medical-devices)

---

### 3. Terms of Service with Healthcare-Specific Provisions

**Requirement:** Legally binding Terms of Service with healthcare-appropriate language.

**Implementation:**

Must Include:
- [ ] No doctor-patient relationship established
- [ ] User responsibility for clinical accuracy
- [ ] AI limitations and potential for errors
- [ ] Prohibited uses (autonomous diagnosis, patient-facing without review)
- [ ] Limitation of liability
- [ ] Indemnification clause
- [ ] Governing law and dispute resolution

**Acceptance Mechanism:**
- Clickwrap agreement (checkbox + "I Accept" button)
- Scroll-through requirement for first acceptance
- Re-acceptance required for material changes
- Audit trail of acceptance (timestamp, IP, version)

**Legal Basis:**
- [Feldman v. Google](https://www.sirion.ai/library/contract-management/end-user-license-agreement-eula/) - clickwrap agreements enforceable when user must actively consent
- Healthcare EULA requirements per [Jackson LLP guidance](https://jacksonllp.com/eula-for-healthcare-platforms-and-websites/)

**Confidence:** HIGH

---

### 4. Privacy Policy (Multi-Jurisdictional)

**Requirement:** Comprehensive privacy policy covering US, EU, and international requirements.

**Implementation:**

| Section | Content |
|---------|---------|
| Data Collection | What we collect (account info, usage data, voice for transcription) |
| Data Use | How we use it (service delivery, not training, not selling) |
| Data Retention | Ephemeral model - transcriptions/reports not stored server-side |
| Data Sharing | Third parties (OpenAI API, Supabase, Stripe) with purposes |
| User Rights | Access, deletion, portability (GDPR/CCPA) |
| Security Measures | Encryption, access controls |
| International Transfers | Where data may be processed |
| Contact | DPO/privacy contact information |

**Multi-jurisdictional Requirements:**
- GDPR (EU): Explicit consent for health data, right to erasure, 72-hour breach notification
- CCPA/CPRA (California): Right to know, delete, opt-out of sale
- 2025 State Laws (DE, IA, NH, NJ, TN, MN, MD, KY): Various consumer rights

**Confidence:** HIGH - verified against [GDPR healthcare requirements](https://www.dpo-consulting.com/blog/gdpr-healthcare) and [2025 state privacy laws](https://secureprivacy.ai/blog/saas-privacy-compliance-requirements-2025-guide)

---

### 5. Explicit Consent Flow (First Use)

**Requirement:** Active consent to terms, privacy policy, and AI use before accessing the application.

**Implementation:**

```
First Login Flow:
1. Welcome screen explaining the tool
2. Terms of Service (scrollable, required read)
   [ ] I have read and agree to the Terms of Service
3. Privacy Policy summary with link to full
   [ ] I have read and agree to the Privacy Policy
4. AI Disclosure acknowledgment
   [ ] I understand this tool uses AI and I am responsible for reviewing all AI-generated content
5. [Continue to Application] button (disabled until all checked)
```

**Storage:**
- Record consent timestamp, version accepted, IP address
- Store in user profile for audit purposes

**Re-consent Triggers:**
- Material changes to Terms or Privacy Policy
- New AI capabilities introduced
- Regulatory requirement changes

**Confidence:** HIGH - verified against [healthcare consent best practices](https://formsort.com/article/user-consent-in-saas-healthcare-and-fintech/)

---

### 6. Cookie/Analytics Consent Banner

**Requirement:** GDPR-compliant cookie consent for EU users; CCPA notice for CA users.

**Implementation:**

| Cookie Type | Consent Required | Default |
|-------------|-----------------|---------|
| Strictly Necessary | No | Enabled |
| Analytics (GA4) | Yes (EU), Notice (US) | Disabled until consent |
| Marketing | Yes | Disabled (we don't use) |

**Banner Requirements:**
- Equal prominence for Accept/Reject options
- Granular consent options (not just "Accept All")
- Persistent preference storage
- Easy withdrawal mechanism

**Variation by Region:**
- EU: Prior consent required, block scripts until opt-in
- US: Can use analytics with opt-out option (varies by state)
- Configure GA4 Consent Mode for privacy-compliant tracking

**Confidence:** MEDIUM - requirements vary by jurisdiction, see [GDPR cookie requirements 2025](https://secureprivacy.ai/blog/gdpr-cookie-consent-requirements-2025)

---

### 7. Data Handling Transparency

**Requirement:** Clear communication about what happens to user data, especially voice recordings and generated reports.

**Implementation:**

| Data Type | What We Tell Users |
|-----------|-------------------|
| Voice recordings | "Processed by OpenAI Whisper API, not stored after transcription" |
| Generated reports | "Generated in your browser, not stored on our servers" |
| Templates | "Stored in your account, encrypted at rest" |
| Account data | "Stored securely in Supabase with encryption" |

**In-App Messaging:**
- Tooltip on voice button: "Audio sent to OpenAI for transcription, then deleted"
- Post-generation: "This report exists only in your browser until you save/export it"
- Settings page: Full data handling explanation

**Confidence:** HIGH

---

### 8. Breach Notification Readiness

**Requirement:** Process to notify users and authorities of data breaches within required timeframes.

**Implementation:**

| Jurisdiction | Timeframe | Authority |
|--------------|-----------|-----------|
| GDPR (EU) | 72 hours | Supervisory authority |
| HIPAA (US) | 60 days | HHS (if applicable) |
| State laws | Varies (24h-60d) | State AG |

**Features Needed:**
- Email notification capability to all users
- Incident response procedure documented
- Contact information for authorities maintained
- Template notification messages prepared

**Confidence:** HIGH

---

## Differentiating Features (Trust Building)

These features exceed minimum compliance requirements but build user trust and competitive advantage.

### 9. Explicit Data Deletion Confirmation

**What:** When users delete their account or data, provide clear confirmation of what was deleted.

**Implementation:**
- "Delete My Account" flow with explicit confirmation
- Post-deletion email: "Your account and all associated data have been permanently deleted"
- No "soft delete" - actual data removal
- Audit log for compliance (anonymized)

**Why It Differentiates:** Many apps soft-delete or retain data. Explicit deletion builds trust.

**Confidence:** MEDIUM - best practice, not legally required in most cases

---

### 10. Granular Consent Controls

**What:** Allow users to separately consent to different data processing activities.

**Implementation:**
```
Settings > Privacy Preferences:
[ ] Allow anonymous usage analytics (helps improve the product)
[ ] Allow crash reporting (helps fix bugs)
[ ] Allow AI model improvement feedback (optional)
```

**Why It Differentiates:** Goes beyond "all or nothing" consent, demonstrates respect for user autonomy.

**Confidence:** MEDIUM - GDPR best practice but not strictly required for all processing

---

### 11. Tiered AI Transparency

**What:** Different levels of AI disclosure based on user preference and context.

**Implementation:**

| Level | Description | Target User |
|-------|-------------|-------------|
| Minimal | Badge indicating AI assistance | Experienced users who want clean UI |
| Standard | Brief explanation with each AI output | Default |
| Detailed | Full explanation of what AI did and why | Users wanting maximum transparency |

**Settings:** User can choose preferred transparency level.

**Why It Differentiates:** Respects that some users want more/less information about AI involvement.

**Confidence:** MEDIUM - emerging best practice per [FDA transparency principles](https://www.fda.gov/medical-devices/software-medical-device-samd/transparency-machine-learning-enabled-medical-devices-guiding-principles)

---

### 12. Session-Based Processing Indicator

**What:** Visual indicator that data is being processed ephemerally, not stored.

**Implementation:**
- "Session Only" badge on transcription/generation interfaces
- Tooltip: "Your data is processed for this session only and not stored on our servers"
- Different from "Saved" indicator for templates/settings

**Why It Differentiates:** Proactively communicates privacy-by-design, builds trust.

**Confidence:** MEDIUM

---

### 13. Export Your Data

**What:** Allow users to download all their stored data (GDPR data portability right).

**Implementation:**
- Settings > Privacy > Download My Data
- Export includes: profile, templates, macros, preferences
- Format: JSON + human-readable summary
- Available within 30 days of request (GDPR requirement)

**Why It Differentiates:** Demonstrates transparency, required for GDPR compliance.

**Confidence:** HIGH for GDPR compliance, MEDIUM for US requirements

---

### 14. AI Confidence Indicators (Future)

**What:** Show confidence levels for AI-generated content where appropriate.

**Implementation:**
- For template suggestions: "High match", "Partial match" indicators
- For transcription: Flag uncertain portions for review
- For report generation: Highlight sections requiring human review

**Why It Differentiates:** Helps radiologists prioritize review effort, demonstrates responsible AI.

**Confidence:** LOW - emerging best practice, not required, technical complexity

---

## Anti-Features (Deliberately Avoid)

Features to explicitly NOT build to maintain favorable regulatory status and reduce legal risk.

### A1. NO Patient Data Storage

**What NOT to Build:** Any persistent storage of patient-specific information (names, MRNs, dates of birth, etc.)

**Why:**
- Triggers HIPAA Business Associate requirements
- Requires signed BAAs with all healthcare clients
- Requires HIPAA compliance program (expensive, complex)
- Increases breach liability significantly

**Instead:** Ephemeral processing only. Reports generated in browser, not stored server-side.

**Confidence:** HIGH - this is the single most important architectural decision for compliance simplicity

---

### A2. NO Autonomous Diagnosis

**What NOT to Build:** Any feature that makes diagnostic determinations without radiologist review.

**Why:**
- Would classify tool as SaMD requiring FDA 510(k) or De Novo
- Would require EU MDR certification as medical device
- Would require TGA ARTG listing in Australia
- Dramatically increases liability

**Instead:** Always position as "decision support" - radiologist reviews and approves all output.

**Confidence:** HIGH - verified against [FDA CDS exclusion criteria](https://www.fda.gov/medical-devices/software-medical-device-samd/clinical-decision-support-software-frequently-asked-questions-faqs)

---

### A3. NO Direct Patient Communication

**What NOT to Build:** Features that send AI-generated content directly to patients without clinician review.

**Why:**
- California AB 3030 specifically regulates AI patient communications
- Removes the clinician intermediary that provides legal protection
- Increases liability for AI errors

**Instead:** All output goes to radiologist for review before any patient communication.

**Confidence:** HIGH

---

### A4. NO Medical Image Processing

**What NOT to Build:** Features that directly analyze/process DICOM images or other medical imaging data.

**Why:**
- Would remove CDS exclusion (FDA requires CDS not "acquire, process, or analyze medical images")
- Would require full SaMD regulatory pathway
- Would require clinical validation studies

**Instead:** Radiologist interprets images and provides findings as text input to AI.

**Confidence:** HIGH - this is explicit in FDA CDS criteria

---

### A5. NO Training on User Data

**What NOT to Build:** Using user-generated content to train or improve AI models without explicit consent.

**Why:**
- FTC has ordered companies to delete AI models trained on improperly obtained data
- GDPR requires explicit consent for new purposes
- Erodes trust if discovered

**Instead:** Use OpenAI API with zero-retention endpoint; no model training on user data.

**Confidence:** HIGH - verified against [FTC enforcement actions](https://www.dreamleap.com/can-i-use-open-ai-chatgpt-for-healthcare-financial-or-regulated-industries)

---

### A6. NO Biometric Storage

**What NOT to Build:** Storing voice prints or other biometric identifiers.

**Why:**
- Illinois BIPA requires explicit consent and creates private right of action
- Texas, Washington have similar biometric laws
- High liability for breaches

**Instead:** Voice processed for transcription only, no voice profile created/stored.

**Confidence:** HIGH

---

## Implementation Priority for v1.4 Milestone

### Phase 1: Launch Blockers (Must Complete)

| Priority | Feature | Complexity | Why Critical |
|----------|---------|------------|--------------|
| P0 | Terms of Service | Medium | Legal requirement |
| P0 | Privacy Policy | Medium | Legal requirement |
| P0 | First-use consent flow | Medium | Gates access to app |
| P0 | "Not medical advice" disclaimers | Low | Liability protection |
| P0 | AI use disclosure | Low | State law compliance |

### Phase 2: Pre-Launch (Should Complete)

| Priority | Feature | Complexity | Why Important |
|----------|---------|------------|---------------|
| P1 | Cookie consent banner | Medium | GDPR compliance for EU users |
| P1 | Data handling transparency | Low | Trust building |
| P1 | Breach notification process | Low | Regulatory requirement |

### Phase 3: Post-Launch Enhancement (Can Add Later)

| Priority | Feature | Complexity | Why Later OK |
|----------|---------|------------|--------------|
| P2 | Explicit deletion confirmation | Low | Trust, not legally required |
| P2 | Granular consent controls | Medium | Beyond minimum compliance |
| P2 | Export your data | Medium | GDPR right, 30-day window |
| P3 | Tiered AI transparency | Medium | Nice-to-have UX |
| P3 | AI confidence indicators | High | Future enhancement |

---

## International Market Considerations

### United States
- **Federal:** No FDA clearance needed if CDS criteria maintained
- **State:** California (AB 3030), Texas (SB 1188, TRAIGA), others emerging
- **Action:** Include AI disclosure, maintain clinician-in-the-loop

### European Union
- **MDR:** Likely exempt if truly decision support (not processing images/signals)
- **GDPR:** Explicit consent for health data, data portability, breach notification
- **AI Act:** Additional requirements by 2027 for high-risk AI (medical is in scope)
- **Action:** Cookie consent, privacy policy, consent mechanism

### Australia
- **TGA:** CDSS exemption available if: (a) supports HCP recommendations, (b) doesn't process images/signals, (c) doesn't replace clinical judgment
- **Action:** File notice of supply within 30 days of Australian launch
- **Source:** [TGA CDSS guidance](https://www.tga.gov.au/resources/guidance/understanding-clinical-decision-support-software)

### United Kingdom
- **MHRA:** Similar to TGA, follows IMDRF guidance
- **UK GDPR:** Similar to EU GDPR post-Brexit
- **Action:** Same as EU approach

### Canada
- **Health Canada:** CDS exemptions similar to FDA
- **PIPEDA:** Privacy requirements for commercial activities
- **Action:** Privacy policy covering Canadian users

---

## Open Questions for Legal Review

1. **BAA with OpenAI:** Do we need a BAA with OpenAI even if we're not storing PHI? (Likely no if data is truly ephemeral, but legal should confirm)

2. **Terms acceptance for existing users:** If we launch consent flow, do existing users need to re-accept before using the app?

3. **EU MDR classification:** Should we get formal legal opinion confirming exemption from MDR as medical device?

4. **California AB 3030 scope:** Does this apply to B2B SaaS sold to healthcare providers, or only direct patient communications?

5. **Breach notification scope:** What constitutes a "breach" for our ephemeral data model where we don't store reports?

---

## Sources

### Primary (HIGH Confidence)
- [FDA CDS Software FAQs](https://www.fda.gov/medical-devices/software-medical-device-samd/clinical-decision-support-software-frequently-asked-questions-faqs)
- [FDA Transparency for ML Medical Devices](https://www.fda.gov/medical-devices/software-medical-device-samd/transparency-machine-learning-enabled-medical-devices-guiding-principles)
- [TGA CDSS Guidance](https://www.tga.gov.au/resources/guidance/understanding-clinical-decision-support-software)
- [TGA AI Medical Device Software](https://www.tga.gov.au/products/medical-devices/software-and-artificial-intelligence/manufacturing/artificial-intelligence-ai-and-medical-device-software)
- [HIPAA Journal - AI and HIPAA](https://www.hipaajournal.com/hipaa-healthcare-data-and-artificial-intelligence/)

### Secondary (MEDIUM Confidence)
- [California AB 3030 Analysis](https://www.afslaw.com/perspectives/alerts/california-requires-disclaimers-health-care-providers-ai-generated-patient)
- [State AI Healthcare Regulations](https://www.fenwick.com/insights/publications/the-new-regulatory-reality-for-ai-in-healthcare-how-certain-states-are-reshaping-compliance)
- [GDPR Healthcare Guide](https://www.dpo-consulting.com/blog/gdpr-healthcare)
- [SaaS Privacy Compliance 2025](https://secureprivacy.ai/blog/saas-privacy-compliance-requirements-2025-guide)
- [Healthcare Consent Best Practices](https://formsort.com/article/user-consent-in-saas-healthcare-and-fintech/)
- [EU MDR AI Software Guide](https://decomplix.com/ai-medical-device-software-eu-mdr-ivdr/)
- [GDPR Cookie Requirements 2025](https://secureprivacy.ai/blog/gdpr-cookie-consent-requirements-2025)

### Tertiary (LOW Confidence - Needs Validation)
- [AI Radiology Product IUS Study](https://insightsimaging.springeropen.com/articles/10.1186/s13244-024-01616-9) - Academic analysis, useful for competitive context
- [Healthcare AI Transparency PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9189302/) - Academic perspective on transparency requirements

---

## Metadata

**Confidence Breakdown:**
- Table stakes features: HIGH - verified against official regulatory sources
- Differentiating features: MEDIUM - based on best practices and emerging standards
- Anti-features: HIGH - verified against regulatory exclusion criteria
- International markets: MEDIUM - high-level guidance, recommend local legal review

**Research Date:** 2026-01-20
**Valid Until:** 2026-04-20 (3 months - regulatory landscape evolving)
**Recommended Review:** Before each international market launch
