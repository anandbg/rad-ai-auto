# Privacy-Preserving Architecture Research

**Researched:** 2026-01-20
**Domain:** AI Medical Decision-Support / HIPAA Compliance
**Confidence:** HIGH for architectural patterns, MEDIUM for OpenAI-specific policies

## Executive Summary

AI medical decision-support apps like AI Radiologist can achieve privacy-preserving, compliance-ready architecture through three core principles: (1) strict data classification separating ephemeral PHI from persisted non-PHI data, (2) pass-through processing where PHI flows through the system without storage, and (3) audit logging that tracks access patterns rather than content. The current architecture using Supabase with RLS provides a solid foundation, but requires specific modifications to ensure transcriptions and generated reports remain truly ephemeral.

**Primary recommendation:** Implement a "zero-storage PHI" architecture where audio, transcriptions, and generated reports exist only in memory and client-side state, never persisted to any database or server storage, while maintaining comprehensive audit trails of system usage.

## Data Classification

### Persisted Data (Safe - No PHI)

| Data Type | Location | Contains PHI? | Retention |
|-----------|----------|---------------|-----------|
| User profiles | `profiles` table | NO (name, specialty, institution - not linked to patients) | Account lifetime |
| Report templates | `templates_global`, `templates_personal` | NO (generic templates, no patient data) | User-managed |
| Brand templates | `brand_templates` | NO (styling/branding only) | User-managed |
| Transcription macros | `transcription_macros` | NO (text shortcuts, generic phrases) | User-managed |
| Subscriptions | `subscriptions` | NO (billing info only) | Account lifetime |
| User preferences | `user_preferences` | NO (app settings) | Account lifetime |

### Session Metadata (Audit Trail - Minimized)

| Data Type | Location | Contains PHI? | What to Store |
|-----------|----------|---------------|---------------|
| Report sessions | `report_sessions` | NO | Template used, timestamp, model, duration, credits - NOT report content |
| Transcribe sessions | `transcribe_sessions` | NO | Session ID, duration, status, credits - NOT transcript text |
| Credits ledger | `credits_ledger` | NO | Transaction records, NOT what was generated |

### Ephemeral Data (PHI Risk - Never Persist)

| Data Type | Current Location | PHI Risk | Required Handling |
|-----------|------------------|----------|-------------------|
| Audio recordings | Supabase Storage (temp) | HIGH | 5-min TTL, encrypted, immediate deletion |
| Transcription text | API response only | HIGH | Return to client only, no server storage |
| Generated reports | API response (streaming) | HIGH | Stream to client only, no server storage |
| Clinical findings input | Request body | HIGH | Process in memory, no logging |
| Draft reports | IndexedDB (client) | HIGH | Client-only, user-controlled, clearable |

## Architectural Patterns

### Pattern 1: Pass-Through Processing (Current - Needs Verification)

**What:** PHI data flows through the server API to OpenAI and back to the client without any server-side persistence.

```
[Client Browser] ---> [Vercel Edge/Node] ---> [OpenAI API] ---> [Vercel Edge/Node] ---> [Client Browser]
     |                      |                      |                     |                    |
 User Input            No Storage             Processing            No Storage           Display/
 (findings)           (memory only)           (ZDR eligible)        (memory only)         Export
```

**Current Implementation Analysis:**

1. **Generate Route** (`/api/generate/route.ts`):
   - Edge runtime (memory-only processing)
   - Receives: templateId, findings, templateName, modality, bodyPart
   - Sends to OpenAI: System prompt + user findings
   - Returns: Streaming text response
   - **Status:** Compliant - no server-side storage

2. **Transcribe Route** (`/api/transcribe/route.ts`):
   - Node.js runtime (required for FormData)
   - Receives: Audio file via FormData
   - Sends to OpenAI: Audio file for Whisper transcription
   - Returns: JSON with transcript text
   - **Status:** Compliant - no server-side storage

**Verification Points:**
- [ ] Confirm Vercel Edge/Node functions don't log request bodies
- [ ] Confirm no intermediate storage in request handling
- [ ] Verify streaming responses don't buffer to disk

### Pattern 2: Client-Side Only Export

