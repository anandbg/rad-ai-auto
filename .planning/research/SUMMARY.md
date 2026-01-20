# Legal Compliance Research Summary

**Research Date:** 2026-01-20
**Project:** AI Radiologist - v1.4 Legal Compliance Milestone
**Domain:** AI Medical Decision-Support Legal Compliance
**Overall Confidence:** MEDIUM-HIGH

---

## Executive Summary

AI Radiologist occupies a favorable regulatory position as a **Non-Device Clinical Decision Support** tool under FDA's 21st Century Cures Act, primarily because it:
1. Does NOT process medical images directly (radiologist inputs findings as text)
2. Supports rather than replaces clinical judgment
3. Produces outputs that clinicians independently review and approve
4. Is not time-critical (report generation, not acute triage)

The ephemeral data architecture (no PHI storage) significantly reduces compliance burden since HIPAA's strictest requirements apply to entities that "create, receive, maintain, or transmit" PHI. The existing architecture is already well-positioned with pass-through processing.

**Critical findings:**
- **Stack:** Termly Pro ($15/mo) + Supabase supa_audit + self-implemented deletion API is sufficient. Total compliance tooling: <$200/year. Enterprise solutions like OneTrust ($50k+) or Drata ($10k+) are premature overkill.
- **Features:** Table stakes are achievable: Terms of Service, Privacy Policy, consent flow, AI disclaimers, "not medical advice" banners. All low-to-medium complexity.
- **Architecture:** Current Supabase + OpenAI API architecture is compliant. Key action: Sign OpenAI BAA (email baa@openai.com) and verify zero-retention is enabled.
- **Pitfalls:** The #1 risk is misclassifying regulatory status. Document CDS criteria compliance NOW. The Pieces Technologies settlement (Texas, 2024) shows state AGs will enforce existing consumer protection laws against AI companies.

---

## Key Findings by Dimension

### Stack Research

| Tool Category | Recommendation | Cost | Why |
|--------------|----------------|------|-----|
| Consent Management | Termly Pro | $15/mo | Includes consent banner + policy generators + AI disclosure templates |
| Audit Logging | Supabase supa_audit | Free | Already using Supabase; trigger-based, no external service needed |
| Data Deletion | Self-implemented API | Dev time | Simple for ephemeral data model |
| Legal Docs | Termly generators | Included | Privacy Policy, Terms of Service, Disclaimers |

**What NOT to use:** OneTrust ($50k+/yr), Drata/Vanta ($10k+/yr), HITRUST certification ($100k+) - all enterprise overkill for current stage.

### Features Research

**Table Stakes (Must Have for Launch):**
| Feature | Complexity | Why Critical |
|---------|------------|--------------|
| Terms of Service | Medium | Legal requirement, clickwrap agreement |
| Privacy Policy | Medium | GDPR/CCPA, multi-jurisdictional |
| First-use consent flow | Medium | Gates app access, documents acceptance |
| "Not medical advice" disclaimers | Low | Liability protection |
| AI use disclosure | Low | State law compliance (CA, TX, UT, CO) |

**Anti-Features (Deliberately Avoid):**
- NO patient data storage (avoids HIPAA BA requirements)
- NO autonomous diagnosis (avoids FDA 510(k))
- NO direct patient communication (maintains clinician intermediary)
- NO medical image processing (maintains CDS exemption)

### Architecture Research

**Current state is well-positioned:**
- Pass-through processing confirmed in `/api/generate` and `/api/transcribe`
- Client-side PDF/Word export (no report content to server)
- Session tables store metadata only, no PHI fields
- IndexedDB drafts need hardening (auto-expiration, clear-all feature)

**Key architectural requirements:**
1. Sign OpenAI BAA and enable zero-retention
2. Verify Vercel doesn't log request bodies
3. Add IndexedDB auto-expiration (24hr)
4. Implement "Clear All Drafts" in settings

### Pitfalls Research

**Critical risks to mitigate:**

| Pitfall | Risk Level | Prevention |
|---------|-----------|------------|
| Misclassifying CDS status | CRITICAL | Document all 4 FDA criteria with legal counsel |
| Unsubstantiated accuracy claims | HIGH | Audit marketing materials, document methodology |
| Missing BAAs | HIGH | Audit all vendors (OpenAI, Supabase, Vercel) |
| Practicing medicine without license | HIGH | Position AI as "assistant" not "advisor" |

**Real-world precedents:**
- Pieces Technologies (TX, Sept 2024): First state AG settlement over AI accuracy claims
- Exer Labs (FDA, Oct 2024): Warning letter for misclassification
- EU MDR Survey: 73% of startups initially misclassified devices (€1.4M average remediation)

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| FDA CDS classification | HIGH | Official FDA guidance documents |
| HIPAA BAA requirements | HIGH | Documented OCR enforcement history |
| State AI disclosure laws | MEDIUM | Laws published but evolving rapidly |
| OpenAI BAA/ZDR | HIGH | Official documentation |
| EU MDR/AI Act | MEDIUM | Regulations published, implementation ongoing |
| Tooling recommendations | MEDIUM-HIGH | Verified pricing, may vary |

---

## Implications for Roadmap

Based on research, suggested phase structure for v1.4:

