---
phase: 260407-7vr-stripe-production-wiring
plan: 01
subsystem: billing/stripe
tags: [stripe, webhook, vercel, deployment, supabase, sandbox]
dependency_graph:
  requires:
    - prior quick task 260407-7bd (webhook patches in b7476d8, persistent endpoint we_1TJRBW5pdloqz3iUiLrJ4nN7, rotated secret in app/.env.local)
    - Vercel project prj_NAVCi0I1MQ4hXATa5YDCifoha1fi linked at app/.vercel/project.json
    - Supabase project rbritrrchdpzzollcfql linked at app/supabase/.temp/project-ref
  provides:
    - production Vercel deployment serving /api/stripe/webhook (HTTP 400 on unsigned POST)
    - 4 Stripe env vars (rotated STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_PLUS/PRO, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) pushed to production + preview scopes
    - all 4 prior-pending Stripe events now pending_webhooks=0 (Stripe received 2xx from deployed endpoint)
  affects:
    - Vercel project env (production + preview scopes)
    - Vercel production alias ai-radiologist-one.vercel.app
tech_stack:
  added: []
  patterns:
    - "Vercel Management API upsert=true for bulk env var POST (targets=[production,preview])"
    - "Stripe REST event retry via POST /v1/events/{id}/retry with webhook_endpoint param"
key_files:
  created:
    - .planning/quick/260407-7vr-stripe-production-wiring-deploy-app-to-v/260407-7vr-SUMMARY.md
  modified: []
decisions:
  - "Applied env changes via Vercel Management API upsert=true (single call replaces any existing value across targets) because `vercel env add` is interactive and unreliable in agent mode — pattern documented in CLAUDE.md Vercel playbook"
  - "Supabase migration application DEFERRED — `supabase db push --linked` requires DB password (not cached, not in .env.local, no SUPABASE_ACCESS_TOKEN for Management API). Manual paste instructions + full SQL embedded below for user to run in Dashboard SQL editor"
  - "Used Stripe `POST /v1/events/{id}/retry` with `webhook_endpoint=we_xxx` parameter (the `endpoint=` form returned parameter_unknown); all 4 events transitioned pending_webhooks=1→0 within 20s of retry"
  - "Did NOT restart Task 4 after discovering DB rows missing — the webhook handler swallows missing-table errors and still returns 200, so retrying would not persist rows until migrations run. Documented partial verification instead"
metrics:
  duration: ~6 min
  completed_date: 2026-04-07
---

# 260407-7vr Plan 01: Stripe Production Wiring — Deploy App to Vercel + Apply Migrations Summary

One-liner: Rotated STRIPE_WEBHOOK_SECRET and added 3 missing Stripe env vars to Vercel production+preview via Management API, deployed app to `ai-radiologist-one.vercel.app` via prebuilt path (route now serves HTTP 400 instead of 404), and force-retried the 4 prior-pending Stripe events so all show `pending_webhooks=0` — but DB persistence is blocked until the Supabase migrations are manually applied (DB password not available).

## What Changed

| Scope | Change | How |
|-------|--------|-----|
| Vercel env (production + preview) | STRIPE_WEBHOOK_SECRET rotated to match `app/.env.local` (freshly-issued `whsec_*` from prior task) | Management API DELETE (old 2 entries) then POST upsert=true |
| Vercel env (production + preview) | STRIPE_PRICE_ID_PLUS, STRIPE_PRICE_ID_PRO, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ADDED (previously missing from all scopes) | Management API POST upsert=true |
| Vercel production deployment | `dpl_3Kbz3fcvxuwKum3U4Q8aiUSAF5z3` → `https://ai-radiologist-g6e39aotb-anands-projects-8d50deab.vercel.app` aliased to `ai-radiologist-one.vercel.app` | `vercel build --prod && vercel deploy --prebuilt --prod` from `app/` |
| Stripe sandbox events | 4 events force-retried; pending_webhooks 1→0 | `POST /v1/events/{id}/retry` with `webhook_endpoint=we_1TJRBW5pdloqz3iUiLrJ4nN7` |
| Repo git state | No code changes; only SUMMARY.md added | `git add` + commit |

## Task 1 — Supabase Migration Application: DEFERRED

**Status:** Blocked on user-provided DB password.

**What was attempted:**
1. `supabase db push --linked --yes` → prompted for DB password, then after a cached attempt returned `FATAL: password authentication failed for user "postgres"` (SQLSTATE 28P01) against `aws-1-eu-west-1.pooler.supabase.com`.
2. Checked `~/.supabase/`, `~/Library/Application Support/supabase/`, and env vars — no cached `SUPABASE_ACCESS_TOKEN` for Management API fallback.
3. Probed Supabase REST for an `exec_sql` RPC → 404 PGRST202 (not installed).
4. Probed the tables themselves via REST — confirmed both return PGRST205 "Could not find the table in schema cache" on the hosted `rbritrrchdpzzollcfql` project.