**What:** PDF and Word document generation happens entirely in the browser using jsPDF and docx libraries. No report content ever sent back to server.

```
[Generated Report State] ---> [jsPDF/docx (browser)] ---> [file-saver] ---> [Local Download]
                                      |
                              All processing in
                              browser memory
```

**Current Implementation:**
- `report-workspace.tsx`: Uses jsPDF for PDF, docx library for Word
- `generate/page.tsx`: Same pattern with browser print dialog
- **Status:** Compliant - truly client-side export

### Pattern 3: Ephemeral Client Storage (IndexedDB)

**What:** Drafts stored in browser IndexedDB for offline recovery, cleared automatically or by user.

**Current Implementation** (`lib/storage/indexeddb.ts`):
```typescript
interface Draft {
  id: string;
  type: 'template' | 'report' | 'transcription';
  userId: string;
  data: Record<string, unknown>;  // May contain PHI!
  savedAt: string;
  isOffline: boolean;
}
```

**Risk:** Draft `data` field can contain transcription text or generated report content (PHI).

**Mitigation Required:**
1. Implement automatic draft expiration (e.g., 24 hours)
2. Add clear warning about local storage containing draft data
3. Implement "Clear All Drafts" button in settings
4. Consider client-side encryption of draft content

### Pattern 4: Metadata-Only Audit Logging

**What:** Log access events without logging content. Track WHO did WHAT WHEN, not the actual data.

**Current Schema (Good Foundation):**

```sql
-- report_sessions - tracks THAT a report was generated, not WHAT
CREATE TABLE report_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  scan_type TEXT NOT NULL,           -- e.g., "CT Chest" (not PHI)
  template_ref JSONB NOT NULL,       -- template ID/name (not PHI)
  options JSONB,                     -- generation options (not PHI)
  model TEXT NOT NULL,               -- "gpt-4o" (not PHI)
  duration_ms INTEGER NOT NULL,      -- performance metric
  credits_consumed INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
  -- NOTE: No field for report_content, findings_input, etc.
);

-- transcribe_sessions - tracks THAT transcription happened, not WHAT was said
CREATE TABLE transcribe_sessions (
  id UUID PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  object_key TEXT NOT NULL,          -- storage reference (auto-deleted)
  status transcribe_status NOT NULL,
  storage_bytes INTEGER NOT NULL,    -- file size (not PHI)
  storage_expires_at TIMESTAMPTZ,    -- TTL enforcement
  duration_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
  -- NOTE: No field for transcript_text, audio_url, etc.
);
```

**Pattern Verification:**
- [x] No PHI fields in session tables
- [x] Template references are IDs/names, not content
- [x] Timestamps for access patterns
- [ ] Need to add IP address logging for security (optional)
- [ ] Need to add user agent for device tracking (optional)

## OpenAI API Considerations

### Data Retention Policies

| Policy | Default | With ZDR | With BAA |
|--------|---------|----------|----------|
| Input/Output Retention | 30 days | 0 days | 0 days |
| Training Use | Never for API | Never | Never |
| Abuse Monitoring | Yes | Excluded | Excluded |

### Zero Data Retention (ZDR)

**What it means:** OpenAI processes the request, returns the response, and deletes all data immediately. No logs, no storage, no training.

**How to enable:**
1. Contact OpenAI at baa@openai.com
2. Request ZDR for your organization
3. Once approved, ZDR applies to eligible endpoints automatically

**Eligible Endpoints (confirmed):**
- `/v1/chat/completions` (used for report generation)
- `/v1/audio/transcriptions` (used for Whisper transcription)

**Non-eligible Features:**
- Web Search (NOT HIPAA eligible even with BAA)
- Assistants API with file storage
- Fine-tuning with training data

### Business Associate Agreement (BAA)

**Requirements:**
- Must have ZDR enabled (automatic with BAA)
- Must use only ZDR-eligible endpoints
- Must not use web search or file storage features
- Enterprise plan NOT required for API BAA

**Process:**
1. Email baa@openai.com with company details and use case
2. 1-2 business day response time
3. Sign BAA electronically
4. Implement ZDR-eligible endpoints only

### Current Implementation Compliance

