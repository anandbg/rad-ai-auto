'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface GoogleAuthButtonProps {
  mode: 'signin' | 'signup';
  disabled?: boolean;
  redirectTo?: string;
}

export function GoogleAuthButton({ mode, disabled, redirectTo = '/dashboard' }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google OAuth error:', error.message);
        // Error will be handled by the OAuth provider
      }
    } catch (err) {
      console.error('Unexpected error during Google sign-in:', err);
      setLoading(false);
    }
    // Note: Don't set loading to false on success - page will redirect
  };

  const buttonText = mode === 'signin' ? 'Continue with Google' : 'Sign up with Google';

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-border rounded-lg bg-surface hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={buttonText}
    >
      {/* Google Logo SVG */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          d="M17.64 9.20443C17.64 8.56625 17.5827 7.95262 17.4764 7.36353H9V10.8449H13.8436C13.635 11.9699 13.0009 12.9231 12.0477 13.5613V15.8194H14.9564C16.6582 14.2526 17.64 11.9453 17.64 9.20443Z"
          fill="#4285F4"
        />
        <path
          d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z"
          fill="#34A853"
        />
        <path
          d="M3.96409 10.7101C3.78409 10.1701 3.68182 9.59325 3.68182 9.00007C3.68182 8.40689 3.78409 7.83007 3.96409 7.29007V4.95825H0.957273C0.347727 6.17325 0 7.54779 0 9.00007C0 10.4523 0.347727 11.8269 0.957273 13.0419L3.96409 10.7101Z"
          fill="#FBBC05"
        />
        <path
          d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
          fill="#EA4335"
        />
      </svg>

      <span className="text-sm font-medium text-text-primary">
        {loading ? 'Redirecting...' : buttonText}
      </span>
    </button>
  );
}
