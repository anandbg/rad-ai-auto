'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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

function VerifyEmailContent() {
  const searchParams = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_verified'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    const devMode = !isSupabaseConfigured();
    setIsDev(devMode);

    if (devMode && token && email) {
      // Development mode: verify against localStorage
      const mockUsers = JSON.parse(localStorage.getItem('ai-rad-mock-users') || '{}');
      const user = mockUsers[email];

      if (!user) {
        setStatus('error');
        setErrorMessage('No account found with this email address.');
        return;
      }

      if (user.emailVerified) {
        setStatus('already_verified');
        return;
      }

      if (user.verificationToken !== token) {
        setStatus('error');
        setErrorMessage('Invalid or expired verification link.');
        return;
      }

      // Mark user as verified
      mockUsers[email].emailVerified = true;
      delete mockUsers[email].verificationToken;
      localStorage.setItem('ai-rad-mock-users', JSON.stringify(mockUsers));

      console.log('='.repeat(60));
      console.log('✅ EMAIL VERIFIED (Development Mode)');
      console.log('='.repeat(60));
      console.log(`Email: ${email}`);
      console.log('Account is now fully activated.');
      console.log('='.repeat(60));

      setStatus('success');
    } else if (devMode && (!token || !email)) {
      setStatus('error');
      setErrorMessage('Invalid verification link. Please request a new one.');
    } else if (!devMode) {
      // Production mode: Supabase handles verification automatically via magic link
      // This page would be shown after redirect from Supabase
      setStatus('success');
    }
  }, [token, email]);

  if (status === 'loading') {
    return (
      <main
        id="main-content"
        className="flex min-h-screen flex-col items-center justify-center p-8"
      >
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto"></div>
          <p className="text-text-secondary">Verifying your email...</p>
        </div>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main
        id="main-content"
        className="flex min-h-screen flex-col items-center justify-center p-8"
      >
        <div className="w-full max-w-md text-center">
          <div className="mb-4 text-6xl">❌</div>
          <h1 className="mb-2 text-2xl font-bold">Verification Failed</h1>
          <p className="mb-6 text-text-secondary">
            {errorMessage || 'Unable to verify your email address.'}
          </p>
          <div className="space-y-3">
            <Link href="/signup" className="btn-primary inline-block">
              Sign Up Again
            </Link>
            <p className="text-sm text-text-muted">
              Already have a verified account?{' '}
              <Link href="/login" className="text-brand hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (status === 'already_verified') {
    return (
      <main
        id="main-content"
        className="flex min-h-screen flex-col items-center justify-center p-8"
      >
        <div className="w-full max-w-md text-center">
          <div className="mb-4 text-6xl">✅</div>
          <h1 className="mb-2 text-2xl font-bold">Already Verified</h1>
          <p className="mb-6 text-text-secondary">
            Your email address has already been verified. You can sign in to your account.
          </p>
          <Link href="/login" className="btn-primary" data-testid="go-to-login">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  // Success
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center p-8"
    >
      <div className="w-full max-w-md text-center">
        <div className="mb-4 text-6xl">✅</div>
        <h1 className="mb-2 text-2xl font-bold">Email Verified!</h1>
        <p className="mb-6 text-text-secondary">
          Your email address has been verified successfully. You now have full access to AI Radiologist.
        </p>

        {isDev && (
          <div className="mb-6 rounded-lg border border-info/30 bg-info/10 p-3 text-left">
            <p className="text-sm text-info">
              <strong>Development Mode:</strong> Your account for{' '}
              <strong>{email}</strong> is now verified. You can sign in with your password.
            </p>
          </div>
        )}

        <Link href="/login" className="btn-primary" data-testid="go-to-login-after-verify">
          Sign in to your account
        </Link>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main
        id="main-content"
        className="flex min-h-screen flex-col items-center justify-center p-8"
      >
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