```typescript
// /api/generate/route.ts - COMPLIANT
const result = streamText({
  model: openai('gpt-4o'),
  system: systemPrompt,
  prompt: userPrompt,
  temperature: 0.2,
  maxOutputTokens: 2000,
});
// Uses /v1/chat/completions - ZDR eligible

// /api/transcribe/route.ts - COMPLIANT
const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
  body: openaiFormData,
});
// Uses /v1/audio/transcriptions - ZDR eligible
```

## Audit Logging Approach

### What to Log (Access Events)

```typescript
interface AuditEvent {
  // Identity
  userId: string;
  sessionId: string;
  ipAddress?: string;      // Optional, for security
  userAgent?: string;      // Optional, for device tracking

  // Event
  eventType: 'generate' | 'transcribe' | 'export' | 'login' | 'template_access';
  eventTimestamp: string;

  // Context (no PHI)
  templateId?: string;     // Which template, not its content
  modality?: string;       // CT, MRI, etc.
  bodyPart?: string;       // Chest, Brain, etc.
  duration?: number;       // How long operation took
  success: boolean;
  errorCode?: string;      // Error type, not error message with PHI

  // Usage
  creditsConsumed?: number;
  audioBytes?: number;     // Size, not content
  reportTokens?: number;   // Token count, not content
}
```

### What NOT to Log (PHI Content)

| Never Log | Why |
|-----------|-----|
| `findings` text | Direct patient data |
| `transcription` text | Dictated patient information |
| `generatedReport` text | Contains all of the above |
| Request bodies with PHI | Could be recovered from logs |
| Error messages with PHI | Stack traces might include data |
| Audio file contents | Direct patient data |

### Implementation Pattern

```typescript
// CORRECT: Log metadata only
async function logReportGeneration(userId: string, templateId: string, durationMs: number) {
  await supabase.from('report_sessions').insert({
    user_id: userId,
    template_ref: { templateId },  // ID only, not content
    duration_ms: durationMs,
    model: 'gpt-4o',
    credits_consumed: 1,
  });
}

// INCORRECT: Never do this
async function badLogging(userId: string, findings: string, report: string) {
  await supabase.from('audit_log').insert({
    user_id: userId,
    input_data: findings,    // PHI!
    output_data: report,     // PHI!
  });
}
```

### Supabase Auth Audit Logs

Supabase provides built-in authentication audit logging via `auth.audit_log_entries`:

**Tracked Events:**
- Login attempts (success/failure)
- Logout events
- Password changes
- MFA events
- Session refreshes

**Access:** Dashboard > Authentication > Logs, or SQL query

## Data Flow Diagrams

### Report Generation Flow

```
+------------------+     +-------------------+     +------------------+
|   User Browser   |     |  Vercel Edge API  |     |   OpenAI API     |
+------------------+     +-------------------+     +------------------+
        |                        |                        |
        | 1. POST /api/generate  |                        |
        |   { findings, ...}     |                        |
        |----------------------->|                        |
        |                        |                        |
        |                        | 2. Forward to OpenAI   |
        |                        |   (with ZDR/BAA)       |
        |                        |----------------------->|
        |                        |                        |
        |                        |                        | 3. Process
        |                        |                        |    (in memory)
        |                        |                        |    Delete input
        |                        |                        |
        |                        | 4. Streaming response  |
        |                        |<-----------------------|
        |                        |                        |
        | 5. Stream to browser   |                        |
        |   (not stored)         |                        |
        |<-----------------------|                        |
        |                        |                        |
        | 6. Display report      | 7. Log metadata only   |
        |    (client state)      |   { userId, duration } |
        |                        |----------------------->| DB
        |                        |                        |
        | 8. Export PDF/Word     |                        |
        |    (client-side)       |                        |
        |                        |                        |
```

### Transcription Flow

