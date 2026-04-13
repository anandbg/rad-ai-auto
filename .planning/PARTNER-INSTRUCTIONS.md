# What your business partner needs to do

**Time needed: ~2 hours spread over 1-3 days**
**Cost: ~£22 one-time + a payment card for small monthly charges (~£10-25/mo)**

Your partner creates the accounts and shares credentials with you. You (or I) do all the technical wiring.

---

## FOR YOUR PARTNER — Do these 8 things

### 1. Create a new Gmail account (5 min, free)

- Go to https://accounts.google.com/signup
- Create something like `yourcompanyname.dev@gmail.com`
- Use a strong password
- Turn on 2-step verification (Settings → Security → 2-Step Verification)
- **Write down the email and password**

### 2. Register a UK Limited Company (£12, takes 1-3 days)

- Go to https://www.gov.uk/limited-company-formation
- You'll need:
  - A company name (e.g. "RadAssist Technologies Ltd")
  - Your home address (or a virtual office address)
  - Your full name, date of birth, nationality
  - A passport or driving licence number
- Pay £12 by card
- **Write down the company number when you receive it (8 digits)**

### 3. Open a business bank account (10 min, free)

- Download the **Starling Bank** app (or Tide, or Wise Business)
- Sign up as a business → enter your company number from step 2
- You'll need to take a selfie and photo of your ID
- **Write down the sort code and account number once approved**

### 4. Buy a domain name (5 min, ~£10/year)

- Go to https://dash.cloudflare.com → sign up with the Gmail from step 1
- Click "Register a Domain" on the left menu
- Search for your preferred domain (e.g. `radassist.ai`, `airadiology.co.uk`)
- Buy it — use your business card
- **Write down the domain you bought**

### 5. Create a Stripe account (20 min, free until you charge customers)

- Go to https://stripe.com → sign up with the Gmail from step 1
- Choose: United Kingdom → Company → Private corporation
- You'll need:
  - Company name and number from step 2
  - Your home address or registered office address
  - A photo of your passport or driving licence
  - Bank sort code and account number from step 3
- For "Website" enter: `https://yourdomain` (the domain from step 4)
- For "Product description" write: "AI-assisted radiology report drafting tool for medical professionals"
- Submit — Stripe reviews your application (1-3 days)
- **Once approved, no action needed — just tell your technical partner it's verified**

### 6. Create a Supabase account (5 min, free)

- Go to https://supabase.com → sign up with the Gmail from step 1
- Create an organization — name it your company name
- **That's it — don't create any projects.** Your technical partner will do the rest.

### 7. Create a Groq account (5 min, free to start)

- Go to https://console.groq.com → sign up with the Gmail from step 1
- Go to Settings → Billing → add a payment card (you'll only be charged pennies per use)
- **That's it — your technical partner will create the API key**

### 8. Create an OpenAI account (5 min, pay-per-use)

- Go to https://platform.openai.com → sign up with the Gmail from step 1
- Go to Settings → Billing → add a payment card
- Set a usage limit of $20/month (so it can never charge more than that)
- **That's it — your technical partner will create the API key**

---

## SHARE THIS WITH YOUR TECHNICAL PARTNER

Once you've done steps 1-8, send your partner this filled-in list (via a **secure channel** — not normal email or WhatsApp. Use a password manager share, Signal message, or in person):

```
COMPANY GMAIL
Email:    ____________________________
Password: ____________________________

UK LIMITED COMPANY
Company name:    ____________________________
Company number:  ____________________________
Registered address: _________________________

BUSINESS BANK (for Stripe payouts)
Sort code:       ____________________________
Account number:  ____________________________

DOMAIN
Domain purchased: ____________________________
Cloudflare login: (same as Gmail above)

STRIPE
Login: (same as Gmail above)
Status: [ ] Verified  [ ] Still pending

SUPABASE
Login: (same as Gmail above)

GROQ
Login: (same as Gmail above)

OPENAI
Login: (same as Gmail above)
```

**Important:** After your technical partner has finished setting everything up, **change the Gmail password** and update 2-step verification to your own phone. You remain the account owner. Your partner just does the technical configuration.

---

## FOR YOU (THE TECHNICAL PARTNER) — What to do with these credentials

Once your partner gives you the filled-in list above, log in to each service with their Gmail and do the following:

### A. Google Cloud — create OAuth credentials (15 min)

1. Log in to https://console.cloud.google.com with partner's Gmail
2. Create project → OAuth consent screen → OAuth client ID
3. Get: `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`

### B. Supabase — create project + apply schema (15 min)

1. Log in to https://supabase.com with partner's Gmail
2. Create project in partner's org (region: EU)
3. Run `.planning/PRODUCTION-MIGRATION.sql` in SQL Editor
4. Configure Google OAuth provider with credentials from step A
5. Set auth redirect URLs
6. Create `transcribe-audio` storage bucket
7. Get: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### C. Groq — create API key (2 min)

1. Log in to https://console.groq.com with partner's Gmail
2. API Keys → Create Key → name it `production`
3. Get: `GROQ_API_KEY`

### D. OpenAI — create API key (2 min)

1. Log in to https://platform.openai.com with partner's Gmail
2. API Keys → Create Key → name it `production`
3. Get: `OPENAI_API_KEY`

### E. Upstash — create Redis database (5 min)

1. Sign up at https://upstash.com with partner's Gmail
2. Create database (EU-West-1, Regional)
3. Get: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### F. Stripe — create products + get API keys (10 min)

1. Log in to https://stripe.com with partner's Gmail
2. Confirm account is verified (live mode unlocked)
3. Switch to **Live mode** (toggle at top)
4. Create products: Plus (£XX/mo) and Pro (£XX/mo)
5. Get: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, price IDs
6. Webhook gets created after deployment (Step H)

### G. Generate encryption key (1 min)

```bash
openssl rand -base64 32
```
Get: `TRANSCRIBE_ENCRYPTION_KEY`

### H. Deploy — Vercel + domain + webhook (30 min)

1. Sign up at https://vercel.com with partner's Gmail
2. Import repo, set root directory to `app`
3. Add ALL env vars (use the master list from the 50-user plan)
4. Deploy
5. Connect domain via Cloudflare DNS
6. Create Stripe webhook → get `STRIPE_WEBHOOK_SECRET`
7. Redeploy

### I. Give me the credential sheet

Or just tell me you're ready — I'll run `vercel env ls`, `supabase link`, and wire everything up automatically using the MCP connections and CLI tools we already have.

---

## After setup — change ownership back

Once the app is live and working:

1. **Partner changes the Gmail password** (you no longer need it)
2. **Partner enables their own 2FA** on Gmail, Stripe, Supabase
3. You keep access to Vercel and GitHub for deployments (partner adds you as a team member)
4. For Stripe, partner adds you as a "Developer" role (read-only API access, can't change bank details)
5. For Supabase, partner invites your email as a team member

This way the partner OWNS all accounts but you can still deploy and maintain the app.
