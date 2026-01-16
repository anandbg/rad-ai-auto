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

// Zod schema for signup form validation
const signupSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { CsrfInput, validateToken } = useCsrf();

  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof SignupFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const result = signupSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Partial<Record<keyof SignupFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof SignupFormData;
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
      console.error('[CSRF] Token validation failed on signup form');
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

      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
          data: {
            name: formData.name,
          },
        },
      });

      if (signUpError) {
        setGeneralError(signUpError.message);
        return;
      }

      // Profile is now auto-created by database trigger (on_auth_user_created)
      // This upsert is a fallback in case trigger fails, and handles the case
      // where profile already exists (trigger succeeded) gracefully
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            name: formData.name,
            role: 'radiologist',
          }, { onConflict: 'user_id' });

        if (profileError) {
          console.error('Error creating/updating profile:', profileError);
          // Don't fail signup if profile creation fails
          // Trigger should have created it anyway
        }
      }

      // Successful signup
      setSuccess(true);
    } catch (err) {
      setGeneralError('An unexpected error occurred. Please try again.');
      console.error('Signup error:', err);
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
                <h1 className="text-2xl font-bold mb-2">Verify your email</h1>
                <p className="text-text-secondary mb-6">
                  We&apos;ve sent a verification link to <strong>{formData.email}</strong>.
                  Please check your inbox and click the link to activate your account.
                </p>

                <div className="space-y-3">
                  <Link href="/login" className="btn-secondary inline-block">
                    Go to Login
                  </Link>
                  <p className="text-sm text-text-muted">
                    Didn&apos;t receive the email? Check your spam folder or{' '}
                    <button
                      onClick={() => {
                        setSuccess(false);
                      }}
                      className="text-brand hover:underline"
                    >
                      try again
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
              <span className="text-4xl mb-4 block" role="img" aria-label="X-ray">
                {String.fromCodePoint(0x1FA7B)}
              </span>
              <h1 className="text-2xl font-bold">Create an account</h1>
              <p className="text-text-secondary mt-1">Sign up to start using AI Radiologist</p>
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

              {/* Name */}
              <FadeIn>
                <div className="space-y-2">
                  <label htmlFor="name" className="label">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`input ${errors.name ? 'border-danger' : ''}`}
                    placeholder="Dr. John Smith"
                    autoComplete="name"
                    disabled={loading}
                    data-testid="signup-name-input"
                    aria-invalid={errors.name ? 'true' : undefined}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  {errors.name && (
                    <p id="name-error" role="alert" className="text-sm text-danger">
                      {errors.name}
                    </p>
                  )}
                </div>
              </FadeIn>

              {/* Email */}
              <FadeIn>
                <div className="space-y-2">
                  <label htmlFor="email" className="label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`input ${errors.email ? 'border-danger' : ''}`}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loading}
                    data-testid="signup-email-input"
                    aria-invalid={errors.email ? 'true' : undefined}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" role="alert" className="text-sm text-danger">
                      {errors.email}
                    </p>
                  )}
                </div>
              </FadeIn>

              {/* Password */}
              <FadeIn>
                <div className="space-y-2">
                  <label htmlFor="password" className="label">
                    Password
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
                    data-testid="signup-password-input"
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
                    Confirm Password
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
                    data-testid="signup-confirm-password-input"
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
                  data-testid="signup-submit-button"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </FadeIn>

              <FadeIn>
                <div className="text-center text-sm pt-2">
                  <p className="text-text-secondary">
                    Already have an account?{' '}
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