```
+------------------+     +-------------------+     +------------------+
|   User Browser   |     | Vercel Node API   |     |   OpenAI API     |
+------------------+     +-------------------+     +------------------+
        |                        |                        |
        | 1. POST /api/transcribe|                        |
        |   FormData(audio)      |                        |
        |----------------------->|                        |
        |                        |                        |
        |                        | 2. Forward audio       |
        |                        |   (with ZDR/BAA)       |
        |                        |----------------------->|
        |                        |                        |
        |                        |                        | 3. Whisper
        |                        |                        |    transcription
        |                        |                        |    Delete audio
        |                        |                        |
        |                        | 4. Return transcript   |
        |                        |<-----------------------|
        |                        |                        |
        | 5. Return transcript   |                        |
        |   (not stored)         |                        |
        |<-----------------------|                        |
        |                        |                        |
        | 6. Display transcript  | 7. Log metadata only   |
        |    (client state)      |   { userId, duration } |
        |                        |----------------------->| DB
```

### Storage Boundaries

```
+------------------------------------------------------------------+
|                        EPHEMERAL (PHI)                           |
+------------------------------------------------------------------+
|                                                                  |
|  +-------------------+    +-------------------+                  |
|  | Browser Memory    |    | Vercel Memory     |                  |
|  | - Input state     |    | - Request body    |                  |
|  | - Report state    |    | - Response stream |                  |
|  | - Audio blob      |    | - (no disk write) |                  |
|  +-------------------+    +-------------------+                  |
|                                                                  |
|  +-------------------+    +-------------------+                  |
|  | IndexedDB Drafts  |    | OpenAI (ZDR)      |                  |
|  | - 24hr expiry     |    | - 0 retention     |                  |
|  | - User clearable  |    | - In-memory only  |                  |
|  | - Client only     |    | - No training     |                  |
|  +-------------------+    +-------------------+                  |
|                                                                  |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                        PERSISTED (No PHI)                        |
+------------------------------------------------------------------+
|                                                                  |
|  +-------------------+    +-------------------+                  |
|  | Supabase DB       |    | Supabase Auth     |                  |
|  | - User profiles   |    | - Auth state      |                  |
|  | - Templates       |    | - Session tokens  |                  |
|  | - Session metadata|    | - Audit log       |                  |
|  | - Credits ledger  |    |                   |                  |
|  +-------------------+    +-------------------+                  |
|                                                                  |
+------------------------------------------------------------------+
```

## Integration with Existing Supabase RLS

### Current RLS is Well-Structured

The existing RLS policies correctly enforce user-scoped access:

```sql
-- Users can only access their own data
CREATE POLICY "Users can view own report sessions"
  ON report_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view aggregate data for support
CREATE POLICY "Admins can view all report sessions"
  ON report_sessions FOR SELECT
  USING (is_admin());
```

### Recommended Additions

```sql
-- 1. Add service role bypass documentation
COMMENT ON TABLE report_sessions IS
  'AI generation session metadata. PHI (report content, findings) is NEVER stored here.
   Only metadata: user, template, duration, credits.';

-- 2. Consider adding audit log table for admin actions
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,  -- 'view_users', 'update_template', etc.
  target_type TEXT,      -- 'user', 'template', etc.
  target_id UUID,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin audit is viewable only by admins
CREATE POLICY "Admins can view admin audit log"
  ON admin_audit_log FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert admin audit log"
  ON admin_audit_log FOR INSERT
  WITH CHECK (true);  -- Service role inserts
```

## Verification Strategy

### How to Prove No-PHI-Storage

#### 1. Schema Audit
```sql
-- Run this query to verify no PHI columns exist
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN (
    'findings', 'transcript', 'report_content', 'dictation',
    'patient_data', 'clinical_notes', 'audio_content'
  );
-- Expected result: 0 rows
```

#### 2. Code Audit Checklist
- [ ] Search for `INSERT INTO` or `.insert()` calls with PHI fields
- [ ] Search for `localStorage.setItem` with PHI content
- [ ] Search for `console.log` with request/response bodies
- [ ] Search for error handling that might log PHI in stack traces
- [ ] Review Vercel function logs configuration

#### 3. Network Audit
- [ ] Use browser dev tools to verify no PHI sent to analytics
- [ ] Verify no third-party scripts receive PHI
- [ ] Check request/response patterns for unexpected storage

#### 4. Infrastructure Audit
- [ ] Verify Vercel log settings (disable request body logging)
- [ ] Verify Supabase log settings
- [ ] Confirm OpenAI ZDR/BAA status

