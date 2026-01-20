# Legal Compliance Stack Research

**Research Date:** 2026-01-20
**Domain:** AI Medical Decision-Support Legal Compliance
**Confidence:** MEDIUM (verified with official sources where available)

## Executive Summary

For AI Radiologist's v1.4 commercial launch, legal compliance tooling falls into four categories: consent management, audit logging, privacy compliance, and legal document generation. The startup-appropriate approach is to use lightweight SaaS tools (Termly for consent, native Supabase auditing) rather than enterprise platforms like OneTrust or Drata. Key insight: since AI Radiologist does NOT store PHI (ephemeral data handling), the compliance burden is significantly reduced - focus on AI usage disclosure, consent, and decision-support disclaimers rather than full HIPAA infrastructure.

**Primary recommendation:** Use Termly Pro ($15/mo) for consent + policies, Supabase supa_audit for database auditing, and clear AI decision-support disclaimers. Total compliance tooling cost: under $200/year.

---

## Consent Management Tools

### Recommended: Termly Pro

| Attribute | Details |
|-----------|---------|
| **Cost** | $15/month (Pro+ plan) |
| **Why** | Best value for startups - combines consent banner + policy generator + cookie scanner |
| **Confidence** | HIGH - verified via [Termly official pricing](https://termly.io/) |

**Key features:**
- Consent Management Platform with auto-blocking
- Privacy Policy Generator with AI disclosure clauses
- Terms of Service Generator
- Google Consent Mode v2 compatible (important for analytics)
- Multi-language support (global launch)
- GDPR, CCPA/CPRA, ePrivacy compliant templates

**For AI-specific compliance:** Termly's policy generator includes AI disclosure templates - critical for state laws like Utah, California, and Colorado that require AI usage disclosure in healthcare-adjacent apps.

### Alternative: CookieYes

| Attribute | Details |
|-----------|---------|
| **Cost** | $10/month (Basic) to $55/month (Ultimate) |
| **Why** | Slightly cheaper basic tier, good support |
| **Confidence** | MEDIUM - verified via [CookieYes pricing](https://www.cookieyes.com/blog/best-consent-management-platforms/) |

**Tradeoff:** Fewer policy generators than Termly. Branding removal requires Ultimate tier ($55/mo). Choose if you only need consent banner without legal document generation.

### Alternative: Osano (Free Tier)

| Attribute | Details |
|-----------|---------|
| **Cost** | Free (up to 5,000 visitors/month) |
| **Why** | "No Fines" pledge - pays up to $500k of penalties |
| **Confidence** | MEDIUM - [Osano comparison](https://www.osano.com/comparison/consent-management-platform) |

**Tradeoff:** Free tier very limited. Paid tier ($199/mo) expensive for a startup. Consider only if budget is zero.

---

## Privacy Compliance Tools

### Audit Logging

**Recommended: Supabase supa_audit Extension**

| Attribute | Details |
|-----------|---------|
| **Cost** | Free (included in Supabase) |
| **Why** | Already using Supabase; trigger-based auditing requires no external service |
| **Confidence** | HIGH - verified via [Supabase supa_audit docs](https://supabase.com/docs/guides/database/extensions/pgaudit) |

**Implementation:**
```sql
-- Enable supa_audit extension
create extension if not exists supa_audit cascade;

-- Enable auditing on sensitive tables
select audit.enable_tracking('public.profiles'::regclass);
select audit.enable_tracking('public.templates'::regclass);
select audit.enable_tracking('public.reports'::regclass);
```

**What it provides:**
- Automatic INSERT/UPDATE/DELETE tracking
- User attribution (who made changes)
- JSONB diffs of what changed
- Query via `audit.record_version` table

**HIPAA Note:** While AI Radiologist doesn't store PHI, having audit trails for user data and template modifications demonstrates security hygiene - valuable for enterprise sales and any future SOC 2 considerations.

**Alternative: PGAudit Extension**

| Attribute | Details |
|-----------|---------|
| **Cost** | Free |
| **Why** | Session-level logging to Postgres log files |
| **Confidence** | HIGH - [PGAudit Supabase docs](https://supabase.com/docs/guides/database/extensions/pgaudit) |

**When to use:** If you need log-file based auditing for a SOC 2 audit later. More complex to configure; supa_audit is simpler for application-level auditing.

### Data Deletion (GDPR/CCPA Right to Erasure)

**Recommended: Self-Implemented Deletion API**

| Attribute | Details |
|-----------|---------|
| **Cost** | Development time only |
| **Why** | Simple for apps without complex data relationships |
| **Confidence** | HIGH - standard pattern |

**Implementation approach:**
```typescript
// app/api/user/delete-account/route.ts
// DELETE request triggers cascade deletion:
// 1. Delete user templates
// 2. Delete user macros
// 3. Delete user preferences
// 4. Delete user reports (already ephemeral)
// 5. Delete Supabase Auth user
// 6. Cancel Stripe subscription
```

**Key requirement:** Must respond to deletion requests within 30 days (GDPR) or 45 days (CCPA). Implement email confirmation workflow.

**2025 Enforcement context:** The European Data Protection Board launched coordinated enforcement on right to erasure in March 2025. Regulators are actively checking compliance. Source: [Greenberg Traurig enforcement update](https://www.gtlaw-dataprivacydish.com/2025/03/enforcement-update-regulatory-attention-focused-on-deletion-requests/).

---

## Legal Document Management

### Recommended: Termly Policy Generators

Since Termly Pro already recommended for consent, use their policy generators:

| Document | Generator Available | Notes |
|----------|---------------------|-------|
| Privacy Policy | Yes | AI disclosure clauses built-in |
| Terms of Service | Yes | |
| Cookie Policy | Yes | Auto-generated from cookie scan |
| EULA | Yes | For app-specific terms |
| Disclaimer | Yes | **Critical for decision-support** |

**AI Decision-Support Disclaimer requirements (2025-2026):**

Per state-level regulations (Utah, Colorado, California) and FDA guidance:

1. **Disclosure that AI is used** - Plain language statement
2. **AI does not replace physician judgment** - Decision-support disclaimer
3. **No diagnostic claims** - Reports are drafts requiring physician review
4. **Data processing transparency** - How AI processes inputs

**Example disclaimer text:**
```
This application uses artificial intelligence to assist in drafting
radiology reports. AI-generated content is a draft only and must be
reviewed, edited, and approved by a licensed physician before use.
This tool does not diagnose, treat, or replace medical judgment.
The radiologist remains solely responsible for all clinical decisions.
```

### Alternative: iubenda

| Attribute | Details |
|-----------|---------|
| **Cost** | $3.49/month (basic) to $99/month (enterprise) |
| **Why** | Auto-updates when laws change; 150k+ clients |
| **Confidence** | MEDIUM - [iubenda pricing](https://www.iubenda.com/en/pricing/) |

**When to use:** If you want automatic policy updates without manual maintenance. More expensive than Termly for similar features.

### Alternative: GetTerms

| Attribute | Details |
|-----------|---------|
| **Cost** | Free tier available |
| **Why** | Simple generator, GDPR/CCPA/PIPEDA ready |
| **Confidence** | MEDIUM - [GetTerms](https://getterms.io/) |

**When to use:** Budget-conscious alternative if Termly is too expensive.

---

## OpenAI Compliance Configuration

**Critical for HIPAA-adjacent apps using OpenAI:**

### BAA Status

| Product | BAA Available | Notes |
|---------|---------------|-------|
| OpenAI API | Yes | Email baa@openai.com |
| ChatGPT Enterprise | Yes | Sales-managed only |
| ChatGPT Plus/Pro/Team | NO | Never HIPAA compliant |
| Azure OpenAI | Yes | BAA included in Microsoft DPA |

**Confidence:** HIGH - verified via [OpenAI BAA documentation](https://help.openai.com/en/articles/8660679-how-can-i-get-a-business-associate-agreement-baa-with-openai)

**Recommended approach for AI Radiologist:**

Since AI Radiologist does NOT store PHI and uses ephemeral data handling:
1. **Do NOT send PHI to OpenAI** - Only transcription text and template context
2. **Enable zero data retention** - API config `{"store": false}`
3. **Consider Azure OpenAI** - If enterprise clients require BAA (BAA included by default)
4. **Document data flow** - Privacy policy should state AI providers do not receive patient identifiers

**Timeline note:** Getting a BAA from OpenAI can take 1+ month. Plan ahead if needed.

---

## Recommendations for AI Radiologist v1.4

### Must Have (Launch Blockers)

| Tool | Cost | Priority | Implementation |
|------|------|----------|----------------|
| **Termly Pro** | $15/mo | P0 | Consent banner + Privacy Policy + Terms |
| **AI Disclaimer** | $0 | P0 | Decision-support disclaimer in UI |
| **supa_audit** | $0 | P0 | Enable on profiles, templates tables |
| **Deletion API** | Dev time | P0 | Right to erasure endpoint |

**Total recurring cost:** $15/month ($180/year)

### Should Have (Pre-Enterprise Sales)

| Tool | Cost | Priority | Implementation |
|------|------|----------|----------------|
| **PGAudit logging** | $0 | P1 | For SOC 2 readiness later |
| **Cookie scanner** | Included | P1 | Termly auto-scan |
| **DSAR workflow** | Dev time | P1 | Data Subject Access Requests |

### Nice to Have (Scale Triggers)

| Tool | Cost | Priority | When |
|------|------|----------|------|
| **Drata/Vanta** | $10k+/yr | P2 | When SOC 2 required for enterprise deals |
| **Azure OpenAI** | Variable | P2 | When enterprise clients require BAA |
| **OneTrust** | $50k+/yr | P3 | Never - enterprise overkill |

---

## What NOT to Use

### Enterprise Overkill

| Tool | Why Not |
|------|---------|
| **OneTrust** | $50k+/year, designed for Fortune 500, massive overkill for startup |
| **Drata/Vanta** | $10k+/year before audit fees; premature until enterprise deals require SOC 2 |
| **TrustArc** | Enterprise pricing, complex implementation |
| **BigID** | Data discovery tool for massive enterprises |

**When these make sense:** If AI Radiologist lands an enterprise hospital contract requiring SOC 2 Type II certification, budget $30k-50k total (Vanta/Drata + audit fees) at that time. Do not invest preemptively.

### Overcomplicated Approaches

| Approach | Why Not |
|----------|---------|
| **Full HIPAA infrastructure** | AI Radiologist doesn't store PHI - ephemeral handling avoids this |
| **HITRUST certification** | $100k+ and 6+ months; only if targeting large health systems |
| **Custom audit logging service** | supa_audit handles this for free |
| **Third-party DSAR automation** | At startup scale, manual + API is sufficient |

### Outdated/Risky

| Tool | Why Not |
|------|---------|
| **ChatGPT for policies** | Termly explicitly warns against this - legal risk |
| **Generic policy templates** | Miss AI disclosure requirements mandated in 2025 |
| **Cookie consent without scanner** | Miss tracking technologies, compliance gaps |

---

## Regulatory Context (2025-2026)

### Federal

- **HIPAA Security Rule update (Jan 2025):** First major update in 20 years. AI systems processing PHI face stricter requirements - but AI Radiologist avoids PHI.
- **FDA AI guidance:** Clinical decision support tools where physicians independently review recommendations are excluded from medical device oversight under 21st Century Cures Act.

### State Laws (Critical for US Launch)

| State | Effective | Requirement |
|-------|-----------|-------------|
| **Colorado AI Act** | June 30, 2026 | Disclosure, impact assessments, 3-year record keeping |
| **Utah AI** | May 2025 | AI disclosure in regulated sectors, $2,500/violation |
| **California** | 2025 | Training data disclosure, watermarking, health communication disclaimers |
| **Pennsylvania** | Proposed Nov 2025 | Disclaimers for AI in clinical communications |

**Source:** [Manatt Health AI Policy Tracker](https://www.manatt.com/insights/newsletters/health-highlights/manatt-health-health-ai-policy-tracker)

### International (Global Launch)

| Region | Framework | Key Requirement |
|--------|-----------|-----------------|
| **EU** | GDPR + AI Act | High-risk AI classification for medical, strict transparency |
| **UK** | UK GDPR | Similar to EU, separate enforcement |
| **Canada** | PIPEDA | Privacy impact assessments |
| **Australia** | Privacy Act | APP requirements |

---

## Sources

### Primary (HIGH Confidence)
- [Supabase supa_audit documentation](https://github.com/supabase/supa_audit)
- [Supabase PGAudit documentation](https://supabase.com/docs/guides/database/extensions/pgaudit)
- [OpenAI BAA documentation](https://help.openai.com/en/articles/8660679-how-can-i-get-a-business-associate-agreement-baa-with-openai)
- [Termly official site](https://termly.io/)

### Secondary (MEDIUM Confidence)
- [HIPAA audit log requirements - Keragon](https://www.keragon.com/hipaa/hipaa-explained/hipaa-audit-log-requirements)
- [Drata vs Vanta comparison - ComplyJet](https://www.complyjet.com/blog/vanta-vs-drata-2025)
- [CookieYes CMP comparison](https://www.cookieyes.com/blog/best-consent-management-platforms/)
- [GDPR right to erasure enforcement - Greenberg Traurig](https://www.gtlaw-dataprivacydish.com/2025/03/enforcement-update-regulatory-attention-focused-on-deletion-requests/)

### Tertiary (LOW Confidence - Needs Validation)
- State AI law specifics (verify with legal counsel before launch)
- OpenAI BAA timeline estimates (anecdotal from community forums)

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Consent Management Tools | HIGH | Official pricing pages verified |
| Supabase Auditing | HIGH | Official documentation |
| OpenAI BAA | HIGH | Official help center |
| State AI Laws | MEDIUM | Policy trackers, but laws evolving |
| Cost Estimates | MEDIUM | Pricing may vary, verify at purchase |
| FDA Disclaimer Requirements | MEDIUM | Guidance documents, not regulations |

---

*Research conducted: 2026-01-20*
*Valid until: 2026-04-20 (re-verify state laws before launch)*
