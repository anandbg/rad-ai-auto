'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useCsrf } from '@/lib/hooks/use-csrf';
import { PageWrapper } from '@/components/motion/page-wrapper';
import { FadeIn } from '@/components/motion/fade-in';
import { StaggerContainer } from '@/components/motion/stagger-container';
import { Card } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';

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
      <PageWrapper className="min-h-screen flex items-center justify-center bg-background p-4">
        <main id="main-content" className="w-full max-w-md">
          <Card className="p-8">
            <FadeIn>
              <div className="text-center">
                <span className="text-6xl mb-4 block" role="img" aria-label="Email">
                  {String.fromCodePoint(0x1F4E7)}
                </span>
                <h1 className="text-2xl font-bold mb-2">Check your email</h1>
                <p className="text-text-secondary mb-6">
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
            </FadeIn>
          </Card>
        </main>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="min-h-screen flex items-center justify-center bg-background p-4">
      <main id="main-content" className="w-full max-w-md">
        <Card className="p-8">
          <FadeIn>
            <div className="text-center mb-8">
              <span className="text-4xl mb-4 block" role="img" aria-label="Key">
                {String.fromCodePoint(0x1F511)}
              </span>
              <h1 className="text-2xl font-bold">Forgot password?</h1>
              <p className="text-text-secondary mt-1">Enter your email and we&apos;ll send you a reset link</p>
            </div>
          </FadeIn>

          <form onSubmit={handleSubmit}>
            {/* CSRF Token */}
            <CsrfInput />

            <StaggerContainer className="space-y-4">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      className="rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger"
                      role="alert"
                    >
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <FadeIn>
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
              </FadeIn>

              <FadeIn>
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading}
                  data-testid="forgot-password-submit"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </FadeIn>

              <FadeIn>
                <div className="text-center text-sm pt-2">
                  <p className="text-text-secondary">
                    Remember your password?{' '}
                    <Link href="/login" className="text-brand hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </FadeIn>
            </StaggerContainer>
          </form>
        </Card>

        <FadeIn>
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-text-muted hover:text-text-secondary">
              &larr; Back to home
            </Link>
          </div>
        </FadeIn>
      </main>
    </PageWrapper>
  );
}