### Phase 1: Regulatory Foundation (P0)
**Rationale:** Must establish legal foundation before any user-facing compliance features.

**Covers:**
- Document FDA CDS classification rationale (from PITFALLS.md)
- Audit and sign vendor BAAs (OpenAI, Supabase, Vercel) (from PITFALLS.md)
- Marketing claims audit and remediation (from PITFALLS.md)
- Implement Termly Pro consent + policy management (from STACK.md)

**Avoids:** Misclassification pitfall, BAA gaps, deceptive trade practices exposure

### Phase 2: Legal Documents & Consent (P0)
**Rationale:** Core legal documents are launch blockers.

**Covers:**
- Terms of Service with healthcare-specific provisions (from FEATURES.md)
- Privacy Policy (multi-jurisdictional) (from FEATURES.md)
- First-use consent flow (from FEATURES.md)
- Cookie/analytics consent banner (from FEATURES.md)

**Uses:** Termly policy generators (from STACK.md)

### Phase 3: In-App Compliance Features (P0-P1)
**Rationale:** User-facing disclaimers and transparency are required before launch.

**Covers:**
- "Not medical advice" disclaimer system (from FEATURES.md)
- AI use disclosure throughout app (from FEATURES.md)
- Data handling transparency messaging (from FEATURES.md)
- Decision-support disclaimers in report generation UI (from STACK.md)

**Implements:** Architecture patterns from ARCHITECTURE.md

### Phase 4: Data Architecture Hardening (P1)
**Rationale:** Ensure ephemeral data handling is provably compliant.

**Covers:**
- IndexedDB auto-expiration (24hr) (from ARCHITECTURE.md)
- "Clear All Drafts" feature (from ARCHITECTURE.md)
- Metadata-only audit logging (supa_audit) (from ARCHITECTURE.md, STACK.md)
- Account deletion API (right to erasure) (from STACK.md)

**Verifies:** No-PHI-storage architecture compliance

### Phase 5: Compliance Documentation (P1)
**Rationale:** Documentation for auditors, investors, enterprise clients.

**Covers:**
- PRIVACY_CONTROLS.md document (from ARCHITECTURE.md)
- Verification scripts (schema audit, code audit) (from ARCHITECTURE.md)
- Compliance posture documentation for stakeholders
- Breach notification process (from FEATURES.md)

### Phase 6: International Readiness (P2 - If EU Planned)
**Rationale:** EU has dual MDR + AI Act burden. Start early if targeting.

**Covers:**
- MDR classification assessment (from PITFALLS.md)
- AI Act high-risk mapping (from PITFALLS.md)
- GDPR DPIA preparation (from FEATURES.md)
- Notified body relationship (2+ year wait times)

---

## Phase Ordering Rationale

1. **Regulatory foundation first** - Can't launch without CDS classification and BAAs
2. **Legal documents second** - ToS/Privacy are literal launch blockers
3. **In-app features third** - Disclaimers require legal docs to be finalized
4. **Architecture hardening fourth** - Strengthens existing compliant architecture
5. **Documentation fifth** - Captures completed compliance work for stakeholders
6. **International sixth** - Only if EU is on near-term roadmap

---

## Research Flags for Phases

| Phase | Research Needed? | Reason |
|-------|-----------------|--------|
| 1 | YES - Legal counsel | CDS classification needs formal legal opinion |
| 2 | NO | Standard patterns, Termly handles |
| 3 | NO | Straightforward UI work |
| 4 | NO | Technical implementation |
| 5 | NO | Documentation of completed work |
| 6 | YES | EU MDR/AI Act requires specialist counsel |

---

## Open Questions for Legal Counsel

1. **CDS Criterion 4:** How does "independent review" apply when AI generates report text? Radiologist reviews the output, but can they verify the "reasoning"?

2. **OpenAI BAA for ephemeral processing:** Is BAA strictly required if PHI is never stored? Research says yes (PHI exists during processing), but legal should confirm.

3. **California AB 3030 scope:** Does this apply to B2B SaaS sold to healthcare providers, or only direct patient communications?

4. **Breach notification for ephemeral data:** What constitutes a "breach" when reports aren't stored?

5. **EU market entry timing:** Should we pursue MDR classification now (long timeline) or defer until US revenue is established?

---

## Recommended Next Steps

1. **Immediate:** Legal counsel engagement for CDS classification review
2. **Week 1:** Vendor BAA audit (OpenAI, Supabase, Vercel)
3. **Week 2:** Set up Termly Pro, begin ToS/Privacy Policy drafting
4. **Week 3-4:** Implement consent flows and disclaimer UI
5. **Week 4-6:** Architecture hardening (IndexedDB, audit logging)
6. **Week 6+:** Documentation and compliance verification

---

## Files Created

| File | Purpose |
|------|---------|
| `STACK.md` | Compliance tooling recommendations with pricing |
| `FEATURES.md` | Required compliance features prioritized |
| `ARCHITECTURE.md` | Privacy-preserving data architecture patterns |
| `PITFALLS.md` | Common mistakes and prevention strategies |
| `SUMMARY.md` | This synthesis document |

---

*Research valid until: 2026-04-20 (regulatory landscape evolving)*
*Recommended re-validation: Before each major launch milestone*
