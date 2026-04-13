# Production Launch: 50 Users, Cost-Effective

**Total monthly cost: ~£10-25/month**
**One-time setup cost: ~£22**
**Setup time: ~3 hours active work + 1-3 days waiting for company registration and Stripe verification**

---

## What you're building

A live radiology report generation app at `https://yourdomain` where 50 radiologists can:
- Sign up with Google or email/password
- Dictate findings via voice → AI transcribes (Groq Whisper)
- Generate structured radiology reports → AI writes (Groq Llama 4 Scout)
- Export as PDF or Word
- Subscribe to Plus or Pro tiers via Stripe

---

## Monthly cost breakdown (50 users)

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| Supabase | **Free** | £0 | 500MB DB, needs keepalive cron (see Step 5) |
| Vercel | **Hobby (free)** | £0 | 100GB bandwidth, 60s function timeout |
| Groq | Pay-per-use | £5-15 | ~$0.0007/report, ~$0.0007/min transcription |
| OpenAI | Pay-per-use (fallback only) | £1-3 | Only charges when Groq is down |
| Upstash Redis | **Free** | £0 | 10K commands/day (enough for 50 users) |
| Stripe | Free + 1.5%+20p per txn | £0 fixed | Only pay when customers pay you |
| Domain | Annual | ~£1/mo | ~£10/year via Cloudflare |
| GitHub | **Free** | £0 | Private repo, up to 3 collaborators |
| **TOTAL** | | **£7-19/mo** | |

One-time: UK Ltd £12 + domain ~£10 = **~£22**

### What you DON'T need to pay for

| Service | Why free is fine for 50 users |
|---------|-------------------------------|
| Google Workspace (£4.60/mo) | Use free Gmail. Support emails in the app can be `yourcompany.ai@gmail.com` instead of `support@yourdomain`. Less professional but works |
| Supabase Pro ($25/mo) | Free tier handles 50 users easily. The auto-pause problem is solved by a keepalive cron (Step 5) |
| Vercel Pro ($20/mo) | Hobby handles 50 users. The 60s timeout means long transcriptions (>60s audio) may fail — tell users to keep recordings under 1 minute, or split recordings |
| Sentry ($0) | Free tier gives 5K errors/month — more than enough |

### Known limitations at 50 users on free tiers

| Limitation | Impact | Workaround |
|-----------|--------|------------|
| Supabase auto-pauses after 7 days idle | App goes down until unpaused | Keepalive cron job (Step 5) |
| Vercel 60s function timeout | Transcriptions of audio >60s may timeout | Cap audio at 60s in UI, or warn users |
| Groq free tier: 30 req/min | 5+ simultaneous users hit rate limits | Use Groq Developer tier (pay-per-use, no monthly fee) |
| Upstash 10K commands/day | ~3,300 page loads/day before hitting limit | Rate limiting silently disables (fail-open). Fine for 50 users |
| No daily backups (Supabase Free) | Data loss risk if Supabase has an incident | Export data monthly via Supabase dashboard |

---

## Complete setup guide (14 steps)

### Step 1 — Create company Gmail (5 min, free)

Every account below gets registered with this email.

1. https://accounts.google.com/signup
2. Name: `<yourcompanyname>.ai@gmail.com` or similar
3. Enable 2FA with authenticator app
4. Save password in a password manager

---

### Step 2 — Register UK Limited Company (£12, 1-3 days)

Required for Stripe to accept live payments.

1. Go to https://www.gov.uk/limited-company-formation
2. Fill in:
   - Company name: `<Your Name> Ltd`
   - SIC code: `62012` (Software development)
   - Director: your full name, DOB, nationality, home address
   - Registered office: your home address (or virtual office £10-30/mo)
   - 1 shareholder (yourself), 1 ordinary share of £1
3. Pay £12, submit
4. Wait 1-3 days for certificate of incorporation
5. Save: **company number** (8 digits) — needed for Stripe

