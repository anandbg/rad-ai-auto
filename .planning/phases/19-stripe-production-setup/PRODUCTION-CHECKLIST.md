# Stripe Production Go-Live Checklist

## Pre-Launch Verification (Test Mode)

### Phase 19-01: CLI Setup
- [x] Stripe CLI installed (v1.33.0)
- [x] CLI authenticated to account (acct_1SYQ7v5pdloqz3iU)
- [x] Webhook forwarding working
- [x] Test event triggers working

### Phase 19-02: Webhook Handler Verification
- [x] All 6 webhook events handled:
  - [x] `checkout.session.completed`
  - [x] `customer.subscription.created`
  - [x] `customer.subscription.updated`
  - [x] `customer.subscription.deleted`
  - [x] `invoice.payment_succeeded`
  - [x] `invoice.payment_failed`
- [x] CLI trigger tests pass
- [x] Playwright E2E test suite created
- [x] Webhook returns 400 for missing signature (security verified)

### Pre-Launch Manual Testing
- [ ] Full checkout flow tested: signup > checkout > subscription active
- [ ] Subscription upgrade tested: Free > Plus > Pro
- [ ] Subscription cancellation tested via Customer Portal
- [ ] Payment failure handling tested (card `4000000000000002`)
- [ ] Database correctly reflects all subscription state changes

## Production Setup

### Prerequisites
- [ ] Production domain deployed (Phase 20 - Vercel Deployment)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Application accessible at production URL

### Stripe Dashboard Configuration

#### Step 1: Switch to Live Mode
- [ ] Open https://dashboard.stripe.com
- [ ] Toggle OFF "Test mode" (top right corner)
- [ ] Confirm you see "Live mode" indicator

#### Step 2: Create/Copy Products
- [ ] Navigate to Products
- [ ] Create products in Live mode:
  - [ ] **Plus Plan:** Monthly subscription, £10/month
  - [ ] **Pro Plan:** Monthly subscription, £20/month
- [ ] Record Live mode price IDs:
  - Plus: `price_` ________________________
  - Pro: `price_` ________________________

#### Step 3: Create Production Webhook Endpoint
- [ ] Navigate to Developers > Webhooks
- [ ] Click "Add endpoint"
- [ ] Enter Endpoint URL: `https://______________________/api/stripe/webhook`
- [ ] Click "Select events" and add:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] Click "Add endpoint"
- [ ] Click on new endpoint > Reveal signing secret
- [ ] Record webhook secret: `whsec_` ________________________

#### Step 4: Get Live API Keys
- [ ] Navigate to Developers > API keys
- [ ] Copy Publishable key: `pk_live_` ________________________
- [ ] Click "Reveal test key" and copy Secret key: `sk_live_` ________________________

### Vercel Environment Configuration

#### Production Environment Variables
- [ ] Go to Vercel Dashboard > Project > Settings > Environment Variables
- [ ] Set for **Production** environment only:

| Variable | Value |
|----------|-------|
| STRIPE_SECRET_KEY | `sk_live_...` |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | `pk_live_...` |
| STRIPE_WEBHOOK_SECRET | `whsec_...` (from production webhook) |
| STRIPE_PRICE_ID_PLUS | `price_...` (live mode) |
| STRIPE_PRICE_ID_PRO | `price_...` (live mode) |

- [ ] Verify Preview environment still uses test keys
- [ ] Trigger redeployment to apply new variables

## Post-Launch Verification

### Immediate Checks
- [ ] Deployment successful with no build errors
- [ ] Application loads at production URL
- [ ] Stripe.js loads correctly (check browser console)

### Webhook Verification
- [ ] Go to Stripe Dashboard > Webhooks > Select production endpoint
- [ ] Click "Send test webhook"
- [ ] Select `checkout.session.completed`
- [ ] Click "Send test webhook"
- [ ] Verify response: "200 OK" (check webhook logs)

### Live Payment Test
- [ ] Create new account on production site
- [ ] Go to Billing > Upgrade to Plus
- [ ] Complete checkout with **real card** (personal card is fine)
- [ ] Verify:
  - [ ] Checkout completes successfully
  - [ ] Redirect to /dashboard works
  - [ ] Subscription shows as "Plus" in account
  - [ ] Database subscription record created
- [ ] Cancel subscription via Customer Portal
- [ ] Verify:
  - [ ] Portal loads correctly
  - [ ] Cancellation processed
  - [ ] Account shows as "Free" or cancelled
- [ ] Go to Stripe Dashboard > Payments
- [ ] Find the test payment and issue refund (optional, but recommended)

### Monitoring Setup
- [ ] Enable Stripe email notifications for failed payments
- [ ] Enable Vercel deployment notifications
- [ ] Consider adding Sentry for error tracking

## Rollback Plan

If issues arise after go-live:

### Step 1: Immediate Mitigation
```bash
# Option A: Revert to test mode (stops real payments)
# Update Vercel environment variables back to test keys

# Option B: Take site down for maintenance
# Set a maintenance page via Vercel
```

### Step 2: Revert Environment
1. Go to Vercel Dashboard > Project > Settings > Environment Variables
2. Change Production variables back to test mode keys:
   - `STRIPE_SECRET_KEY` = `sk_test_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...`
3. Trigger redeployment

### Step 3: Investigate
1. Check Stripe Dashboard > Webhooks for delivery failures
2. Check Vercel Functions > Logs for errors
3. Check Supabase > Database > subscriptions table for data issues

### Step 4: Fix and Re-launch
1. Debug and fix issues in test mode/preview environment
2. Test fix thoroughly with CLI triggers
3. Re-attempt go-live following this checklist

## Ongoing Monitoring

### Daily Checks (First Week)
- [ ] Check Stripe Dashboard > Webhooks for failed deliveries
- [ ] Check Vercel logs for webhook errors
- [ ] Verify new signups have correct subscription state

### Weekly Checks
- [ ] Review failed payment reports in Stripe
- [ ] Check for subscription anomalies (stuck states, missing records)
- [ ] Monitor webhook delivery success rate (target: 99%+)

### Stripe Dashboard Monitoring
- **Webhooks page:** Shows delivery success/failure per event
- **Events page:** All events sent to your endpoint
- **Payments page:** All payments and their status
- **Subscriptions page:** Active subscription overview

### Application Log Patterns
All webhook handlers log with `[Stripe Webhook]` prefix:
```
[Stripe Webhook] Processing checkout.session.completed
[Stripe Webhook] Updated subscription for user: user_id
[Stripe Webhook] Error: {error details}
```

## Customer Support Scenarios

| Issue | Resolution |
|-------|------------|
| "Payment failed" | Check Stripe Dashboard for decline reason, advise customer to try different card |
| "Subscription not showing" | Check webhook logs, verify subscription table, manually sync if needed |
| "Can't access billing portal" | Generate new portal link via Stripe API or Dashboard |
| "Wrong plan showing" | Compare subscriptions table with Stripe, update manually if discrepancy |
| "Charge but no access" | Check webhook delivery, process manually if webhook failed |

## Emergency Contacts

- **Stripe Support:** https://support.stripe.com
- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/support

---
*Last updated: 2026-01-19*
*Phase: 19-stripe-production-setup*
*Prerequisites: Phase 20 (Vercel Deployment) must be complete before executing production steps*
