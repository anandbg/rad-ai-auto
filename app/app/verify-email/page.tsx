'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { PageWrapper } from '@/components/motion/page-wrapper';
import { FadeIn } from '@/components/motion/fade-in';
import { Card } from '@/components/ui/card';

function VerifyEmailContent() {
  // Supabase handles email verification automatically via magic link
  // When users click the verification link, Supabase verifies them
  // and redirects to this page as a confirmation
  return (
    <PageWrapper className="min-h-screen flex items-center justify-center bg-background p-4">
      <main id="main-content" className="w-full max-w-md">
        <Card className="p-8">
          <FadeIn>
            <div className="text-center">
              <span className="text-6xl mb-4 block" role="img" aria-label="Checkmark">
                {String.fromCodePoint(0x2705)}
              </span>
              <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
              <p className="text-text-secondary mb-6">
                Your email address has been verified successfully. You now have full access to AI Radiologist.
              </p>

              <Link href="/login" className="btn-primary inline-block" data-testid="go-to-login-after-verify">
                Sign in to your account
              </Link>
            </div>
          </FadeIn>
        </Card>
      </main>
    </PageWrapper>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
