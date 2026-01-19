# Stripe Production Environment Variables

## Required Variables

| Variable | Description | Source |
|----------|-------------|--------|
| STRIPE_SECRET_KEY | API secret key (server-only) | Stripe Dashboard > Developers > API keys |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Public API key (browser-safe) | Stripe Dashboard > Developers > API keys |
| STRIPE_WEBHOOK_SECRET | Webhook signing secret | Stripe Dashboard > Webhooks > [endpoint] > Signing secret |
| STRIPE_PRICE_ID_PLUS | Plus plan price ID | Stripe Dashboard > Products > Plus Plan > Price ID |
| STRIPE_PRICE_ID_PRO | Pro plan price ID | Stripe Dashboard > Products > Pro Plan > Price ID |

## Current Test Mode Configuration

From `app/.env.example`:
- Test mode keys start with `sk_test_` and `pk_test_`
- Webhook secret: `whsec_...` (from CLI forwarding)
- Price IDs: `price_...` (test mode products)

All Stripe variables are configured in `.env.local` for local development.

## Test vs Live Mode

### Test Mode (current)
- Keys start with `sk_test_` and `pk_test_`
- Webhook secret from CLI forwarding or test endpoint (`whsec_...`)
- Uses test products/prices (`price_...`)
- No real money processed
- Use test cards: `4242424242424242` (success), `4000000000000002` (decline)

### Live Mode (production)
- Keys start with `sk_live_` and `pk_live_`
- **Must create new webhook endpoint** for production domain
- **Must either:**
  - Create new products in Live mode, OR
  - Copy products from Test to Live in Stripe Dashboard

## Account Information

- **Account:** Ask Digital Consultancy Ltd sandbox
- **Account ID:** `acct_1SYQ7v5pdloqz3iU`
- **Dashboard:** https://dashboard.stripe.com/acct_1SYQ7v5pdloqz3iU/test/dashboard

## Switching to Live Mode

### Step 1: Get Live Mode Keys

1. Open Stripe Dashboard: https://dashboard.stripe.com
2. Toggle **Test mode** OFF (top right corner - switch to "Live mode")
3. Navigate to **Developers > API keys**
4. Copy:
   - **Publishable key:** `pk_live_...`
   - **Secret key:** `sk_live_...` (click "Reveal test key" first)

### Step 2: Create Live Products

**Option A: Create New Products**
1. In Live mode, go to **Products**
2. Click **Add product**
3. Create:
   - **Plus Plan:** Monthly, £10/month
   - **Pro Plan:** Monthly, £20/month
4. Note the price IDs for each (`price_live_...`)

**Option B: Copy from Test Mode**
1. Go to **Products** in Test mode
2. Click on each product
3. Use **Copy to live mode** option (if available)

### Step 3: Create Production Webhook

1. In Live mode, go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Configure:
   - **Endpoint URL:** `https://YOUR_DOMAIN/api/stripe/webhook`
   - **Events to send:**
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Click **Add endpoint**
5. Click on the new endpoint
6. Click **Reveal** under Signing secret
7. Copy the `whsec_...` value

### Step 4: Update Vercel Environment Variables

In Vercel Dashboard > Project > Settings > Environment Variables:

| Variable | Environment | Value |
|----------|-------------|-------|
| STRIPE_SECRET_KEY | Production | `sk_live_...` |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Production | `pk_live_...` |
| STRIPE_WEBHOOK_SECRET | Production | `whsec_...` (from production webhook) |
| STRIPE_PRICE_ID_PLUS | Production | `price_...` (live mode) |
| STRIPE_PRICE_ID_PRO | Production | `price_...` (live mode) |

**Important:** Keep test mode variables for Preview/Development environments:
- Development: Use test keys for local development
- Preview: Use test keys for PR previews
- Production: Use live keys only

## Environment Scoping Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│ Environment │ Stripe Mode │ Webhook Target                     │
├─────────────────────────────────────────────────────────────────┤
│ Development │ Test        │ localhost via Stripe CLI           │
│ Preview     │ Test        │ https://<preview-url>.vercel.app   │
│ Production  │ Live        │ https://YOUR_DOMAIN                │
└─────────────────────────────────────────────────────────────────┘
```

**Local Development:**
- Uses `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Webhook secret from CLI output

**Preview Deployments:**
- Create a Test mode webhook for `*.vercel.app` domain (optional)
- Or test webhooks manually via Stripe CLI triggers

**Production:**
- Live mode webhook for custom domain
- All real payments processed

## Security Considerations

1. **Never commit secrets to git** - Use environment variables only
2. **Rotate compromised keys immediately** in Stripe Dashboard
3. **Use environment-specific keys** - Never use live keys in development
4. **Webhook signature verification** - Always verify `STRIPE_WEBHOOK_SECRET`
5. **PCI compliance** - Stripe.js handles card data, never touches your servers

## Troubleshooting

### "Invalid API key"
- Verify the key matches the mode (test vs live)
- Check for extra whitespace in environment variable

### "Webhook signature verification failed"
- Verify `STRIPE_WEBHOOK_SECRET` matches the endpoint
- Each webhook endpoint has its own secret
- CLI forwarding uses a different secret than Dashboard webhooks

### "Price not found"
- Verify price ID matches the mode (test vs live prices are different)
- Ensure products exist in the correct mode

---
*Last updated: 2026-01-19*
*Phase: 19-stripe-production-setup*
