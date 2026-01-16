'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCsrf } from '@/lib/hooks/use-csrf';
import { PageWrapper } from '@/components/motion/page-wrapper';
import { FadeIn } from '@/components/motion/fade-in';
import { StaggerContainer } from '@/components/motion/stagger-container';
import { Card } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { CsrfInput, validateToken } = useCsrf();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate CSRF token
    const formData = new FormData(e.currentTarget);
    const csrfToken = formData.get('_csrf') as string;

    if (!validateToken(csrfToken)) {
      setError('Security validation failed. Please refresh the page and try again.');
      console.error('[CSRF] Token validation failed on login form');
      return;
    }

    setLoading(true);

    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Successful login - redirect
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="min-h-screen flex items-center justify-center bg-background p-4">
      <main id="main-content" className="w-full max-w-md">
        <Card className="p-8">
          <FadeIn>
            <div className="text-center mb-8">
              <span className="text-4xl mb-4 block" role="img" aria-label="X-ray">
                {String.fromCodePoint(0x1FA7B)}
              </span>
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <p className="text-text-secondary mt-1">Sign in to your account</p>
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
                  />
                </div>
              </FadeIn>

              <FadeIn>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="label">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-brand hover:underline"
                      data-testid="forgot-password-link"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    minLength={8}
                  />
                </div>
              </FadeIn>

              <FadeIn>
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </FadeIn>

              <FadeIn>
                <div className="text-center text-sm pt-2">
                  <p className="text-text-secondary">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-brand hover:underline">
                      Sign up
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <main id="main-content" className="w-full max-w-md">
          <div className="rounded-xl border border-border bg-surface shadow-sm p-8">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto"></div>
              <p className="text-text-secondary">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
