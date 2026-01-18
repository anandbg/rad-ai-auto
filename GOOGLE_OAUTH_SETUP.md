# Google OAuth Setup Guide

This guide walks through setting up Google OAuth authentication for the AI Radiologist application.

## Prerequisites

- Google Cloud Console account
- Supabase project (local and production)
- Access to production environment variables

## Part 1: Google Cloud Console Setup

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure the consent screen if prompted:
   - User Type: **External**
   - App name: **AI Radiologist**
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `email`, `profile`, `openid` (default)
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **AI Radiologist - Production**

### 2. Configure Authorized Redirect URIs

Add the following redirect URIs:

**For Production:**
```
https://your-project.supabase.co/auth/v1/callback
```

**For Local Development:**
```
http://127.0.0.1:54321/auth/v1/callback
```

### 3. Save Credentials

After creating, you'll receive:
- **Client ID** (ends with `.apps.googleusercontent.com`)
- **Client Secret** (keep this secure!)

## Part 2: Supabase Configuration

### Local Development

1. The `app/supabase/config.toml` is already configured with:
   ```toml
   [auth.external.google]
   enabled = true
   client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
   secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
   skip_nonce_check = true
   ```

2. Add to your `app/.env.local`:
   ```bash
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-client-secret
   ```

3. Restart Supabase:
   ```bash
   cd app
   npx supabase stop
   npx supabase start
   ```

### Production (Supabase Dashboard)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click to configure
4. Enable the provider and enter:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
5. Click **Save**

### Production Environment Variables

Add to your production environment (Vercel, etc.):

```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-client-secret
```

## Part 3: Testing

### Local Testing

1. Start your development server:
   ```bash
   cd app
   pnpm dev
   ```

2. Navigate to `http://localhost:3000/login`
3. Click **Continue with Google**
4. You should be redirected to Google's consent screen
5. After authorizing, you should be redirected back to `/dashboard`
6. Check that your profile was created in the `profiles` table

### Verify Profile Creation

The database trigger automatically creates profiles for OAuth users:
- Name is extracted from Google's `user_metadata.name`
- If no name is provided, it falls back to the email prefix
- Role is set to `radiologist` by default

## Part 4: Production Deployment

### Checklist

- [ ] Google OAuth credentials created in Google Cloud Console
- [ ] Authorized redirect URIs configured (production Supabase URL)
- [ ] Google provider enabled in Supabase Dashboard (Production)
- [ ] Environment variables set in production (Vercel/hosting platform)
- [ ] Code deployed to production
- [ ] Test Google OAuth flow in production
- [ ] Verify profile creation works
- [ ] Test email/password login still works

## Troubleshooting

### "Invalid OAuth redirect URI"
- Verify the redirect URI in Google Cloud Console matches exactly: `https://your-project.supabase.co/auth/v1/callback`
- Check for trailing slashes or typos

### "Error 400: redirect_uri_mismatch"
- The redirect URI in your OAuth request doesn't match any authorized URIs
- Add the exact URI to Google Cloud Console

### Profile not created
- Check Supabase logs for trigger errors
- Verify the `handle_new_user()` trigger is installed (migration `20260116030000_profile_trigger.sql`)
- Check `auth.users` table to see if user was created
- Manually run: `SELECT * FROM profiles WHERE user_id = 'user-uuid'`

### Local development not working
- Ensure `skip_nonce_check = true` in `config.toml`
- Verify Supabase is running: `npx supabase status`
- Check that environment variables are loaded: restart dev server

## Security Notes

1. **Never commit secrets to git**
   - Client secrets are in `.env.local` (gitignored)
   - Use environment variable substitution in `config.toml`

2. **OAuth Scopes**
   - We only request `email`, `profile`, and `openid` (minimal necessary)
   - Users can review permissions during consent

3. **Session Security**
   - Sessions use Supabase's secure JWT tokens
   - Refresh token rotation is enabled
   - Session timeout configured in `config.toml`

## Additional Resources

- [Supabase Google OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
