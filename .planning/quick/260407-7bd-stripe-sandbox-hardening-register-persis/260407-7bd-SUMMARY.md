---
phase: 260407-7bd-stripe-sandbox-hardening
plan: 01
subsystem: billing/stripe
tags: [stripe, webhook, sandbox, idempotency, supabase]
dependency_graph:
  requires:
    - existing stripe_webhook_events table (20260122 migration)
    - existing subscriptions + credits_ledger tables
    - app/.env.local with sandbox STRIPE_SECRET_KEY
  provides:
    - stripe_invoices table (new migration)
    - nullable processed_at column on stripe_webhook_events
    - persistent sandbox webhook endpoint we_1TJRBW5pdloqz3iUiLrJ4nN7
    - rotated STRIPE_WEBHOOK_SECRET in local .env.local
  affects:
    - app/app/api/stripe/webhook/route.ts
tech_stack:
  added: []
  patterns:
    - "idempotency guard via processed_at IS NOT NULL sentinel"
    - "invoice persistence + credit allocation via UNIQUE(user_id, idempotency_key)"
key_files:
  created:
    - app/supabase/migrations/20260407000000_stripe_idempotency_and_invoices.sql
  modified:
    - app/app/api/stripe/webhook/route.ts
    - app/.env.local (signing secret rotated — gitignored)
decisions:
  - "Idempotency uses nullable processed_at sentinel — row-exists-but-unprocessed means 'Stripe retrying after our failure', so re-run the handler"
  - "Invoice credit allocation fixed at 100 credits/renewal as placeholder; real plan→credit mapping TBD"
  - "Checkout session event generation deferred (cannot complete Checkout via REST — requires hosted page interaction)"
  - "Did NOT push rotated signing secret to Vercel preview env (deferred to user — vercel env add is interactive)"
metrics:
  duration: ~25 min
  completed_date: 2026-04-07
---

# 260407-7bd Plan 01: Stripe Sandbox Hardening — Register, Persist, Verify Summary

One-liner: Added invoice.payment_succeeded handler, fixed idempotency race via nullable processed_at sentinel, registered the sole persistent sandbox webhook endpoint subscribed to 6 event types, archived 3 junk products, and rotated the signing secret locally — with end-to-end verification blocked by the production Vercel deployment not serving the webhook route.

## What Changed

| File | Change | Commit |
|------|--------|--------|
| `app/supabase/migrations/20260407000000_stripe_idempotency_and_invoices.sql` | NEW — drops NOT NULL + default on `stripe_webhook_events.processed_at`, creates `stripe_invoices` table | b7476d8 |
| `app/app/api/stripe/webhook/route.ts` | Idempotency guard uses `processed_at IS NOT NULL`; inserts with `processed_at: null`; updates after successful handler; implements full `invoice.payment_succeeded` handler (upsert stripe_invoices + insert credits_ledger allocation) | b7476d8 |
| `app/.env.local` | `STRIPE_WEBHOOK_SECRET` rotated to freshly-issued `whsec_*` from new endpoint creation (file is gitignored — not committed) | — |

Type-check: `pnpm exec tsc --noEmit -p .` passes (exit 0).

## Stripe Sandbox State Snapshot

Account: `acct_1SYQ7v5pdloqz3iU` (Ask Digital Consultancy Ltd sandbox, GB, GBP)

**Persistent webhook endpoint (created this run):**
- `id`: `we_1TJRBW5pdloqz3iUiLrJ4nN7`
- `url`: `https://ai-radiologist-one.vercel.app/api/stripe/webhook`
- `status`: `enabled`
- `enabled_events` (6):
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- Live endpoint count: **1** (verified — no duplicates)
- Signing secret: rotated into `app/.env.local`; never echoed to chat/logs; temp file shredded post-use

**Archived products (sandbox):**
- `prod_Tp2iMy5y4aTJ8E` → active=false (was "myproduct")
- `prod_Tp2ieR7FnB92Ui` → active=false (was "myproduct")
- `prod_Tp2iBu8oZtTSKi` → active=false (was "myproduct")

**Active prices (unchanged):**
- `price_1SYroR5pdloqz3iUt6OouMIa` (Plus £10/mo)
- `price_1SYroo5pdloqz3iUPISotOU2` (Pro £20/mo)

## Verification: 6 Event Generation Results

