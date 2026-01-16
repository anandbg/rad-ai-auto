---
phase: 09-stripe-billing
plan: 01
subsystem: payments
tags: [stripe, checkout, portal, subscriptions, billing]

# Dependency graph
requires:
  - phase: 01-database-foundation
    provides: subscriptions table schema
provides:
  - Stripe Checkout session creation endpoint
  - Stripe Customer Portal session creation endpoint
  - Automatic Stripe customer creation during checkout
affects: [09-02-webhook-handlers, billing-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Stripe client initialization pattern
    - Price ID validation against environment config
    - Customer upsert on first checkout

key-files:
  created:
    - app/app/api/billing/checkout/route.ts
    - app/app/api/billing/portal/route.ts
  modified: []

key-decisions:
  - "Validate priceId against configured price IDs for security"
  - "Create Stripe customer on first checkout, not signup"
  - "Upsert subscription record with customer ID before checkout"

patterns-established:
  - "Stripe Checkout flow: validate -> customer lookup/create -> upsert subscription -> create session -> return URL"
  - "Portal flow: auth -> customer lookup -> create session -> return URL"

# Metrics
duration: 2min
completed: 2026-01-16
---

# Phase 9 Plan 1: Stripe API Endpoints Summary

**Stripe Checkout and Customer Portal API endpoints for subscription management via hosted Stripe pages**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-16T19:03:51Z
- **Completed:** 2026-01-16T19:05:45Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- POST /api/billing/checkout creates Stripe Checkout sessions for plan upgrades
- POST /api/billing/portal creates Stripe Customer Portal sessions for subscription management
- Checkout endpoint creates Stripe customer if none exists and upserts to subscriptions table
- Both endpoints integrate with billing page handleUpgrade and handleManageSubscription functions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Stripe Checkout endpoint** - `be73281` (feat)
2. **Task 2: Create Stripe Customer Portal endpoint** - `d077dda` (feat)

## Files Created

- `app/app/api/billing/checkout/route.ts` - Creates Stripe Checkout session for subscription upgrade
- `app/app/api/billing/portal/route.ts` - Creates Stripe Customer Portal session for subscription management

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Validate priceId against environment config | Security: prevents arbitrary price IDs from being used |
| Create Stripe customer during checkout | Deferred creation: only creates customer when user actually upgrades |
| Upsert subscription record before checkout | Ensures stripe_customer_id is stored for future portal access |
| Use environment variable for app URL | Supports different environments (dev/staging/prod) |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - both endpoints implemented cleanly following existing patterns from invoices/route.ts.

## User Setup Required

**External services require manual configuration.** The plan frontmatter specifies required Stripe setup:

Environment variables needed:
- `STRIPE_SECRET_KEY` - Stripe Dashboard > Developers > API keys > Secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe Dashboard > Developers > API keys > Publishable key
- `STRIPE_PRICE_ID_PLUS` - Stripe Dashboard > Products > Plus Plan > Price ID
- `STRIPE_PRICE_ID_PRO` - Stripe Dashboard > Products > Pro Plan > Price ID
- `NEXT_PUBLIC_APP_URL` - Application URL for redirects

Dashboard configuration:
1. Create Plus product with $15/month price in Stripe Dashboard
2. Create Pro product with $35/month price in Stripe Dashboard

Local development:
- Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` for webhook testing

## Next Phase Readiness

- Checkout and Portal endpoints ready for use
- Billing page already has handleUpgrade and handleManageSubscription wired to these endpoints
- Ready for plan 09-02: Webhook handlers for subscription lifecycle events

---
*Phase: 09-stripe-billing*
*Completed: 2026-01-16*
