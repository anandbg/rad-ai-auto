'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useCsrf } from '@/lib/hooks/use-csrf';

// Email validation schema
const emailSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const { CsrfInput, validateToken } = useCsrf();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate CSRF token
    const formData = new FormData(e.currentTarget);
    const csrfToken = formData.get('_csrf') as string;

    if (!validateToken(csrfToken)) {
      setError('Security validation failed. Please refresh the page and try again.');
      console.error('[CSRF] Token validation failed on forgot password form');
      return;
    }

    // Validate email
    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0]?.message || 'Please enter a valid email');
      return;
    }

    setLoading(true);

    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen flex-col items-center justify-center p-8"
      >
        <div className="w-full max-w-md text-center">
          <div className="mb-4 text-6xl">📧</div>
          <h1 className="mb-2 text-2xl font-bold">Check your email</h1>
          <p className="mb-6 text-text-secondary">
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
          </p>

          <div className="space-y-3">
            <Link href="/login" className="btn-primary inline-block">
              Back to Login
            </Link>
            <p className="text-sm text-text-muted">
              Didn&apos;t receive the email?{' '}
              <button
                onClick={() => {
                  setSuccess(false);
                }}
                className="text-brand hover:underline"
              >
                Try again
              </button>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center p-8"
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Forgot password?</h1>
          <p className="text-text-secondary">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* CSRF Token */}
            <CsrfInput />

            {error && (
              <div
                className="rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={loading}
                data-testid="forgot-password-email"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
              data-testid="forgot-password-submit"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-text-secondary">
              Remember your password?{' '}
              <Link href="/login" className="text-brand hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-text-muted hover:text-text-secondary">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