**Per-plan contingency:** Task 1 explicitly allowed deferral with "manual SQL paste instructions" documented, so I continued with Tasks 2/3 (which do not depend on DB state) and completed a partial Task 4 verification.

### Manual fix (user action required)

Open https://supabase.com/dashboard/project/rbritrrchdpzzollcfql/sql/new and run these **two migrations in order**:

**1. `20260122000000_stripe_webhook_events.sql`**

```sql
-- Track processed Stripe webhook events for idempotency
-- Prevents duplicate processing if Stripe retries delivery

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE, -- Stripe event ID (evt_xxx)
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB, -- Optional: store event data for debugging
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stripe_webhook_events_event_id ON stripe_webhook_events(event_id);

COMMENT ON TABLE stripe_webhook_events IS 'Tracks processed Stripe webhook events for idempotency';
```

**2. `20260407000000_stripe_idempotency_and_invoices.sql`**

```sql
-- 1. Make processed_at NULLable so we can insert "received but not yet processed"
--    rows. The previous schema had `NOT NULL DEFAULT NOW()` which made every
--    insert look "processed", causing failed events to be skipped on retry.
ALTER TABLE stripe_webhook_events
  ALTER COLUMN processed_at DROP NOT NULL,
  ALTER COLUMN processed_at DROP DEFAULT;

-- Backfill: any existing rows are assumed processed (historical data).
UPDATE stripe_webhook_events SET processed_at = COALESCE(processed_at, created_at);

-- 2. New table for invoice records (created on invoice.payment_succeeded).
CREATE TABLE IF NOT EXISTS stripe_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id TEXT NOT NULL UNIQUE,            -- in_xxx
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,                       -- nullable (one-off invoices)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_paid INTEGER NOT NULL,                      -- in minor units (pence)
  currency TEXT NOT NULL,
  status TEXT NOT NULL,                              -- paid, open, void, etc.
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  hosted_invoice_url TEXT,
  invoice_pdf TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_invoices_customer ON stripe_invoices(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_user ON stripe_invoices(user_id);

COMMENT ON TABLE stripe_invoices IS 'Persisted invoice records from Stripe invoice.payment_succeeded webhooks';
```

**Alternative (CLI):** set the DB password in the shell and re-run push:
```bash
cd /Users/anand/rad-ai-auto/app
export SUPABASE_DB_PASSWORD='<your-db-password>'
supabase db push --linked --yes
```

After applying, re-retry the 4 events to populate `stripe_webhook_events` and `stripe_invoices`:
```bash
cd /Users/anand/rad-ai-auto/app
STRIPE_KEY=$(grep "^STRIPE_SECRET_KEY=" .env.local | cut -d= -f2-)
for EVT in evt_1TJRCj5pdloqz3iUalIq2By8 evt_1TJRCk5pdloqz3iU30pZh6TN evt_1TJRCr5pdloqz3iUtMR7r6N0 evt_1TJRD45pdloqz3iUFnAGRbqr; do
  curl -s -u "$STRIPE_KEY:" -X POST "https://api.stripe.com/v1/events/$EVT/retry" \
    -d "webhook_endpoint=we_1TJRBW5pdloqz3iUiLrJ4nN7" >/dev/null
done
```

## Task 2 — Vercel Env State (key names only, never values)

### Before

| Key | Production | Preview | Development | Status |
|-----|------------|---------|-------------|--------|
| `STRIPE_WEBHOOK_SECRET` | present (stale, 152d ago) | present (stale, 152d ago) | present | **rotation needed** |
| `STRIPE_PRICE_ID_PLUS` | MISSING | MISSING | MISSING | **add needed** |
| `STRIPE_PRICE_ID_PRO` | MISSING | MISSING | MISSING | **add needed** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | MISSING | MISSING | MISSING | **add needed** |

### After

| Key | Production | Preview | Development |
|-----|------------|---------|-------------|
| `STRIPE_WEBHOOK_SECRET` | rotated (this run) | rotated (this run) | untouched (out of scope) |
| `STRIPE_PRICE_ID_PLUS` | ADDED | ADDED | — |
| `STRIPE_PRICE_ID_PRO` | ADDED | ADDED | — |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ADDED | ADDED | — |