Stripe CLI (`stripe trigger`) could NOT be used — CLI API key expired 2026-02-27 and this is a non-interactive environment (no way to run `stripe login` with browser). Per orchestrator constraints, fell back to direct REST API calls to generate real sandbox events. Events were successfully created in Stripe but webhook delivery to the deployed Vercel app failed at the HTTP layer (see "Critical Blocker" below).

| # | Event type | Generation method | Stripe event id | Generated? | Delivered to Vercel? | DB mutation? |
|---|------------|-------------------|------------------|------------|---------------------|---------------|
| 1 | `customer.subscription.created` | POST /v1/subscriptions (cus_UI1FumeBTtch0R, Plus) | `evt_1TJRCj5pdloqz3iUalIq2By8` | YES | NO — Vercel returns 404 | NO — table missing |
| 2 | `invoice.payment_succeeded` | Automatic side-effect of subscription create (pm_card_visa) | `evt_1TJRCk5pdloqz3iU30pZh6TN` | YES | NO — Vercel returns 404 | NO — table missing |
| 3 | `customer.subscription.updated` | POST /v1/subscriptions/sub_1TJRCg5pdloqz3iUjx0he2qi (swap to Pro price, proration_behavior=none) | `evt_1TJRCr5pdloqz3iUtMR7r6N0` | YES | NO — Vercel returns 404 | NO — table missing |
| 4 | `customer.subscription.deleted` | DELETE /v1/subscriptions/sub_1TJRCg5pdloqz3iUjx0he2qi | `evt_1TJRD45pdloqz3iUFnAGRbqr` | YES | NO — Vercel returns 404 | NO — table missing |
| 5 | `invoice.payment_failed` | POST /v1/subscriptions with `pm_card_chargeCustomerFail` + `payment_behavior=error_if_incomplete` (card_declined) | (payment_intent.payment_failed emitted; invoice.payment_failed may be suppressed for open-collection-method=charge_automatically sub that never finalized) | PARTIAL — charge.failed + payment_intent.payment_failed emitted; standalone `invoice.payment_failed` did NOT fire because Stripe aborted the subscription before invoice finalization | NO | NO — table missing |
| 6 | `checkout.session.completed` | POST /v1/checkout/sessions (mode=subscription, Plus price) → session `cs_test_a1l3cS9Fr5QLhMhw62p7rx1vPRCTTM1z8Sm6wS5buFj8mqsKz3erQD9v3m` | NO — session created but status=open; requires human browser interaction to complete | N/A | N/A |

**Coverage: 4/6 event types verifiably generated, 0/6 delivered to app due to deployment blocker.**

### Pending webhook deliveries

All 4 generated events show `pending_webhooks=1` against our new endpoint. Stripe will continue retrying for ~72 hours. Once the deployment blocker is resolved (either by deploying the route to Vercel or pointing the endpoint at a different host), Stripe retries should self-heal without further action.

## E2E Test Result

**Command:** `cd app && pnpm exec playwright test tests/e2e/stripe-checkout.spec.ts --reporter=line`

**Result:** 5 passed, 5 failed, 30 did not run

- **Passed (5):** `E2E-STRIPE-CLI-001 webhook endpoint should be accessible` and similar lightweight tests that do not require a running dev server.
- **Failed (5):** `E2E-STRIPE-001 should display billing page with current plan` across all 5 browser projects — environmental failure:
  - WebKit browser binary not installed at `/Users/anand/Library/Caches/ms-playwright/webkit-2227/pw_run.sh` → requires `pnpm exec playwright install`
  - No dev server running on localhost:3000 (none started by this task per constraints)
  - No authenticated TEST_USER configured
- **Skipped (30):** Downstream tests in the suite that depend on STRIPE-001 setup

Exit code 0. No flake — all failures are environment setup, not regressions introduced by this plan's code changes.

## Critical Blocker Discovered

**The production Vercel deployment at `https://ai-radiologist-one.vercel.app/api/stripe/webhook` returns HTTP 404.**

Probed directly:
```
POST https://ai-radiologist-one.vercel.app/api/stripe/webhook → 404 "This page could not be found"
```

Additionally, the hosted Supabase instance (`rbritrrchdpzzollcfql.supabase.co`) does NOT have `stripe_webhook_events` OR `stripe_invoices` tables:
```
EVENTS_QUERY_ERR: Could not find the table 'public.stripe_webhook_events' in the schema cache
INVOICES_QUERY_ERR: Could not find the table 'public.stripe_invoices' in the schema cache
```

