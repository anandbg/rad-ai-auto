# Production Launch Plan

**Goal:** Move every cloud service, credential, and account from your personal name to a properly registered UK Ltd company. This document is the complete checklist — execute in the order presented. Each step lists what you need to provide as input and what you get out.

**Status:** Not started
**Estimated time:** 2 working days of active work, plus 1-3 days waiting for things like company registration and Stripe verification.

---

## Phase 0 — Decisions you must make first

These cascade through everything below. Lock them in before touching any service.

| # | Decision | Notes / examples |
|---|----------|------------------|
| 0.1 | **Trading name** of the product | The name that appears in the UI, on bills, on your website. Today the code says "AI Radiologist" with placeholder `airad.io`. You can keep that or rebrand. |
| 0.2 | **Legal company name** | UK Ltd needs a unique registered name. Often `<TradingName> Ltd` or `<TradingName> Technologies Ltd`. Check availability at [find-and-update.company-information.service.gov.uk](https://find-and-update.company-information.service.gov.uk). |
| 0.3 | **Primary domain** | e.g. `airad.io`, `radassist.ai`, `radassistant.co.uk`. Check availability via your registrar. Cost: ~£8-£40/yr. |
| 0.4 | **Support / contact email scheme** | Standard pattern: `support@yourdomain`, `legal@yourdomain`, `privacy@yourdomain`, `billing@yourdomain`, `noreply@yourdomain`. All can route to one inbox initially. |
| 0.5 | **Company registered address** | Must be a real UK address. Options: home address, virtual office (~£10-£30/mo from providers like Hoxton Mix, Companies Made Simple), or accountant's address. This becomes public on Companies House. |
| 0.6 | **Director(s)** | Yourself at minimum. Need DOB, full name, nationality, occupation. |
| 0.7 | **Subscription pricing** | The code already references Stripe price IDs `STRIPE_PRICE_ID_PLUS` and `STRIPE_PRICE_ID_PRO`, so you're committing to a 2-tier model. Decide the £/month for each before creating Stripe products. Suggested starting point: Plus £29/mo, Pro £79/mo (you can change later). |
| 0.8 | **VAT registration?** | Not required until you cross £90,000/yr UK turnover. Skip initially unless you have a specific reason (some B2B customers prefer to deal with VAT-registered suppliers). |

---

## Phase 1 — Identity foundation (do this first, in this order)

Everything downstream depends on these. Complete in sequence.

### Step 1.1 — Personal Gmail for company bootstrap (~10 min, free)

You need a clean Gmail to register the UK Ltd and act as the recovery address for everything until you have a proper company email. Do NOT reuse your personal `anandbg@gmail.com`.

**What to do:**
1. Sign up for a new Gmail at [accounts.google.com/signup](https://accounts.google.com/signup)
2. Suggested name: `<companyname>.founder@gmail.com` or `<yourname>.<company>@gmail.com`
3. Enable 2FA immediately (Authenticator app, not SMS)
4. Set this as the recovery email for itself with your phone number

**What you get out:** `<bootstrap>@gmail.com` — used to register every service in Phase 2 until your company domain email is live.

### Step 1.2 — Register the UK Limited Company (1-3 days, £12-£100)

**What to do:**
- **DIY (£12, 24h):** Register at [gov.uk/limited-company-formation](https://www.gov.uk/limited-company-formation). Need: company name (0.2), registered office (0.5), at least 1 director (0.6), at least 1 shareholder (can be the same person), SIC code (use **62012** "Business and domestic software development" or **62020** "Information technology consultancy activities").
- **Formation agent (£50-£150, same day):** Companies Made Simple, 1st Formations, or Rapid Formations. Worth it if you want a virtual office address bundled.

**Information you'll need:**
- Company name (decision 0.2)
- Registered office address (decision 0.5)
- Director: full name, DOB, nationality, occupation, residential address (kept private from public register if you use a virtual office)
- Shareholder details (same as director if it's just you)
- 3 personal identifiers per officer: town of birth, mother's maiden name, eye colour, etc. (Companies House anti-fraud check)

**What you get out:**
- Company number (8 digits, e.g. `12345678`)
- Certificate of incorporation (PDF)
- Memorandum and articles of association
- Authentication code for Companies House
- **You'll need the company number and registered address for Stripe verification (Step 2.8) and for the legal pages in your app.**

### Step 1.3 — Business bank account (1-7 days, free)

Required for Stripe payouts. Skip the high street banks; use a fintech for instant approval:

| Bank | Approval time | Notes |
|------|---------------|-------|
| **Starling Business** | Same day | Best UX, free, UK-based, full UK accounts |
| **Tide** | 1-2 days | Free tier, integrates with accounting software |
| **Wise Business** | Same day | Multi-currency, good for international SaaS |

**Information you'll need:**
- Company number from Step 1.2
- Director ID (passport or driving licence)
- Proof of address for director
- Selfie / video verification

**What you get out:** Business sort code + account number — required for Stripe payouts in Step 2.8.

### Step 1.4 — Domain registration (~10 min, ~£10-£40/yr)

**Recommended registrar:** [Cloudflare Registrar](https://dash.cloudflare.com/?to=/:account/registrar) — at-cost pricing, free DNS, free WHOIS privacy. Avoid GoDaddy/123-reg/Namecheap if you can.

**What to do:**
1. Sign up to Cloudflare with your bootstrap Gmail (Step 1.1)
2. Search for your domain (decision 0.3) — buy the `.com`, `.io`, `.co.uk`, or `.ai` variant
3. Enable DNSSEC and WHOIS privacy
4. Register the domain in the **company name and address** (Step 1.2) — important for legal ownership

**What you get out:** Registered domain — the foundation for company email and the production app URL.

### Step 1.5 — Company email via Google Workspace (~30 min, £4.60/user/mo)

Free Gmail can't host `you@yourcompany.com` mail. You need either:
- **Google Workspace Business Starter — £4.60/user/mo** (recommended; 30GB, custom email, Drive, Meet)
- **Microsoft 365 Business Basic — £4.90/user/mo**
- **Zoho Mail Free** — free for up to 5 users with `mail.zoho.com`, but UX is worse and slows things down

**What to do (Google Workspace):**
1. Go to [workspace.google.com](https://workspace.google.com), click "Get started"
2. Enter business name (1.2 legal name), region (UK), employees (Just me)
3. Enter your domain from Step 1.4
4. Verify domain ownership by adding a TXT record in Cloudflare DNS
5. Create the first user: `support@yourdomain` (this becomes the master account)
6. Create aliases (free, no extra users): `legal@`, `privacy@`, `billing@`, `noreply@` all forwarding to `support@`
7. Set up MX records in Cloudflare (Workspace shows you exactly what to add)
8. Enable 2FA on the new account immediately

**Information you'll need:** Company name and address from 1.2; domain from 1.4.

**What you get out:** `support@yourdomain` mailbox — **from this point on, register every new account in Phase 2 with this email, NOT the bootstrap Gmail.**

---

## Phase 2 — Cloud service accounts (do these in any order, all under company email)

For every service below: sign up with `support@yourdomain`, enable 2FA, save credentials in a password manager (1Password, Bitwarden, or Apple Keychain).

### Step 2.1 — Google Cloud project for OAuth (~30 min, free)

Used by Supabase Auth to enable "Sign in with Google".

**What to do:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com), sign in with `support@yourdomain`
2. Create a new project: name `<companyname>-prod`
3. Navigate to **APIs & Services → OAuth consent screen**
4. Choose **External** user type (so any Google user can sign up)
5. Fill in:
   - App name: your trading name (decision 0.1)
   - User support email: `support@yourdomain`
   - App logo: 120x120 PNG (you'll need this — can be a temporary placeholder)
   - App home page: `https://yourdomain`
   - App privacy policy link: `https://yourdomain/privacy`
   - App terms of service link: `https://yourdomain/terms`
   - Authorized domains: `yourdomain` and `supabase.co`
   - Developer contact: `support@yourdomain`
6. Add scopes: `email`, `profile`, `openid` (the basics for Sign in with Google)
7. Submit for verification — Google needs to verify the app for production OAuth (typically 1-5 days, usually approved if domain ownership is provable). Until verified, you can still test with up to 100 users in test mode.
8. Go to **Credentials → Create Credentials → OAuth client ID**
9. Application type: **Web application**
10. Authorized JavaScript origins: `https://yourdomain`, `https://www.yourdomain`
11. Authorized redirect URIs: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback` (you'll get this in Step 2.2 — come back and add it)
12. Save the **Client ID** and **Client Secret**

**What you get out:**
- `GOOGLE_OAUTH_CLIENT_ID` — public, looks like `123456789-abc.apps.googleusercontent.com`
- `GOOGLE_OAUTH_CLIENT_SECRET` — private, looks like `GOCSPX-abc123`

**You will plug these into Supabase in Step 2.2.**

### Step 2.2 — Supabase Pro project (~20 min, $25/mo = ~£20/mo)

The Pro plan is required for production: 8GB database, 100GB egress, daily backups, no auto-pause.

**What to do:**
1. Sign up at [supabase.com](https://supabase.com) with `support@yourdomain`
2. Create a new organization: name `<companyname>`, type **Company**
3. Upgrade the org to **Pro plan** ($25/mo). Fill in:
   - Billing email: `billing@yourdomain`
   - Tax ID: leave blank unless VAT-registered
   - Card details (use your business bank card from Step 1.3)
4. Create a new project: name `<companyname>-prod`, region **eu-west-2 (London)** or **eu-west-1 (Ireland)** for UK users, set a strong DB password (save it)
5. Wait ~2 minutes for the project to provision
6. Go to **Settings → API** and copy:
   - **Project URL** (`https://<ref>.supabase.co`)
   - **anon public key** (long JWT)
   - **service_role secret key** (long JWT — keep secret)
7. Go to **Authentication → Providers → Google**, paste the Client ID and Client Secret from Step 2.1, and **copy the callback URL Supabase shows** — go back to Step 2.1 step 11 and add this URL to Google's allowed redirect URIs
8. Go to **Authentication → URL Configuration**:
   - Site URL: `https://yourdomain`
   - Redirect URLs: add `https://yourdomain/**`, `https://yourdomain/api/auth/callback`, `http://localhost:3000/**` (for local dev)
9. Apply database migrations from `app/supabase/migrations/` — either via the Supabase CLI (`supabase db push --project-ref <ref>`) or by running each `.sql` file manually in the SQL editor in order
10. Create the storage bucket: **Storage → New bucket → name `transcribe-audio`**, set as **Private**, file size limit 25 MB, allowed MIME types `audio/*`. Add the lifecycle rule from `app/supabase/config.toml` to auto-delete files after 5 minutes

**What you get out:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TRANSCRIBE_STORAGE_BUCKET=transcribe-audio`

### Step 2.3 — Generate transcribe encryption key (~1 min)

The transcribe route encrypts audio files in Supabase Storage with a symmetric key.

**What to do:**
```bash
openssl rand -base64 32
```

**What you get out:** `TRANSCRIBE_ENCRYPTION_KEY` — a 44-character base64 string. Store in your password manager AND in Vercel env vars in Step 4.2.

### Step 2.4 — Groq account (~10 min, pay-as-you-go)

**What to do:**
1. Sign up at [console.groq.com](https://console.groq.com) with `support@yourdomain`
2. Click **Settings → Billing**, add a payment method, choose **Developer Tier** (paid, no rate-limit headaches like the free tier)
3. Go to **API Keys → Create Key**, name `production-vercel`
4. Save the key (starts with `gsk_`)

**What you get out:** `GROQ_API_KEY`

**Cost:** Llama 4 Scout = $0.11 / $0.34 per million tokens. Whisper v3 Turbo = $0.04/hr. At your projected scale (200 users), expect $5-30/month.

### Step 2.5 — OpenAI account for fallback (~10 min, pay-as-you-go)

Even though Groq is primary, OpenAI is the documented fallback in `app/lib/ai/fallback.ts`. Don't skip this — fallbacks are how you survive Groq outages (research showed they had 30+ outages in 5 months).

**What to do:**
1. Sign up at [platform.openai.com](https://platform.openai.com) with `support@yourdomain`
2. Add payment method, set a hard usage limit (e.g. $50/mo) under **Settings → Billing → Usage limits** so a fallback storm can't bankrupt you
3. **API Keys → Create new secret key**, restrict to `gpt-4o` and `whisper-1` only (least-privilege)
4. Save the key (starts with `sk-proj-`)

**What you get out:** `OPENAI_API_KEY`

### Step 2.6 — Upstash Redis (~10 min, free tier sufficient initially)

Used for rate limiting, cost ceiling tracking, and abuse detection. The free tier (10K commands/day) is fine for <100 active users. Upgrade to Pay-as-you-go ($0.20 per 100K commands) when you grow.

**What to do:**
1. Sign up at [upstash.com](https://upstash.com) with `support@yourdomain`
2. Create a **Redis database**: name `<companyname>-prod-rate-limit`, region **EU (London)** or **EU (Ireland)** to match Supabase
3. Choose **Pay-as-you-go** (free tier auto-included)
4. Copy the **REST API** credentials (NOT the Redis URL — the REST endpoint is what the code uses)

**What you get out:**
- `UPSTASH_REDIS_REST_URL` — `https://xxxxx.upstash.io`
- `UPSTASH_REDIS_REST_TOKEN`

### Step 2.7 — Vercel Pro team (~10 min, $20/user/mo)

Hobby tier won't work in production for these reasons:
- Preview deploys are SSO-protected (private) — your customers can't preview
- No team collaboration if you ever add one teammate
- Function timeouts cap at 60s on Hobby; transcribe needs 120s
- Lower bandwidth allowance

**What to do:**
1. Go to [vercel.com](https://vercel.com), sign in with `support@yourdomain`
2. Create a new team: name `<companyname>`, plan **Pro** ($20/seat/mo)
3. Billing: `billing@yourdomain`, business address from 1.5
4. Connect your GitHub account to Vercel (you'll need to grant access to the `rad-ai-auto` repo — or create a new private repo under a company GitHub org first; see Step 2.10)
5. Don't import the project yet — we do that in Phase 4

**What you get out:** Vercel Pro team, ready to host the app.

### Step 2.8 — Stripe account (~30 min setup + 1-3 days verification, pay-per-transaction)

**Critical note:** Stripe needs your UK Ltd company details. Complete Step 1.2 first.

**What to do:**
1. Sign up at [stripe.com](https://stripe.com) with `support@yourdomain`
2. Choose business location: **United Kingdom**
3. Business type: **Company → Private corporation** (UK Ltd)
4. **Business details to fill in:**
   - Legal business name (1.2)
   - Doing business as / trading name (0.1)
   - Company number (1.2 — 8 digits)
   - Registered address (1.5)
   - Industry: **Software / SaaS**
   - Website: `https://yourdomain`
   - Product description: 1-2 sentences about what the app does (e.g., "AI-assisted radiology report drafting tool for medical professionals")
   - Average transaction amount: ~£30
   - Average monthly volume estimate: ~£500-£5000 to start
5. **Director / representative:**
   - Name, DOB, home address, ID document (passport/driving licence)
   - You'll need to upload a photo of your ID
6. **Beneficial owners:** anyone owning ≥25% of the company (probably just you)
7. **Bank for payouts:** sort code + account number from Step 1.3
8. **Tax info:** UK VAT number if you have one (skip if you decided no in 0.8)
9. Submit for review — Stripe usually verifies within 1-3 days
10. While waiting, you can still create products in **test mode**

**Once verified, in LIVE mode:**
1. Go to **Products → Add product**:
   - Product 1: **Plus**, recurring £29/mo (or your decision from 0.7), tax behavior **Inclusive** (UK practice)
   - Product 2: **Pro**, recurring £79/mo
2. Note the price IDs (`price_1ABC...` for each)
3. Get your API keys from **Developers → API keys**:
   - **Publishable key** (`pk_live_...`) — safe to expose in frontend
   - **Secret key** (`sk_live_...`) — keep secret, server-side only
4. Set up the webhook endpoint (you'll do this AFTER deploying to Vercel in Step 4.4)

**What you get out:**
- `STRIPE_SECRET_KEY` (`sk_live_...`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_...`)
- `STRIPE_PRICE_ID_PLUS` (`price_...`)
- `STRIPE_PRICE_ID_PRO` (`price_...`)
- `NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID` (same as STRIPE_PRICE_ID_PLUS, exposed to frontend for the pricing page)
- `STRIPE_WEBHOOK_SECRET` — created in Step 4.4

### Step 2.9 — Sentry error tracking (~15 min, free tier 5K errors/mo)

Not currently in the codebase but **strongly recommended** before going live with paying customers. Without it, you won't know when production breaks.

**What to do:**
1. Sign up at [sentry.io](https://sentry.io) with `support@yourdomain`
2. Create a project: platform **Next.js**
3. Save the DSN
4. (Phase 5) Install `@sentry/nextjs`, run `npx @sentry/wizard@latest -i nextjs`, commit the result

**What you get out:** `SENTRY_DSN` — to be added in Phase 5.

### Step 2.10 — GitHub organization (~10 min, free)

Currently the repo is at `github.com/anandbg/rad-ai-auto` under your personal account. For company ownership:

**What to do:**
1. Go to [github.com/account/organizations/new](https://github.com/account/organizations/new) signed in as your personal account
2. Choose **Free plan**
3. Organization name: `<companyname>` (lowercase, no spaces)
4. Contact email: `support@yourdomain`
5. Belongs to: **A business or institution**, type the legal name from 1.2
6. After creation, transfer the `rad-ai-auto` repo: from the old repo, **Settings → Transfer ownership → enter org name**
7. Re-link Vercel to the new repo location after transfer

**What you get out:** Repo at `github.com/<companyname>/rad-ai-auto`. Vercel auto-redirects but you should reconnect.

---

## Phase 3 — Branding and code updates (~1-2 hours, code changes)

Once you have the company name and domain locked, find/replace these in code.

### Step 3.1 — Find/replace placeholders

**18 files** reference `airad`, `AI Radiologist`, or `airad.io`. Update them to your trading name and domain. Key files:

| File | What to change |
|------|---------------|
| `app/app/privacy/page.tsx` | `privacy@airad.io` → `privacy@yourdomain`, company name in disclaimers |
| `app/app/terms/page.tsx` | `legal@airad.io` → `legal@yourdomain`, **company name + registered address + company number** in legal entity placeholder |
| `app/components/landing/landing-page.tsx` | App name, hero tagline, footer |
| `app/app/layout.tsx` | `<title>` and OG metadata |
| `app/components/layout/sidebar.tsx` | Sidebar branding |
| `app/lib/export/pdf-generator.ts` | PDF export header/footer |
| `app/lib/export/word-generator.ts` | Word export header/footer |
| `app/.env.example` | Update the example URLs |

The terms and privacy pages have explicit `[Company Legal Name]` placeholders left in v1.4. **Replace those with your actual UK Ltd registered name and company number** — failing to do this leaves you legally exposed.

### Step 3.2 — Logo and brand assets

You need:
- **Favicon:** `app/app/favicon.ico` (32x32 ICO)
- **Logo SVG:** `app/public/logo.svg` (or wherever the existing one is — search for current logo references)
- **Open Graph image:** `app/public/og-image.png` (1200x630, PNG, used by social shares)
- **Google OAuth consent screen logo:** 120x120 PNG (uploaded in Step 2.1)
- **Apple touch icon:** `app/public/apple-touch-icon.png` (180x180 PNG)

If you don't have a logo yet, you can ship with a placeholder (SVG of a stethoscope or similar) and update later. Don't let logo design block launch.

### Step 3.3 — Pricing page sync

`app/app/(protected)/billing/page.tsx` reads `NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID` and `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` from env. Make sure the displayed prices in the UI match what you set in Stripe (Step 2.8). Hardcoded prices in the marketing copy (landing page, billing page) should be updated to match the real Stripe prices.

### Step 3.4 — Update CLAUDE.md and Supabase config.toml

`app/supabase/config.toml` currently has the OLD Supabase project's Google OAuth client ID hardcoded (`370409810617-...`). Replace with the NEW client ID from Step 2.1, OR remove it and rely on the env-var pattern:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
```

Update the hardcoded Vercel team ID and Supabase project ref in `CLAUDE.md` "Vercel Deployment Playbook" section to the new prod values.

---

## Phase 4 — Deploy and configure production (~1-2 hours)

### Step 4.1 — Create Vercel project

```bash
cd app
vercel link --yes --project=<companyname>-prod --scope=<vercel-team-slug>
vercel pull --yes --environment production
```

### Step 4.2 — Add ALL environment variables to Vercel

For each variable below, add to **all 3 scopes** (`production`, `preview`, `development`) using the Management API curl pattern documented in `CLAUDE.md`. Don't use `vercel env add` interactively — it forces per-scope prompting that wastes time.

**Required variables (production):**

| Variable | Source | Notes |
|----------|--------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain` | Public site URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Step 2.2 | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Step 2.2 | Public, JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | Step 2.2 | Server-only secret |
| `GROQ_API_KEY` | Step 2.4 | Server-only |
| `OPENAI_API_KEY` | Step 2.5 | Server-only |
| `UPSTASH_REDIS_REST_URL` | Step 2.6 | Server-only |
| `UPSTASH_REDIS_REST_TOKEN` | Step 2.6 | Server-only |
| `STRIPE_SECRET_KEY` | Step 2.8 | Server-only `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Step 4.4 | Server-only, set after webhook is registered |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Step 2.8 | Public `pk_live_...` |
| `STRIPE_PRICE_ID_PLUS` | Step 2.8 | Server-side reference |
| `NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID` | Step 2.8 | Same value as above, public |
| `STRIPE_PRICE_ID_PRO` | Step 2.8 | Server-side reference |
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | Step 2.8 | Same value as above, public |
| `TRANSCRIBE_ENCRYPTION_KEY` | Step 2.3 | Server-only |
| `TRANSCRIBE_STORAGE_BUCKET` | `transcribe-audio` | Hardcoded value |
| `AI_DAILY_COST_CEILING` | `5` (or your choice) | Optional, USD per day |
| `SENTRY_DSN` | Step 2.9 | Optional, recommended |

### Step 4.3 — First production deploy

```bash
cd app
vercel build --prod
vercel deploy --prebuilt --prod
```

This deploys the prebuilt output as the production deployment. Use `--prebuilt` per the CLAUDE.md playbook (remote builds have failed silently in the past).

### Step 4.4 — Wire the Stripe webhook

1. Go to Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://yourdomain/api/stripe/webhook`
3. Listen to events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`, `checkout.session.completed`
4. Save → copy the **Signing secret** (`whsec_...`)
5. Add `STRIPE_WEBHOOK_SECRET` to Vercel env vars (all 3 scopes)
6. Redeploy: `vercel build --prod && vercel deploy --prebuilt --prod`
7. Test by sending a test event from Stripe Dashboard → Webhooks → your endpoint → Send test webhook → `checkout.session.completed`

### Step 4.5 — Connect custom domain

1. In Vercel project → **Settings → Domains → Add**
2. Enter `yourdomain` (apex) and `www.yourdomain`
3. Vercel shows DNS records to add — go to Cloudflare DNS and add them:
   - `A` record for `@` → `76.76.21.21`
   - `CNAME` record for `www` → `cname.vercel-dns.com`
4. Wait 1-30 min for DNS to propagate
5. Vercel auto-issues SSL certificate via Let's Encrypt

### Step 4.6 — Update Supabase auth URLs to production domain

Once your domain resolves, go back to **Supabase → Authentication → URL Configuration** and update:
- Site URL: `https://yourdomain`
- Redirect URLs: `https://yourdomain/**`, `https://www.yourdomain/**`, plus any preview URL wildcards if you want to keep using preview deploys

---

## Phase 5 — Pre-launch checklist (~2 hours)

Don't skip these. Each one has caused problems for live businesses.

### Step 5.1 — Smoke test the full user journey

On the live production URL, complete these:
1. ✅ Sign up with Google → land on dashboard
2. ✅ Sign up with email/password → email verification works → land on dashboard
3. ✅ Create a template
4. ✅ Record audio → transcription returns text
5. ✅ Generate a report → streaming works → real Llama 4 Scout output appears
6. ✅ Export PDF and Word → both download with correct branding
7. ✅ Subscribe to Plus tier → Stripe checkout works → returned to billing page → subscription shows active
8. ✅ Subscribe to Pro tier (with a different test email) → same flow
9. ✅ Cancel subscription → status updates → user retains access until period end
10. ✅ Failed payment retry (use Stripe test card `4000 0000 0000 0341`)
11. ✅ Acknowledge T&Cs modal on first login

### Step 5.2 — Cost ceiling and abuse limits sanity check

- `AI_DAILY_COST_CEILING` is set sensibly (£5-£10 to start; you can raise as users grow)
- Manually test the rate limiter by hammering `/api/generate` from a script — should rate-limit after the configured threshold
- Manually verify Stripe webhook signature validation by sending an unsigned request — should reject

### Step 5.3 — Legal pages are publicly accessible

- `https://yourdomain/terms` → loads, contains the real company name and registered address
- `https://yourdomain/privacy` → loads, contains real contact email
- Sign-up page checkbox links to both work

### Step 5.4 — Backups configured

- Supabase Pro auto-backs up daily; verify the backup setting is on under **Database → Backups**
- Set a calendar reminder to test restore quarterly

### Step 5.5 — Monitoring alerts

- Sentry: set up an alert rule for any error to email `support@yourdomain` (Step 2.9)
- Stripe: enable email alerts for failed payments and disputes
- Vercel: enable email alerts for deployment failures and 5xx spikes
- Supabase: set a reminder to check the **Reports** tab weekly for slow queries

### Step 5.6 — Rotate any credentials that have been shared

- The Groq API key you pasted in this Claude chat earlier MUST be rotated before production. The new company-account key from Step 2.4 supersedes it.
- Any other key that was ever in a chat, an email, or a screenshot — rotate it.

---

## Phase 6 — Go live and announce

After everything in Phase 5 passes:

1. **Create your founding admin user** by signing up on production with `support@yourdomain` and then manually setting `is_admin=true` in the Supabase `profiles` table via the SQL editor
2. **Soft-launch to 5-10 beta users** before any public announcement — invite radiologists you know personally
3. **Watch Sentry, Vercel logs, and Supabase logs daily for the first week**
4. **Publish to your channels** (LinkedIn, RSNA forums, radiology subreddits) only after the soft launch period is bug-free

---

## Cost estimate (monthly, after launch)

| Service | Plan | Monthly cost (GBP) |
|---------|------|-------------------|
| Domain | Cloudflare Registrar | ~£1 (annual ~£10) |
| Google Workspace | Business Starter, 1 user | £4.60 |
| Supabase | Pro | £20 |
| Vercel | Pro, 1 seat | £16 |
| Upstash Redis | Free → Pay-as-you-go (~£2 at 200 users) | £0-2 |
| Groq | Pay-per-use | £5-20 |
| OpenAI | Fallback only | £1-5 |
| Stripe | 1.5% + 20p per UK transaction | revenue-dependent |
| Sentry | Free tier | £0 |
| Virtual office (optional) | Hoxton Mix | £15 |
| **Fixed total before usage** | | **~£62-£82/mo** |

Plus one-off:
| Item | Cost |
|------|------|
| UK Ltd registration | £12 (DIY) or £50-£150 (formation agent) |
| Domain (annual) | £10-£40 |
| Logo design (optional) | £0-£500 (Fiverr to professional) |

---

## Information you need to gather BEFORE starting Phase 1

Print this list and fill it in. Once you have all of these, Phase 1-2 takes ~half a day of active work.

```
[ ] Trading name ............... ___________________________
[ ] Legal company name (Ltd) ... ___________________________
[ ] Domain ..................... ___________________________
[ ] Registered office address .. ___________________________
[ ] Director full name ......... ___________________________
[ ] Director DOB ............... ___________________________
[ ] Director nationality ....... ___________________________
[ ] Director home address ...... ___________________________
[ ] Director ID document ....... [ ] Passport [ ] Driving licence
[ ] Plus tier price (£/mo) ..... ___________________________
[ ] Pro tier price (£/mo) ...... ___________________________
[ ] Bootstrap Gmail ............ ___________________________
[ ] Business bank account ...... [ ] Starling [ ] Tide [ ] Wise
```

---

## What I can do for you vs what only you can do

**I can do (after you give me credentials):**
- Update all code references to the new company name and domain
- Migrate Supabase schema to the new project
- Create Stripe products via API
- Configure Vercel project, env vars, and deploys
- Run smoke tests via curl/playwright
- Apply the find/replace branding changes
- Update CLAUDE.md with new prod IDs

**Only you can do:**
- Register the UK Ltd company (requires your real ID and signature)
- Open the business bank account (KYC verification)
- Sign up for Google Workspace, Supabase Pro, Vercel Pro, Stripe (all require billing details)
- Verify Stripe (your real ID upload)
- Make subscription pricing decisions
- Provide a logo or sign off on a placeholder

---

*Plan written: 2026-04-07. Update this file as you complete each step — or I'll update it for you when we work through it together.*