Verification (Management API GET `/v10/projects/{id}/env`, key names + targets only):

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY       preview,production
STRIPE_PRICE_ID_PLUS                     preview,production
STRIPE_PRICE_ID_PRO                      preview,production
STRIPE_WEBHOOK_SECRET                    preview,production
STRIPE_WEBHOOK_SECRET                    development   (pre-existing, untouched)
```

**Security:** no values were echoed to chat, logs, or committed files. All 4 values were read from `app/.env.local` via Python file-read + JSON POST to Vercel's API (no shell interpolation of secrets). The rotation DELETE response included Vercel's own ciphertext for the old entry, which is not the plaintext secret.

## Task 3 — Deployment

### Local build (`pnpm build`)

Succeeded on first try. No playbook gotchas hit (no `react-resizable-panels` error, no `match[1]` null-guard error). All 48 routes compiled, including `ƒ /api/stripe/webhook`.

### Vercel prebuilt deploy

```
cd app
rm -rf .vercel/output .next
pnpm build           # ✓ success
vercel build --prod  # ✓ outputDir .vercel/output, target production
vercel deploy --prebuilt --prod
```

**Deployment result:**
- `id`: `dpl_3Kbz3fcvxuwKum3U4Q8aiUSAF5z3`
- `url`: `https://ai-radiologist-g6e39aotb-anands-projects-8d50deab.vercel.app`
- `aliased`: `https://ai-radiologist-one.vercel.app`
- `readyState`: `READY`
- `target`: `production`
- `inspectorUrl`: `https://vercel.com/anands-projects-8d50deab/ai-radiologist/3Kbz3fcvxuwKum3U4Q8aiUSAF5z3`

### Webhook route reachability confirmation

```
$ curl -is -X POST https://ai-radiologist-one.vercel.app/api/stripe/webhook
HTTP/2 400
content-type: application/json
x-matched-path: /api/stripe/webhook
x-vercel-id: lhr1::iad1::t6v4n-1775537686847-b522cb1c636d

{"error":"Missing stripe-signature header"}
```

**Route is live.** HTTP 400 with the exact error body from `route.ts:60-62` proves (a) routing works, (b) the handler is running, (c) `STRIPE_WEBHOOK_SECRET` must be set (otherwise it would return 500 from lines 66-72 BEFORE the signature check — but note the signature check comes first, so we can only assert env from a signed request).

## Task 4 — Stripe Event Delivery Verification

### Starting state (before retry)

All 4 events, polled against `https://api.stripe.com/v1/events/{id}`:

| # | Event ID | Type | pending_webhooks (before) |
|---|----------|------|---------------------------|
| 1 | `evt_1TJRCj5pdloqz3iUalIq2By8` | `customer.subscription.created` | 1 |
| 2 | `evt_1TJRCk5pdloqz3iU30pZh6TN` | `invoice.payment_succeeded` | 1 |
| 3 | `evt_1TJRCr5pdloqz3iUtMR7r6N0` | `customer.subscription.updated` | 1 |
| 4 | `evt_1TJRD45pdloqz3iUFnAGRbqr` | `customer.subscription.deleted` | 1 |

### Force retry

Stripe's `POST /v1/events/{id}/retry` rejected `endpoint=` (`parameter_unknown`) but accepted `webhook_endpoint=we_1TJRBW5pdloqz3iUiLrJ4nN7`. All 4 retries returned the event object (success).

### Ending state (after 20s sleep)

| # | Event ID | Type | pending_webhooks (after) | DB row? |
|---|----------|------|--------------------------|---------|
| 1 | `evt_1TJRCj5pdloqz3iUalIq2By8` | `customer.subscription.created` | **0** | NO (table missing) |
| 2 | `evt_1TJRCk5pdloqz3iU30pZh6TN` | `invoice.payment_succeeded` | **0** | NO (table missing) |
| 3 | `evt_1TJRCr5pdloqz3iUtMR7r6N0` | `customer.subscription.updated` | **0** | NO (table missing) |
| 4 | `evt_1TJRD45pdloqz3iUFnAGRbqr` | `customer.subscription.deleted` | **0** | NO (table missing) |

**Half the verification loop closed.** Stripe sees 2xx from `ai-radiologist-one.vercel.app/api/stripe/webhook` for all 4 events (pending_webhooks=0). The other half (DB persistence) is blocked by the deferred Task 1 migrations.

### Why did pending_webhooks=0 without DB rows?

Inspection of `app/app/api/stripe/webhook/route.ts` shows the handler:
1. Wraps the idempotency table write in a `try/catch` that logs "table may not exist yet" and continues (lines 105-145).
2. Each switch-case handler has its own try/catch that `logError`s DB errors without re-throwing (e.g. lines 148-258 for subscription events; line 319 for invoice upsert).
3. Flows through to `return NextResponse.json({ received: true, ... })` at line 383.

