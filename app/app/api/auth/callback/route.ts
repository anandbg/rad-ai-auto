import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Auth callback route handler for Supabase
 *
 * Handles:
 * - Email verification callback (after signup confirmation)
 * - Password reset callback (before showing reset form)
 * - OAuth redirect callback (future: Google OAuth)
 *
 * The `code` parameter is exchanged for a session, then redirects
 * to the `next` parameter or defaults to /dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle error from Supabase (e.g., expired link)
  if (error) {
    console.error('[Auth Callback] Error from Supabase:', error, errorDescription);
    const errorParam = encodeURIComponent(errorDescription || error);
    return NextResponse.redirect(`${origin}/login?error=${errorParam}`);
  }

  // No code provided - redirect to login with error
  if (!code) {
    console.error('[Auth Callback] No code provided in callback');
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Code exchange failed:', exchangeError.message);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
    }

    // Successful exchange - redirect to intended destination
    // Ensure next path starts with / for security
    const safePath = next.startsWith('/') ? next : '/dashboard';
    return NextResponse.redirect(`${origin}${safePath}`);
  } catch (err) {
    console.error('[Auth Callback] Unexpected error:', err);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }
}
