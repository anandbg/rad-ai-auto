# Company Migration Runbook

**Purpose:** Recreate EVERY external service account under a new company identity. This is the exact sequence — no steps can be skipped, and order matters because later steps depend on credentials from earlier steps.

**Current state:** Everything runs under `anandbg@gmail.com` / `askdigital` personal accounts. After this runbook, everything will be under `<company>@gmail.com` / `<company>` accounts.

---

## Master credential table

Every API key, URL, and secret this app needs. Fill in the "New value" column as you complete each step.

| # | Variable | What it is | Where it comes from | Current owner | New value |
|---|----------|-----------|--------------------|----|-----------|
| 1 | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Step 4 | anandbg | __________ |
| 2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon JWT | Step 4 | anandbg | __________ |
| 3 | `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin JWT (server only) | Step 4 | anandbg | __________ |
| 4 | `OPENAI_API_KEY` | OpenAI fallback (server only) | Step 5 | anandbg | __________ |
| 5 | `GROQ_API_KEY` | Groq primary AI (server only) | Step 6 | anandbg | __________ |
| 6 | `STRIPE_SECRET_KEY` | Stripe server key `sk_live_...` | Step 8 | anandbg | __________ |
| 7 | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key `pk_live_...` | Step 8 | anandbg | __________ |
| 8 | `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing `whsec_...` | Step 12 | anandbg | __________ |
| 9 | `STRIPE_PRICE_ID_PLUS` | Stripe Plus tier price ID | Step 8 | anandbg | __________ |
| 10 | `STRIPE_PRICE_ID_PRO` | Stripe Pro tier price ID | Step 8 | anandbg | __________ |
| 11 | `NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID` | Same as #9 (exposed to frontend) | Step 8 | anandbg | __________ |
| 12 | `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | Same as #10 (exposed to frontend) | Step 8 | anandbg | __________ |
| 13 | `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint | Step 7 | anandbg | __________ |
| 14 | `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token | Step 7 | anandbg | __________ |
| 15 | `TRANSCRIBE_ENCRYPTION_KEY` | Audio encryption key (generate fresh) | Step 9 | anandbg | __________ |
| 16 | `TRANSCRIBE_STORAGE_BUCKET` | Supabase storage bucket name | Step 4 | hardcoded | `transcribe-audio` |
| 17 | `NEXT_PUBLIC_APP_URL` | Production app URL | Step 11 | — | `https://yourdomain` |
| 18 | `AI_DAILY_COST_CEILING` | Daily spend limit in USD | Your choice | — | `5` (default) |
| 19 | Google OAuth Client ID | For Supabase Google login | Step 3 | anandbg | __________ |
| 20 | Google OAuth Client Secret | For Supabase Google login | Step 3 | anandbg | __________ |

**Legacy vars (NOT used by code but still on Vercel — can delete):**
`OPENAI_MODEL_GENERATE`, `OPENAI_MODEL_WHISPER`, `OPENAI_REALTIME_MODEL`, `OPENAI_USE_JSON_SCHEMA`, `OPENAI_TEMPERATURE_MIN`, `OPENAI_TEMPERATURE_MAX`, `OPENAI_MAX_TOKENS_GENERATE`, `SUPABASE_ANON_KEY` (duplicate of `NEXT_PUBLIC_SUPABASE_ANON_KEY`), `VERCEL_URL` (auto-set by Vercel), `OPENAI_DAILY_COST_CEILING` (renamed to `AI_DAILY_COST_CEILING`).

---

## Step 1 — Create company Gmail (~5 min)

**Why first:** Every service below will be registered with this email.

1. Go to https://accounts.google.com/signup
2. Create: `<companyname>.dev@gmail.com` or similar
3. Enable 2FA immediately (Authenticator app)
4. Save the password in a password manager

**You now have:** `<company>@gmail.com` — use this for EVERY step below.

---

## Step 2 — Register UK Limited Company (£12, 1-3 days)

**Why:** Stripe live mode requires a verified business entity.

1. Go to https://www.gov.uk/limited-company-formation
2. Company name: `<Your Company Name> Ltd`
3. SIC code: `62012` (Business and domestic software development)
4. Director: your name, DOB, nationality, residential address
5. Registered office: your address OR a virtual office (~£10-£30/mo)
6. Shareholder: yourself, 1 ordinary share of £1

**You get:** Company number (8 digits), certificate of incorporation PDF.

**While waiting** for incorporation (if using DIY route), continue to Steps 3-7 — they don't need the company number.

---

## Step 3 — Google Cloud project for OAuth (~15 min, free)

**Why:** Supabase uses this for "Sign in with Google". You need a fresh project under the company Gmail.

