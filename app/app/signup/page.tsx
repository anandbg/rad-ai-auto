'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useCsrf } from '@/lib/hooks/use-csrf';

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

export default function SignupPage() {
  const router = useRouter();
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
  const [isDev, setIsDev] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);

  useEffect(() => {
    setIsDev(!isSupabaseConfigured());
  }, []);

  // Generate verification token
  const generateVerificationToken = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

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
      if (isDev) {
        // Development mode: create unverified user in localStorage
        const verificationToken = generateVerificationToken();
        const verifyLink = `${window.location.origin}/verify-email?token=${verificationToken}&email=${encodeURIComponent(formData.email)}`;

        // Store user as unverified
        const mockUsers = JSON.parse(localStorage.getItem('ai-rad-mock-users') || '{}');
        mockUsers[formData.email] = {
          password: formData.password,
          name: formData.name,
          role: 'radiologist',
          emailVerified: false,
          verificationToken,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('ai-rad-mock-users', JSON.stringify(mockUsers));

        // Log verification email to console
        console.log('='.repeat(60));
        console.log('📧 EMAIL VERIFICATION (Development Mode)');
        console.log('='.repeat(60));
        console.log(`To: ${formData.email}`);
        console.log(`Subject: Verify your AI Radiologist account`);
        console.log('');
        console.log('Welcome to AI Radiologist!');
        console.log('');
        console.log('Click the link below to verify your email:');
        console.log(verifyLink);
        console.log('');
        console.log('This link will expire in 24 hours.');
        console.log('='.repeat(60));

        setVerificationLink(verifyLink);
        setSuccess(true);
        return;
      }

      // Production mode: use real Supabase
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = createSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      });

      if (signUpError) {
        setGeneralError(signUpError.message);
        return;
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
      <main
        id="main-content"
        className="flex min-h-screen flex-col items-center justify-center p-8"
      >
        <div className="w-full max-w-md text-center">
          <div className="mb-4 text-6xl">📧</div>
          <h1 className="mb-2 text-2xl font-bold">Verify your email</h1>
          <p className="mb-6 text-text-secondary">
            We&apos;ve sent a verification link to <strong>{formData.email}</strong>.
            Please check your inbox and click the link to activate your account.
          </p>

          {/* Development mode: show verification link */}
          {isDev && verificationLink && (
            <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 p-4 text-left">
              <p className="mb-2 text-sm font-medium text-warning">
                Development Mode - Verification Link:
              </p>
              <p className="mb-3 text-xs text-text-muted">
                In production, this link would be sent via email. Check the browser console for the full email.
              </p>
              <Link
                href={verificationLink}
                className="block break-all text-sm text-brand hover:underline"
                data-testid="dev-verification-link"
              >
                {verificationLink}
              </Link>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/login" className="btn-secondary inline-block">
              Go to Login
            </Link>
            <p className="text-sm text-text-muted">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => {
                  setSuccess(false);
                  setVerificationLink(null);
                }}
                className="text-brand hover:underline"
              >
                try again
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
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Create an account</h1>
          <p className="text-text-secondary">
            Sign up to start using AI Radiologist
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* CSRF Token */}
            <CsrfInput />

            {generalError && (
              <div
                className="rounded-lg border border-danger/50 bg-danger/10 p-3 text-sm text-danger"
                role="alert"
              >
                {generalError}
              </div>
            )}

            {/* Name */}
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

            {/* Email */}
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

            {/* Password */}
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

            {/* Confirm Password */}
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

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
              data-testid="signup-submit-button"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Development mode note */}
          {isDev && (
            <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3">
              <p className="text-sm text-warning">
                <strong>Development Mode:</strong> Supabase is not configured.
                Signup will simulate success but no account will be created.
              </p>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <p className="text-text-secondary">
              Already have an account?{' '}
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