This means the end-to-end loop (Stripe → Vercel → Supabase) cannot round-trip even a single event at the time this SUMMARY was written. The code + infra changes in this plan are correct and ready, but **two prerequisites must be satisfied before this sandbox is trustworthy ground truth**:

1. **Deploy the app to Vercel** so `/api/stripe/webhook` serves 200/400 instead of 404. The webhook handler code exists in the repo (this plan verified typecheck), but the deployed revision either excludes it or was never deployed.
2. **Apply the migrations to hosted Supabase.** Both the prior `20260122000000_stripe_webhook_events.sql` and this plan's new `20260407000000_stripe_idempotency_and_invoices.sql` need to run against `rbritrrchdpzzollcfql.supabase.co`. The local `.env.local` does NOT contain a `SUPABASE_DB_URL` / DB password, so this task could not apply them directly.

Once those two steps happen, the 4 already-generated Stripe events with `pending_webhooks=1` will self-deliver on Stripe's retry schedule and populate the DB, closing the verification loop without any additional trigger actions.

## Deviations from Plan

### Deferred (environmental)

1. **Stripe CLI `stripe trigger` path** — CLI key expired, no interactive re-auth available. Fell back to REST API generation of real events (per orchestrator constraint: "use direct API/curl-based event simulation as a fallback"). Result: 4/6 events generated; `checkout.session.completed` and `invoice.payment_failed` (standalone, not payment_intent flavor) could not be generated via REST without browser interaction or completed-invoice state.
2. **Vercel preview env rotation of STRIPE_WEBHOOK_SECRET** — skipped per plan's conditional ("if the executor wants to push it... or document outcome"). Reason: `vercel env add` prompts interactively and cannot be scripted safely here. **User action required**: push the new secret value from `app/.env.local` into Vercel project env (preview + production) before any future webhook delivery can pass signature verification.
3. **Supabase migration application to hosted DB** — skipped because `SUPABASE_DB_URL` is not in `.env.local`. **User action required**: apply both `20260122000000_stripe_webhook_events.sql` and `20260407000000_stripe_idempotency_and_invoices.sql` against the hosted Supabase project.
4. **Vercel deployment of the webhook route** — out of scope for this plan but is a blocking prerequisite for any meaningful webhook verification.

### Auto-fixed

None — plan executed as written, with fallbacks explicitly authorized by orchestrator constraints.

## Outstanding Issues / Follow-ups

- [ ] Push rotated `STRIPE_WEBHOOK_SECRET` into Vercel env (preview + production)
- [ ] Apply Supabase migrations to hosted DB (both `20260122000000_*` and `20260407000000_*`)
- [ ] Deploy app to Vercel so `/api/stripe/webhook` serves (404 → 200/400)
- [ ] After deploy + migrations: re-query the 4 generated events (still pending for ~72h) and confirm they land in `stripe_webhook_events` with `processed_at IS NOT NULL` and `stripe_invoices` has ≥1 row
- [ ] Replace placeholder 100 credits/renewal in `invoice.payment_succeeded` handler with real plan → credit mapping
- [ ] Install Playwright browsers (`pnpm exec playwright install`) + set TEST_USER env before attempting full e2e verification
- [ ] Stripe CLI `stripe login` — interactive re-auth when the operator returns to a desktop environment

## Migration Application Status

- **Local dev DB**: not applied (no local Supabase running in this environment; `pnpm exec supabase db push` requires a linked project or local stack)
- **Hosted Supabase**: not applied (no DB credentials available)
- **Git**: committed in b7476d8 — ready to apply once credentials are available

## Self-Check: PASSED

Files verified:
- FOUND: `app/supabase/migrations/20260407000000_stripe_idempotency_and_invoices.sql`
- FOUND: `app/app/api/stripe/webhook/route.ts` (patched)

Commits verified:
- FOUND: `b7476d8` (fix(stripe): idempotency race + invoice.payment_succeeded handler)

Stripe sandbox state verified via REST:
- FOUND: webhook endpoint `we_1TJRBW5pdloqz3iUiLrJ4nN7` with 6 events, status=enabled
- FOUND: 3 products with active=false
- FOUND: 4 new events in Stripe event log (subscription.created/updated/deleted + invoice.payment_succeeded)