**While waiting, do Steps 3-8 in parallel.**

---

### Step 3 — Google Cloud OAuth (15 min, free)

For "Sign in with Google" on your app.

1. Sign in to https://console.cloud.google.com with Step 1 Gmail
2. Create project: `<companyname>-prod`
3. **APIs & Services → OAuth consent screen:**
   - External user type
   - App name: your product name
   - Support email: Step 1 Gmail
   - Authorized domains: `supabase.co`
   - Developer contact: Step 1 Gmail
4. Add scopes: `email`, `profile`, `openid`
5. **Credentials → Create OAuth client ID:**
   - Type: Web application
   - Redirect URIs: **leave empty for now** (add Supabase URL in Step 4)
6. Save these two values:

```
GOOGLE_OAUTH_CLIENT_ID = ____________________________
GOOGLE_OAUTH_CLIENT_SECRET = ____________________________
```

---

### Step 4 — Create Supabase project (15 min, free)

1. Sign up at https://supabase.com with Step 1 Gmail
2. Create org: `<companyname>`
3. Create project:
   - Name: `<companyname>-prod`
   - Region: **EU West (London)** or **EU West (Ireland)**
   - Password: generate strong, save it
4. Wait 2 min for provisioning
5. Go to **Settings → API**, copy these three values:

```
NEXT_PUBLIC_SUPABASE_URL = ____________________________
NEXT_PUBLIC_SUPABASE_ANON_KEY = ____________________________
SUPABASE_SERVICE_ROLE_KEY = ____________________________
```

6. **Apply the database schema.** Go to **SQL Editor → New query**, paste the ENTIRE contents of this file and click Run:

```
File: .planning/PRODUCTION-MIGRATION.sql (1,128 lines)
```

This creates all tables (profiles, templates, macros, billing, etc.), Row-Level Security policies, triggers, and indexes. One paste, one click.

**Alternative via CLI:**
```bash
cd app
supabase link --project-ref <your-new-ref>
supabase db push
```

7. **Enable Google OAuth.** Go to **Authentication → Providers → Google:**
   - Toggle ON
   - Paste Client ID from Step 3
   - Paste Client Secret from Step 3
   - **Copy the callback URL shown** (looks like `https://xxxx.supabase.co/auth/v1/callback`)

8. **Go back to Google Cloud Console** (Step 3) → edit your OAuth client:
   - Add Authorized redirect URI: paste the callback URL from step 7
   - Save

9. **Auth URL config.** Go to **Authentication → URL Configuration:**
   - Site URL: `https://yourdomain` (or your Vercel URL temporarily)
   - Redirect URLs: add these four lines:
     ```
     http://localhost:3000/**
     https://yourdomain/**
     https://<your-vercel-project>-*.vercel.app/**
     ```

10. **Storage bucket.** Go to **Storage → New bucket:**
    - Name: `transcribe-audio`
    - Public: OFF
    - File size limit: 25 MB
    - MIME types: `audio/*`

---

### Step 5 — Supabase keepalive cron (5 min, free)

**This prevents Supabase Free from auto-pausing your database.**

The app already deploys on Vercel which supports cron jobs. Add this to `app/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/health",
      "schedule": "0 8 */5 * *"
    }
  ]
}
```

Then create the health endpoint. Create file `app/app/api/health/route.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET() {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
    );
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    return new Response(JSON.stringify({ ok: true, profiles: count }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
}
```

This pings the database every 5 days at 8am UTC. Supabase auto-pauses after 7 days of inactivity, so every-5-days keeps it alive.

**I can create this file for you right now — just say the word.**

---

### Step 6 — Groq account (5 min, pay-per-use)

1. Sign up at https://console.groq.com with Step 1 Gmail
2. **Settings → Billing** → add payment method → choose **Developer** tier
3. **API Keys → Create Key**

```
GROQ_API_KEY = ____________________________
```