### Compliance Documentation

Maintain a `PRIVACY_CONTROLS.md` document listing:

1. **Data Classification Matrix** (from this document)
2. **Storage Locations** with PHI/no-PHI designation
3. **Access Controls** (RLS policies, auth requirements)
4. **Retention Policies** (auto-deletion, TTLs)
5. **Third-Party Processors** (OpenAI with BAA)
6. **Incident Response** (what to do if PHI exposure suspected)

### Regular Verification Cadence

| Check | Frequency | Method |
|-------|-----------|--------|
| Schema audit | Monthly | SQL query |
| Code audit | Per release | Grep patterns |
| Network audit | Quarterly | Manual testing |
| Log review | Weekly | Spot check |
| BAA status | Annually | Vendor confirmation |

## Recommendations for Implementation

### Phase 1: Verify Current State (Immediate)

1. **Audit existing code** for any PHI storage
2. **Verify Vercel configuration** - no request body logging
3. **Document current OpenAI relationship** - ZDR/BAA status

### Phase 2: Strengthen Ephemeral Handling (Week 1-2)

1. **IndexedDB improvements:**
   - Add automatic expiration (24 hours)
   - Add "Clear All Data" button in settings
   - Add warning about local draft storage

2. **Add metadata logging:**
   - Create audit log entries for generate/transcribe
   - Log only metadata (duration, credits, template)

### Phase 3: OpenAI Compliance (Week 2-4)

1. **Request BAA** from OpenAI (baa@openai.com)
2. **Enable ZDR** once BAA is signed
3. **Document compliance** in app privacy policy

### Phase 4: Verification Infrastructure (Week 4-6)

1. **Create verification scripts** (schema audit, code audit)
2. **Set up monitoring** for unexpected PHI patterns
3. **Establish regular audit cadence**

## Open Questions

### 1. Vercel Logging Configuration
- **Unknown:** Default Vercel function log behavior for request bodies
- **Risk:** PHI might be captured in function logs
- **Action:** Verify Vercel project settings, consider custom logging

### 2. Error Handling
- **Unknown:** Whether error stack traces include request data
- **Risk:** PHI exposure in error logs
- **Action:** Review error handling patterns, sanitize before logging

### 3. Third-Party Analytics
- **Unknown:** What data Vercel Analytics captures
- **Risk:** PHI in analytics payloads
- **Action:** Review analytics configuration, exclude PHI routes

## Sources

### Primary (HIGH Confidence)
- [OpenAI Business Data Privacy](https://openai.com/business-data/) - ZDR and BAA information
- [OpenAI Help Center - BAA](https://help.openai.com/en/articles/8660679-how-can-i-get-a-business-associate-agreement-baa-with-openai) - BAA request process
- [Supabase HIPAA Compliance](https://supabase.com/docs/guides/security/hipaa-compliance) - Supabase HIPAA capabilities
- [Supabase Auth Audit Logs](https://supabase.com/docs/guides/auth/audit-logs) - Built-in audit logging

### Secondary (MEDIUM Confidence)
- [HIPAA Journal - AI and HIPAA](https://www.hipaajournal.com/when-ai-technology-and-hipaa-collide/) - Regulatory context
- [Kiteworks - HIPAA Audit Logs](https://www.kiteworks.com/hipaa-compliance/hipaa-audit-log-requirements/) - Audit requirements
- [Sprinto - HIPAA Storage](https://sprinto.com/blog/hipaa-compliant-data-storage/) - Storage requirements

### Tertiary (LOW Confidence - Needs Validation)
- Community discussions on OpenAI forums about ZDR implementation details
- Blog posts about HIPAA-compliant AI architectures

## Metadata

**Confidence Breakdown:**
- Data classification: HIGH - Based on schema analysis and industry standards
- OpenAI policies: MEDIUM - Official docs confirm, but requires BAA signing to verify
- Audit patterns: HIGH - Based on HIPAA requirements and existing schema
- Verification: HIGH - Based on standard compliance practices

**Research Date:** 2026-01-20
**Valid Until:** 60 days (re-check OpenAI policies, verify BAA status)
