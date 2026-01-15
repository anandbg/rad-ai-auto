'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useCsrf } from '@/lib/hooks/use-csrf';

// Email validation schema
const emailSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Generate a mock reset token
function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export default function ForgotPasswordPage() {
  const { CsrfInput, validateToken } = useCsrf();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  useEffect(() => {
    setIsDev(!isSupabaseConfigured());
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setDevResetLink(null);

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
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      if (isDev) {
        // Development mode: generate mock reset token and log to console
        const resetToken = generateResetToken();
        const resetLink = `${window.location.origin}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        // Store the token for verification later (in a real app, this would be in database)
        const resetTokens = JSON.parse(localStorage.getItem('ai-rad-reset-tokens') || '{}');
        resetTokens[email] = {
          token: resetToken,
          expires: Date.now() + (60 * 60 * 1000), // 1 hour expiry
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('ai-rad-reset-tokens', JSON.stringify(resetTokens));

        // Log to console (simulating email being sent)
        console.log('='.repeat(60));
        console.log('📧 PASSWORD RESET EMAIL (Development Mode)');
        console.log('='.repeat(60));
        console.log(`To: ${email}`);
        console.log(`Subject: Reset your AI Radiologist password`);
        console.log('');
        console.log('Click the link below to reset your password:');
        console.log(resetLink);
        console.log('');
        console.log('This link will expire in 1 hour.');
        console.log('='.repeat(60));

        // Also show in UI for easier testing
        setDevResetLink(resetLink);
        setSuccess(true);
        return;
      }

      // Production mode: use real Supabase
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
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

          {/* Development mode: show the reset link directly */}
          {isDev && devResetLink && (
            <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 p-4 text-left">
              <p className="mb-2 text-sm font-medium text-warning">
                Development Mode - Reset Link:
              </p>
              <p className="mb-3 text-xs text-text-muted">
                In production, this link would be sent via email. Check the browser console for the full email.
              </p>
              <Link
                href={devResetLink}
                className="block break-all text-sm text-brand hover:underline"
                data-testid="dev-reset-link"
              >
                {devResetLink}
              </Link>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/login" className="btn-primary inline-block">
              Back to Login
            </Link>
            <p className="text-sm text-text-muted">
              Didn&apos;t receive the email?{' '}
              <button
                onClick={() => {
                  setSuccess(false);
                  setDevResetLink(null);
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

          {/* Development mode note */}
          {isDev && (
            <div className="mt-4 rounded-lg border border-info/30 bg-info/10 p-3">
              <p className="text-sm text-info">
                <strong>Development Mode:</strong> The reset link will be logged to the browser console and displayed on screen instead of being sent via email.
              </p>
            </div>
          )}

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
