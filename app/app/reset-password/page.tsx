'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useCsrf } from '@/lib/hooks/use-csrf';
import { PageWrapper } from '@/components/motion/page-wrapper';
import { FadeIn } from '@/components/motion/fade-in';
import { StaggerContainer } from '@/components/motion/stagger-container';
import { Card } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';

// Password validation schema
const passwordSchema = z.object({
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const { CsrfInput, validateToken } = useCsrf();

  const email = searchParams.get('email');

  const [formData, setFormData] = useState<PasswordFormData>({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordFormData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof PasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const result = passwordSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Partial<Record<keyof PasswordFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof PasswordFormData;
        newErrors[field] = err.message;
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError(null);

    // Validate CSRF token
    const formDataObj = new FormData(e.currentTarget);
    const csrfToken = formDataObj.get('_csrf') as string;

    if (!validateToken(csrfToken)) {
      setGeneralError('Security validation failed. Please refresh the page and try again.');
      console.error('[CSRF] Token validation failed on reset password form');
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) {
        setGeneralError(updateError.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setGeneralError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Show success message
  if (success) {
    return (
      <PageWrapper className="min-h-screen flex items-center justify-center bg-background p-4">
        <main id="main-content" className="w-full max-w-md">
          <Card className="p-8">
            <FadeIn>
              <div className="text-center">
                <span className="text-6xl mb-4 block" role="img" aria-label="Checkmark">
                  {String.fromCodePoint(0x2705)}
                </span>
                <h1 className="text-2xl font-bold mb-2">Password Updated!</h1>
                <p className="text-text-secondary mb-6">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <Link href="/login" className="btn-primary inline-block" data-testid="go-to-login">
                  Sign in
                </Link>
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
              <span className="text-4xl mb-4 block" role="img" aria-label="Lock">
                {String.fromCodePoint(0x1F512)}
              </span>
              <h1 className="text-2xl font-bold">Reset your password</h1>
              <p className="text-text-secondary mt-1">Enter your new password below</p>
              {email && (
                <p className="mt-2 text-sm text-text-muted">
                  Resetting password for: <strong>{email}</strong>
                </p>
              )}
            </div>
          </FadeIn>

          <form onSubmit={handleSubmit}>
            {/* CSRF Token */}
            <CsrfInput />

            <StaggerContainer className="space-y-4">
              <AnimatePresence mode="wait">
                {generalError && (
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
                      {generalError}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Password */}
              <FadeIn>
                <div className="space-y-2">
                  <label htmlFor="password" className="label">
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`input ${errors.password ? 'border-danger' : ''}`}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    disabled={loading}
                    data-testid="reset-password-input"
                    aria-invalid={errors.password ? 'true' : undefined}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  {errors.password && (
                    <p id="password-error" role="alert" className="text-sm text-danger">
                      {errors.password}
                    </p>
                  )}
                </div>
              </FadeIn>

              {/* Confirm Password */}
              <FadeIn>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="label">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className={`input ${errors.confirmPassword ? 'border-danger' : ''}`}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    disabled={loading}
                    data-testid="reset-confirm-password-input"
                    aria-invalid={errors.confirmPassword ? 'true' : undefined}
                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                  />
                  {errors.confirmPassword && (
                    <p id="confirm-password-error" role="alert" className="text-sm text-danger">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </FadeIn>

              <FadeIn>
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading}
                  data-testid="reset-password-submit"
                >
                  {loading ? 'Updating...' : 'Reset password'}
                </button>
              </FadeIn>
            </StaggerContainer>
          </form>
        </Card>

        <FadeIn>
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-text-muted hover:text-text-secondary">
              &larr; Back to login
            </Link>
          </div>
        </FadeIn>
      </main>
    </PageWrapper>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