1. Sign in to https://console.cloud.google.com with your Step 1 Gmail
2. Create new project: name `<companyname>-prod`
3. **APIs & Services → OAuth consent screen:**
   - User type: External
   - App name: your product name
   - User support email: your Step 1 Gmail
   - Authorized domains: add `supabase.co` (you'll add your own domain later)
   - Developer contact: your Step 1 Gmail
4. Add scopes: `email`, `profile`, `openid`
5. **Credentials → Create Credentials → OAuth client ID:**
   - Type: Web application
   - Name: `Production`
   - Authorized redirect URIs: **leave empty for now** — you'll add the Supabase callback URL after Step 4
6. Copy the **Client ID** and **Client Secret**

**You get:**
- `GOOGLE_OAUTH_CLIENT_ID` = `xxxx.apps.googleusercontent.com`
- `GOOGLE_OAUTH_CLIENT_SECRET` = `GOCSPX-xxxx`

**STOP — don't close this tab.** You'll come back to add the Supabase redirect URI in Step 4.

---

## Step 4 — Create new Supabase project (~15 min, free or $25/mo Pro)

**Why:** Database, auth, and file storage. New project = clean slate, company-owned.

1. Sign up at https://supabase.com with your Step 1 Gmail
2. Create organization: name `<companyname>`
3. Optionally upgrade to Pro ($25/mo) — see free-vs-paid note at bottom
4. Create project:
   - Name: `<companyname>-prod`
   - Region: `eu-west-2 (London)` or `eu-west-1 (Ireland)`
   - Database password: generate a strong one, save it

5. **Wait ~2 min for provisioning**, then go to **Settings → API** and copy:
   - Project URL → **credential #1** (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon` `public` key → **credential #2** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` `secret` key → **credential #3** (`SUPABASE_SERVICE_ROLE_KEY`)

6. **Apply database schema** — go to **SQL Editor**, paste the ENTIRE contents of:
   ```
   .planning/PRODUCTION-MIGRATION.sql
   ```
   This is all 9 migration files concatenated (1,128 lines). It creates:
   - `profiles` table with RLS
   - `templates` table with RLS (personal + global)
   - `macros` and `macro_categories` tables with RLS
   - `credits_ledger` for usage tracking
   - `user_preferences` (including list style prefs)
   - `stripe_webhook_events` for idempotency
   - `stripe_invoices` table
   - Profile trigger (auto-creates profile on auth signup)
   - All Row-Level Security policies
   - Backfill script for existing auth users

   Click **Run**. All statements should succeed. If any fail, fix and re-run that specific statement.

   **Alternative via CLI:**
   ```bash
   supabase link --project-ref <new-ref>
   supabase db push
   ```
   This applies all migrations from `app/supabase/migrations/` in order.

7. **Configure Google OAuth** — go to **Authentication → Providers → Google:**
   - Enable: ON
   - Client ID: paste from Step 3
   - Client Secret: paste from Step 3
   - **Copy the "Callback URL (for OAuth)" shown** — looks like `https://<ref>.supabase.co/auth/v1/callback`

8. **Go back to Google Cloud Console** (Step 3 tab) → **Credentials → edit your OAuth client:**
   - Add Authorized redirect URI: paste the callback URL from step 7
   - Save

9. **Authentication → URL Configuration:**
   - Site URL: `https://yourdomain` (or temporary Vercel URL until you have a domain)
   - Redirect URLs: add:
     ```
     http://localhost:3000/**
     https://yourdomain/**
     https://<vercel-preview-wildcard>/**
     ```

10. **Storage → New bucket:**
    - Name: `transcribe-audio`
    - Public: OFF (private)
    - File size limit: 25 MB
    - Allowed MIME types: `audio/*`

**You get:** Credentials #1, #2, #3 + working database + Google OAuth + storage bucket.

---

## Step 5 — OpenAI account (~5 min, pay-as-you-go)

**Why:** Fallback AI provider when Groq is down.

1. Sign up at https://platform.openai.com with Step 1 Gmail
2. Add payment method
3. Set usage limit: $50/mo (safety cap)
4. **API Keys → Create new secret key**

**You get:** Credential #4 (`OPENAI_API_KEY` = `sk-proj-xxxx`)

---

## Step 6 — Groq account (~5 min, pay-as-you-go)

**Why:** Primary AI provider for report generation (Llama 4 Scout) and transcription (Whisper v3 Turbo).

1. Sign up at https://console.groq.com with Step 1 Gmail
2. Add payment method (Developer tier for no rate-limit headaches)
3. **API Keys → Create Key**

**You get:** Credential #5 (`GROQ_API_KEY` = `gsk_xxxx`)

---

## Step 7 — Upstash Redis (~5 min, free)

**Why:** Rate limiting, daily cost tracking, and abuse detection. The code uses `@upstash/redis` REST API (not raw Redis protocol).

**What it powers in the codebase:**
- `lib/ratelimit/client.ts` → creates Redis client from these env vars
- `lib/ratelimit/limiters.ts` → sliding window rate limiters per user per endpoint
- `lib/cost/tracker.ts` → daily cost counter (INCRBY in cents)
- `lib/cost/ceiling.ts` → reads daily cost, applies degradation tiers
- `lib/abuse/detector.ts` → per-user hourly request counting

**If these vars are missing, the app still works** — all Redis usage is wrapped in fail-open checks. But you get NO rate limiting, NO cost ceiling, and NO abuse detection.

1. Sign up at https://upstash.com with Step 1 Gmail
2. **Create database:**
   - Name: `<companyname>-ratelimit`
   - Region: **EU-West-1** (Ireland) — close to your Supabase and Vercel
   - Type: Regional (not Global — cheaper, lower latency for single-region)
3. After creation, click on the database → **REST API** tab
4. Copy the **REST URL** and **REST Token** (NOT the Redis URL — the code uses the REST endpoint)

**You get:**
- Credential #13 (`UPSTASH_REDIS_REST_URL` = `https://xxxx.upstash.io`)
- Credential #14 (`UPSTASH_REDIS_REST_TOKEN` = `AXxxxx`)

---

## Step 8 — Stripe account (~20 min + 1-3 day verification)

**Why:** Subscription billing. Requires your UK Ltd from Step 2.

1. Sign up at https://stripe.com with Step 1 Gmail
2. Business type: **Company → Private corporation (UK)**
3. Fill in:
   - Legal name: your Ltd name from Step 2
   - Company number: 8-digit number from Step 2
   - Trading name: your product name
   - Registered address
   - Website: `https://yourdomain` (or placeholder)
   - Industry: Software / SaaS
   - Product description: "AI-assisted radiology report drafting tool"
4. Director details: name, DOB, address, upload ID
5. Bank details: sort code + account number (business account recommended)
6. Submit for verification (1-3 days)

**While waiting, in TEST MODE:**

7. **Products → Add product:**
   - Product 1: name `Plus`, pricing `Recurring`, `£XX/month` (your chosen price)
   - Product 2: name `Pro`, pricing `Recurring`, `£XX/month`
8. Note the **price IDs** for each (`price_1ABC...`)

**After verification, switch to LIVE MODE and repeat step 7 with real pricing.**

9. **Developers → API keys** (in live mode):
   - Copy Publishable key (`pk_live_...`)
   - Copy Secret key (`sk_live_...`)

**You get:**
- Credential #6 (`STRIPE_SECRET_KEY`)
- Credential #7 (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- Credential #9 (`STRIPE_PRICE_ID_PLUS`)
- Credential #10 (`STRIPE_PRICE_ID_PRO`)
- Credential #11 = same as #9
- Credential #12 = same as #10

Credential #8 (`STRIPE_WEBHOOK_SECRET`) comes from Step 12 after deploying.

---

## Step 9 — Generate encryption key (~1 min)

Run locally:
```bash
openssl rand -base64 32
```

**You get:** Credential #15 (`TRANSCRIBE_ENCRYPTION_KEY` = 44-char base64 string)

---

## Step 10 — Vercel project (~10 min, free Hobby or $20/mo Pro)

1. Sign up at https://vercel.com with Step 1 Gmail
2. **Optionally** create a team and upgrade to Pro ($20/seat/mo)
3. Connect your GitHub account (grant access to the repo)
4. **Import project** from GitHub → select `rad-ai-auto` repo
5. **CRITICAL: Set Root Directory to `app`** in the import wizard
6. Framework: Next.js (auto-detected)
7. Don't deploy yet — add env vars first

**Add ALL env vars (credentials #1-#18) to all 3 scopes.** Use the Vercel dashboard: **Settings → Environment Variables → Add**. For each variable, check all boxes: Production, Preview, Development.

| Variable | Value | Public? |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | from Step 4 | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Step 4 | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | from Step 4 | No |
| `OPENAI_API_KEY` | from Step 5 | No |
| `GROQ_API_KEY` | from Step 6 | No |
| `UPSTASH_REDIS_REST_URL` | from Step 7 | No |
| `UPSTASH_REDIS_REST_TOKEN` | from Step 7 | No |
| `STRIPE_SECRET_KEY` | from Step 8 | No |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | from Step 8 | Yes |
| `STRIPE_PRICE_ID_PLUS` | from Step 8 | No |
| `STRIPE_PRICE_ID_PRO` | from Step 8 | No |
| `NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID` | same as STRIPE_PRICE_ID_PLUS | Yes |
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | same as STRIPE_PRICE_ID_PRO | Yes |
| `TRANSCRIBE_ENCRYPTION_KEY` | from Step 9 | No |
| `TRANSCRIBE_STORAGE_BUCKET` | `transcribe-audio` | No |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain` | Yes |
| `AI_DAILY_COST_CEILING` | `5` | No |
| `STRIPE_WEBHOOK_SECRET` | **skip for now** — added in Step 12 | No |

---

## Step 11 — Deploy (~5 min)

From the Vercel dashboard, click **Deploy** (or use CLI):

```bash
cd app
vercel link --yes --project=<new-project-name> --scope=<new-team-slug>
vercel build --prod
vercel deploy --prebuilt --prod
```

**Connect custom domain** (if you have one from the launch plan):
1. Vercel project → Settings → Domains → Add `yourdomain`
2. Add DNS records at your registrar (Cloudflare etc)
3. Wait for SSL certificate (automatic)

---

## Step 12 — Wire Stripe webhook (~5 min)

**Now that the app is deployed and has a public URL:**

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://yourdomain/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click **Add endpoint** → copy the **Signing secret** (`whsec_...`)

**You get:** Credential #8 (`STRIPE_WEBHOOK_SECRET`)

5. Add `STRIPE_WEBHOOK_SECRET` to Vercel env vars (all 3 scopes)
6. **Redeploy** so the new env var takes effect:
   ```bash
   vercel build --prod && vercel deploy --prebuilt --prod
   ```

---

## Step 13 — Update Supabase auth URLs (~2 min)

Now that you have the final production URL:

1. Supabase → Authentication → URL Configuration
2. Site URL: `https://yourdomain`
3. Redirect URLs:
   ```
   http://localhost:3000/**
   https://yourdomain/**
   https://<vercel-project>-*-<team>.vercel.app/**
   ```

Or via CLI:
```bash
# Edit app/supabase/config.toml [auth] section with new URLs
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<new-client-id> \
  supabase config push --project-ref <new-ref> --yes
```

---

## Step 14 — Create admin user (~2 min)

1. Go to your live production URL
2. Sign up with `support@yourdomain` (or your company Gmail from Step 1)
3. In Supabase SQL editor, run:
   ```sql
   UPDATE profiles SET is_admin = true WHERE email = '<your-email>';
   ```
4. Refresh the app — you should now see the Admin section in the sidebar

---

## Step 15 — Smoke test checklist

Test each on the LIVE production URL:

- [ ] Landing page loads at `https://yourdomain`
- [ ] Sign up with email/password works
- [ ] Sign in with Google works (not redirecting to localhost)
- [ ] Dashboard loads after login
- [ ] Create a template
- [ ] Record audio → transcription returns text (Groq Whisper)
- [ ] Generate a report from transcription → streaming output (Groq Llama 4 Scout)
- [ ] Export PDF → downloads with correct branding
- [ ] Export Word → downloads
- [ ] Subscribe to Plus → Stripe checkout → returns to billing page
- [ ] Cancel subscription → status updates
- [ ] Admin panel accessible for admin user
- [ ] Terms page shows correct company name
- [ ] Privacy page shows correct contact email

---

## Database migration script

The combined SQL migration lives at:

```
.planning/PRODUCTION-MIGRATION.sql
```

**1,128 lines** covering all 9 migrations in order. Run this in the new Supabase project's SQL Editor, or use:

```bash
# Link to new project
supabase link --project-ref <new-project-ref>

# Apply all migrations
supabase db push
```

This creates the complete schema:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (auto-created on signup via trigger) |
| `templates` | Radiology report templates (personal + global) |
| `macros` | Text shortcut macros |
| `macro_categories` | Macro grouping categories |
| `credits_ledger` | Usage tracking (reports, transcriptions) |
| `user_preferences` | User settings (including list style prefs, terms acknowledged) |
| `stripe_webhook_events` | Idempotency tracking for webhook processing |
| `stripe_invoices` | Invoice records synced from Stripe |

Plus:
- Row-Level Security policies on all tables
- Profile auto-creation trigger on `auth.users` insert
- Indexes for common query patterns

---

## What I can do for you once you have the credentials

Once you fill in the "New value" column in the master table above, give me:
1. The new Supabase project ref
2. The new Vercel team slug and project name
3. Your chosen domain

I will then:
- Run the migration SQL against the new Supabase project
- Configure all Vercel env vars via the Management API
- Update `supabase/config.toml` with new Google OAuth credentials
- Update branding/email references in the 18 code files
- Build and deploy to the new Vercel project
- Wire the Stripe webhook
- Run the smoke test checklist

**You** must do Steps 1-3 and 5-8 yourself (account signups require your identity and payment method). I can do Steps 4 (Supabase schema), 7 (Upstash), 9-15 for you once you hand over the API keys.
