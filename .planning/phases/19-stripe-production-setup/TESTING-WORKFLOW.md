# Stripe Local Testing Workflow

## Quick Start

Run these commands in two separate terminals:

**Terminal 1: Start the app**
```bash
cd app && npm run dev
```

**Terminal 2: Start webhook forwarding**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_xxxxx` secret to `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## Test Event Commands

With both processes running, trigger test events:

```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription cancellation
stripe trigger customer.subscription.deleted

# Test failed payment
stripe trigger invoice.payment_failed
```

## What to Verify After Each Event

1. **Terminal output**: Look for `[Stripe Webhook]` log messages
2. **Expected logs**:
   - `checkout.session.completed` -> "Activated subscription"
   - `customer.subscription.updated` -> "Updated subscription"
   - `customer.subscription.deleted` -> "Downgraded to free"
   - `invoice.payment_failed` -> "Marked subscription as past_due"

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not authenticated" | Run `stripe login` |
| "Webhook signature verification failed" | Copy new secret from `stripe listen` output to .env.local, restart app |
| "Connection refused" | Ensure app is running on port 3000 |
| "No user_id in metadata" | CLI triggers use synthetic data - this is expected, full E2E test in Plan 02 |

## Test Cards for Checkout

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0000 0000 3220 | 3D Secure required |

Always use future expiry date (e.g., 12/30), any CVC (e.g., 123).

## Current Configuration

- **Account**: Ask Digital Consultancy Ltd sandbox
- **Account ID**: acct_1SYQ7v5pdloqz3iU
- **CLI Version**: 1.33.0
- **Test Mode Keys Expire**: 2026-02-27
