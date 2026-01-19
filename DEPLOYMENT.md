# AI Radiologist - Deployment Guide

## Overview

This guide covers deploying AI Radiologist to Vercel with Supabase backend.

## Prerequisites

- [ ] Vercel account (free or Pro)
- [ ] Supabase project (free or Pro)
- [ ] Stripe account with products configured
- [ ] OpenAI API key
- [ ] GitHub repository connected to Vercel

## Environment Setup

### Required Environment Variables

| Variable | Where to Get | Vercel Scope |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API | All |
| `OPENAI_API_KEY` | OpenAI Platform > API Keys | All |
| `STRIPE_SECRET_KEY` | Stripe Dashboard > Developers > API keys | Production: live, Preview: test |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard > Developers > API keys | Production: live, Preview: test |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Webhooks > Signing secret | Per environment |
| `STRIPE_PRICE_ID_PLUS` | Stripe Dashboard > Products | Per environment |
| `STRIPE_PRICE_ID_PRO` | Stripe Dashboard > Products | Per environment |
| `NEXT_PUBLIC_APP_URL` | Your domain | Production only |

### Environment Scoping

- **Development**: Use test API keys, local Supabase or dev project
- **Preview** (PR branches): Use test API keys, dev Supabase project
- **Production**: Use live API keys, production Supabase project

## Deployment Steps

### 1. First-Time Setup

1. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import from GitHub
   - Select the repository
   - Framework: Next.js (auto-detected)
   - Root Directory: `app`

2. **Configure Build Settings**
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

3. **Add Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add each variable with appropriate scope
   - Mark sensitive vars as "Sensitive" (encrypted)

4. **Deploy**
   - Click Deploy
   - Wait for build to complete
   - Verify deployment URL works

### 2. Supabase Setup

1. **Database Migrations**
   ```bash
   # From app directory
   cd app

   # Link to your Supabase project
   npx supabase link --project-ref YOUR_PROJECT_REF

   # Push migrations
   npx supabase db push
   ```

2. **Configure Auth**
   - Supabase Dashboard > Authentication > URL Configuration
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/auth/callback`

3. **Enable RLS**
   - Verify RLS is enabled on all tables
   - Check policies in Supabase Dashboard > Database > Policies

### 3. Stripe Webhook Setup

1. **Create Webhook Endpoint**
   - Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`

2. **Select Events**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

3. **Update Environment Variable**
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`
   - Add to Vercel Environment Variables (Production scope)

### 4. Domain Configuration

1. **Add Custom Domain**
   - Vercel Project > Settings > Domains
   - Add your domain
   - Configure DNS as instructed

2. **SSL Certificate**
   - Automatically provisioned by Vercel
   - Verify HTTPS works

## Verification Checklist

After deployment, verify:

- [ ] Homepage loads at custom domain
- [ ] Login/signup works
- [ ] Auth redirects work correctly
- [ ] Templates load from database
- [ ] AI report generation works
- [ ] Voice transcription works
- [ ] Stripe checkout opens
- [ ] Stripe webhook receives events (check Stripe Dashboard)
- [ ] PDF export works
- [ ] Admin pages accessible to admin users

## Monitoring

### Vercel Analytics

Automatically enabled. View at:
- Vercel Dashboard > Project > Analytics

Monitors:
- Core Web Vitals (LCP, FID, CLS)
- Page views
- Visitor insights

### Logs

View deployment logs:
- Vercel Dashboard > Project > Deployments > [deployment] > Functions

### Error Tracking

For production, consider adding:
- Sentry (recommended for detailed error tracking)
- LogRocket (for session replay)

## Rollback

If issues occur:

1. **Instant Rollback**
   - Vercel Dashboard > Deployments
   - Find last working deployment
   - Click "..." > "Promote to Production"

2. **Git-based Rollback**
   ```bash
   git revert HEAD
   git push
   ```

## Troubleshooting

### Build Failures

```bash
# Run build locally to see errors
cd app && pnpm build
```

### Environment Variable Issues

- Check variable names match exactly (case-sensitive)
- Verify `NEXT_PUBLIC_` prefix for client-side vars
- Check Vercel Dashboard > Settings > Environment Variables

### Database Connection Issues

- Verify Supabase project is active
- Check RLS policies
- Verify service role key has correct permissions

### Stripe Webhook Failures

- Check Stripe Dashboard > Developers > Webhooks > Events
- Verify webhook secret matches
- Check function logs in Vercel

## Security Reminders

- [ ] Never commit `.env.local` to git
- [ ] Use different Stripe keys for test vs production
- [ ] Rotate API keys periodically
- [ ] Review Supabase RLS policies before launch
- [ ] Enable 2FA on all service accounts

## Quick Reference

### Vercel Configuration

The project includes `app/vercel.json` with optimized settings:
- Region: `iad1` (US East Virginia) for optimal Supabase latency
- AI routes: 60s timeout
- Transcribe route: 120s timeout
- Webhook routes: 30s timeout

### Security Headers

Security headers configured in `app/next.config.mjs`:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(self), geolocation=()

### Bundle Analysis

Run bundle analysis to check build size:
```bash
cd app && pnpm analyze
```

---

*Last updated: 2026-01-19*