Cost at 50 users: ~£5-15/month (reports at $0.0007 each, transcription at $0.0007/min).

---

### Step 7 — OpenAI account (5 min, pay-per-use)

Fallback only — charges when Groq is down.

1. Sign up at https://platform.openai.com with Step 1 Gmail
2. Add payment method
3. **Set hard usage limit: $20/mo** (Settings → Billing → Usage limits)
4. **API Keys → Create key**

```
OPENAI_API_KEY = ____________________________
```

---

### Step 8 — Upstash Redis (5 min, free)

Rate limiting + cost tracking + abuse detection.

1. Sign up at https://upstash.com with Step 1 Gmail
2. **Create Database:**
   - Name: `<companyname>-ratelimit`
   - Region: **EU-West-1 (Ireland)**
   - Type: **Regional**
3. Click on database → **REST API** tab → copy:

```
UPSTASH_REDIS_REST_URL = ____________________________
UPSTASH_REDIS_REST_TOKEN = ____________________________
```

If Upstash ever goes down: app keeps working, rate limiting silently disables (fail-open). No user impact.

---

### Step 9 — Stripe account (20 min + 1-3 day verification)

**Requires company number from Step 2.**

1. Sign up at https://stripe.com with Step 1 Gmail
2. Business type: **Company → Private corporation (UK)**
3. Fill in: company name, company number, registered address, director ID
4. Bank details for payouts (personal account is fine to start)
5. Submit for verification

**After verification, in LIVE mode:**

6. **Products → Add product:**
   - `Plus` — Recurring, £XX/month (your price)
   - `Pro` — Recurring, £XX/month (your price)
7. Copy the price IDs for each
8. **Developers → API keys:**

```
STRIPE_SECRET_KEY = ____________________________
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = ____________________________
STRIPE_PRICE_ID_PLUS = ____________________________
STRIPE_PRICE_ID_PRO = ____________________________
NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID = (same as STRIPE_PRICE_ID_PLUS)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID = (same as STRIPE_PRICE_ID_PRO)
```

`STRIPE_WEBHOOK_SECRET` comes from Step 13 after deploying.

---

### Step 10 — Generate encryption key (1 min)

Run in terminal:
```bash
openssl rand -base64 32
```

```
TRANSCRIBE_ENCRYPTION_KEY = ____________________________
```

---

### Step 11 — Register domain (~£10/year)

1. Go to https://dash.cloudflare.com → sign up with Step 1 Gmail
2. **Registrar → Register a domain** → search for your domain
3. Buy it (register in company name + address from Step 2)

---

### Step 12 — Deploy to Vercel (15 min, free)

1. Sign up at https://vercel.com with Step 1 Gmail
2. **Add New → Import Git Repository** → connect GitHub → select `rad-ai-auto`
3. **CRITICAL: Set Root Directory to `app`**
4. **Don't deploy yet** — go to Settings → Environment Variables first
5. Add EVERY variable from the credential sheet below (check all 3 boxes: Production, Preview, Development for each)
6. Now deploy. Or via CLI:

```bash
cd app
vercel link --yes
vercel build --prod
vercel deploy --prebuilt --prod
```

7. **Connect domain:** Settings → Domains → add your domain
8. Add DNS records in Cloudflare:
   - `A` record: `@` → `76.76.21.21`
   - `CNAME` record: `www` → `cname.vercel-dns.com`
9. Wait for SSL (automatic, 1-30 min)

---

### Step 13 — Wire Stripe webhook (5 min)

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://yourdomain/api/stripe/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
4. Copy signing secret:

```
STRIPE_WEBHOOK_SECRET = ____________________________
```

5. Add to Vercel env vars (all 3 scopes)
6. Redeploy: `vercel build --prod && vercel deploy --prebuilt --prod`

---

### Step 14 — Create admin + smoke test (15 min)

