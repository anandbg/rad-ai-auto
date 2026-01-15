'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MOCK_AUTH_COOKIE, MOCK_USERS } from '@/lib/auth/mock-auth';
import { useCsrf } from '@/lib/hooks/use-csrf';

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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { CsrfInput, validateToken } = useCsrf();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    setIsDev(!isSupabaseConfigured());
  }, []);

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
      if (isDev) {
        // Development mode: check for registered users in localStorage
        const mockUsers = JSON.parse(localStorage.getItem('ai-rad-mock-users') || '{}');
        const user = mockUsers[email];

        if (user) {
          // User exists - check password
          if (user.password !== password) {
            setError('Invalid email or password.');
            setLoading(false);
            return;
          }

          // Check if email is verified
          if (!user.emailVerified) {
            setNeedsVerification(true);
            setUnverifiedEmail(email);
            setError('Please verify your email address before signing in. Check your inbox for the verification link.');
            setLoading(false);
            return;
          }

          // User is verified - set auth cookie with custom user type
          document.cookie = `${MOCK_AUTH_COOKIE}=custom_${email}; path=/; max-age=${60 * 60 * 24 * 7}`;

          // Store custom user data
          localStorage.setItem('ai-rad-custom-user', JSON.stringify({
            email,
            name: user.name,
            role: user.role || 'radiologist',
          }));

          router.push(redirectTo);
          router.refresh();
          return;
        }

        // No registered user found - show error
        setError('Invalid email or password. Or use the quick login buttons below for testing.');
        setLoading(false);
        return;
      }

      // Production mode: use real Supabase
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

  const handleDevLogin = (userType: 'radiologist' | 'admin') => {
    // Set mock auth cookie
    document.cookie = `${MOCK_AUTH_COOKIE}=${userType}; path=/; max-age=${60 * 60 * 24 * 7}`;
    // Redirect to dashboard
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center p-8"
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-text-secondary">
            Sign in to your account to continue
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
                {needsVerification && unverifiedEmail && (
                  <div className="mt-2 pt-2 border-t border-danger/30">
                    <button
                      type="button"
                      onClick={() => {
                        // Resend verification email
                        const mockUsers = JSON.parse(localStorage.getItem('ai-rad-mock-users') || '{}');
                        const user = mockUsers[unverifiedEmail];
                        if (user && user.verificationToken) {
                          const verifyLink = `${window.location.origin}/verify-email?token=${user.verificationToken}&email=${encodeURIComponent(unverifiedEmail)}`;
                          console.log('='.repeat(60));
                          console.log('📧 EMAIL VERIFICATION RESENT (Development Mode)');
                          console.log('='.repeat(60));
                          console.log(`To: ${unverifiedEmail}`);
                          console.log(verifyLink);
                          console.log('='.repeat(60));
                          alert(`Verification link logged to console:\n${verifyLink}`);
                        }
                      }}
                      className="text-brand hover:underline font-medium"
                    >
                      Resend verification email
                    </button>
                  </div>
                )}
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
              />
            </div>

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

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Development mode login buttons */}
          {isDev && (
            <div className="mt-6 border-t pt-6">
              <p className="mb-3 text-center text-sm text-text-muted">
                Development Mode - Quick Login
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDevLogin('radiologist')}
                  className="btn-secondary flex-1"
                  type="button"
                >
                  Login as Radiologist
                </button>
                <button
                  onClick={() => handleDevLogin('admin')}
                  className="btn-secondary flex-1"
                  type="button"
                >
                  Login as Admin
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <p className="text-text-secondary">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-brand hover:underline">
                Sign up
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