So with tables missing the route returns 200, Stripe marks delivery successful, and no rows are persisted. This is arguably a latent resilience feature (webhook doesn't crash during migration rollout), but it means Stripe's `pending_webhooks=0` is NOT by itself evidence of successful processing — it only proves the route responded 2xx.

### DB row verification

```
$ curl "$SUPA_URL/rest/v1/stripe_webhook_events?event_id=in.(...)&select=event_id,event_type,processed_at"
{"code":"PGRST205","message":"Could not find the table 'public.stripe_webhook_events' in the schema cache"}

$ curl "$SUPA_URL/rest/v1/stripe_invoices?select=stripe_invoice_id,amount_paid,status,user_id&limit=10"
{"code":"PGRST205","message":"Could not find the table 'public.stripe_invoices' in the schema cache"}
```

Both return 404 PGRST205. Tables do not exist. DB-persistence verification is **not possible** until the user applies the two migrations above.

## Must-Haves Scorecard

| Truth | Status |
|-------|--------|
| POST to webhook returns HTTP 400 (not 404) | **PASS** |
| Hosted Supabase has `stripe_webhook_events` AND `stripe_invoices` tables | **FAIL** (deferred Task 1 — manual SQL paste required) |
| Vercel env contains rotated `STRIPE_WEBHOOK_SECRET` + `STRIPE_PRICE_ID_PLUS/PRO` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in production + preview | **PASS** |
| All 4 pending Stripe events show `pending_webhooks=0` | **PASS** |
| `stripe_webhook_events` has rows for the 4 event_ids with `processed_at IS NOT NULL` | **FAIL** (blocked on Task 1) |
| `stripe_invoices` has ≥1 row from `invoice.payment_succeeded` | **FAIL** (blocked on Task 1) |

**Score: 3/6 truths PASS, 3/6 blocked by deferred Task 1 (all three are the same blocker: migrations not applied).**

## Deviations from Plan

### Deferred (environmental)

1. **Task 1 — Supabase migrations.** Blocked on DB password. Full contingency exercised as documented in the plan: both migration SQL files embedded above with explicit paste instructions. User action required.

### Auto-fixed (Rule 3 — blocking issues)

None. The plan anticipated every fallback I needed (Management API pattern, event retry parameter-unknown fallback, DB password absent fallback). Executed as written.

## Outstanding Follow-ups

- [ ] **USER:** Paste the two migration SQL blocks into https://supabase.com/dashboard/project/rbritrrchdpzzollcfql/sql/new (in the order shown) OR provide `SUPABASE_DB_PASSWORD` in the shell and re-run `supabase db push --linked --yes` from `app/`.
- [ ] **USER or next task:** Re-force-retry the 4 events after migrations apply (snippet provided above). Expected result: 4 rows in `stripe_webhook_events` with `processed_at IS NOT NULL`, 1 row in `stripe_invoices` from `evt_1TJRCk…` (the `invoice.payment_succeeded` event).
- [ ] **Known latent issue:** The webhook route swallows all DB errors and returns 200. This means Stripe will report success even if every DB write fails, and there is no alerting on silent persistence failures. Consider surfacing DB errors to Stripe (return 500) for critical writes so Stripe retries. Out of scope for this plan.
- [ ] **Pre-existing:** `STRIPE_WEBHOOK_SECRET` still present in `development` Vercel scope from 152 days ago (un-rotated). Not in scope (plan only required production + preview rotation), but worth addressing in the next cleanup pass.

## Self-Check

Files verified:
- FOUND: `.planning/quick/260407-7vr-stripe-production-wiring-deploy-app-to-v/260407-7vr-SUMMARY.md` (this file)
- FOUND: `app/supabase/migrations/20260122000000_stripe_webhook_events.sql` (embedded verbatim above)
- FOUND: `app/supabase/migrations/20260407000000_stripe_idempotency_and_invoices.sql` (embedded verbatim above)

Deployment verified:
- FOUND: `dpl_3Kbz3fcvxuwKum3U4Q8aiUSAF5z3` (readyState READY, aliased to ai-radiologist-one.vercel.app)
- FOUND: HTTP 400 response from `POST https://ai-radiologist-one.vercel.app/api/stripe/webhook` with `x-matched-path: /api/stripe/webhook`

Vercel env verified (via Management API GET):
- FOUND: `STRIPE_WEBHOOK_SECRET` targets=[production,preview]
- FOUND: `STRIPE_PRICE_ID_PLUS` targets=[production,preview]
- FOUND: `STRIPE_PRICE_ID_PRO` targets=[production,preview]
- FOUND: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` targets=[production,preview]

Stripe events verified (via `GET /v1/events/{id}`):
- FOUND: all 4 events with `pending_webhooks=0`

DB rows verified:
- MISSING: `stripe_webhook_events` table (expected — Task 1 deferred)
- MISSING: `stripe_invoices` table (expected — Task 1 deferred)

## Self-Check: PARTIAL PASS

3 of 6 must-have truths verified; the remaining 3 are blocked by a single deferred prerequisite (Task 1 migrations) which requires user-provided DB credentials. All deliverables within the executor's authority are complete and verified.