1. Sign up on your live URL with your company email
2. In Supabase SQL Editor:
   ```sql
   UPDATE profiles SET is_admin = true WHERE email = '<your-email>';
   ```
3. Test each flow:

| # | Test | Expected |
|---|------|----------|
| 1 | Visit `https://yourdomain` | Landing page loads |
| 2 | Sign up with email/password | Verification email arrives |
| 3 | Sign in with Google | Lands on `/dashboard`, NOT localhost |
| 4 | Record 30s audio | Groq Whisper transcribes it |
| 5 | Generate report | Streaming Llama 4 Scout output |
| 6 | Export PDF | Downloads with correct header/footer |
| 7 | Export Word | Downloads |
| 8 | Subscribe to Plus | Stripe checkout → return to billing |
| 9 | Admin panel | Visible in sidebar, users listed |
| 10 | Terms page | Shows your company name, not placeholders |

---

## Complete credential sheet

Print this. Fill in each value as you complete the steps. Hand it to me and I'll wire everything up.

```
=== SUPABASE (Step 4) ===
NEXT_PUBLIC_SUPABASE_URL      = ____________________________
NEXT_PUBLIC_SUPABASE_ANON_KEY = ____________________________
SUPABASE_SERVICE_ROLE_KEY     = ____________________________

=== GOOGLE OAUTH (Step 3 → plugged into Supabase Step 4) ===
GOOGLE_OAUTH_CLIENT_ID        = ____________________________
GOOGLE_OAUTH_CLIENT_SECRET    = ____________________________

=== GROQ (Step 6) ===
GROQ_API_KEY                  = ____________________________

=== OPENAI (Step 7) ===
OPENAI_API_KEY                = ____________________________

=== UPSTASH (Step 8) ===
UPSTASH_REDIS_REST_URL        = ____________________________
UPSTASH_REDIS_REST_TOKEN      = ____________________________

=== STRIPE (Step 9) ===
STRIPE_SECRET_KEY             = ____________________________
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = ______________________
STRIPE_PRICE_ID_PLUS          = ____________________________
STRIPE_PRICE_ID_PRO           = ____________________________
NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID = (same as STRIPE_PRICE_ID_PLUS)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID  = (same as STRIPE_PRICE_ID_PRO)
STRIPE_WEBHOOK_SECRET         = ____________________________ (Step 13)

=== ENCRYPTION (Step 10) ===
TRANSCRIBE_ENCRYPTION_KEY     = ____________________________

=== APP CONFIG ===
TRANSCRIBE_STORAGE_BUCKET     = transcribe-audio
NEXT_PUBLIC_APP_URL           = https://yourdomain
AI_DAILY_COST_CEILING         = 5

=== COMPANY INFO (for code branding) ===
Trading name                  = ____________________________
Legal company name (Ltd)      = ____________________________
Company number                = ____________________________
Domain                        = ____________________________
Support email                 = ____________________________
```

---

## What I do once you hand me the credentials

1. Update `app/supabase/config.toml` with new Google OAuth + auth URLs
2. Find/replace company name in 18 code files (terms, privacy, exports, layout, landing page)
3. Update billing page with your GBP pricing
4. Create the keepalive cron endpoint (Step 5)
5. Configure all Vercel env vars via API
6. Build and deploy
7. Wire Stripe webhook
8. Run the smoke test checklist
9. Create your admin user

**Estimated time once I have credentials: ~30 minutes.**

---

## Upgrade path when you outgrow free tiers

| Trigger | Action | New cost |
|---------|--------|----------|
| >50 users or you want backups | Supabase Pro | +$25/mo |
| Need team seats or 120s timeout | Vercel Pro | +$20/mo |
| >10K Redis commands/day | Upstash pay-as-you-go | +$0.20/100K commands |
| Want `support@yourdomain` email | Google Workspace | +£4.60/mo |
| Want error tracking | Sentry (free 5K/mo) | +£0 |

You can upgrade each independently. Nothing in the code changes — just billing tier.
