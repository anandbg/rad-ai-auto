'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useCsrf } from '@/lib/hooks/use-csrf';

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

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { CsrfInput, validateToken } = useCsrf();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [formData, setFormData] = useState<PasswordFormData>({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordFormData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    const devMode = !isSupabaseConfigured();
    setIsDev(devMode);

    // In development mode, validate the token against localStorage
    if (devMode && token && email) {
      const resetTokens = JSON.parse(localStorage.getItem('ai-rad-reset-tokens') || '{}');
      const storedData = resetTokens[email];

      if (storedData && storedData.token === token) {
        if (Date.now() < storedData.expires) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          setGeneralError('This password reset link has expired. Please request a new one.');
        }
      } else {
        setIsValidToken(false);
        setGeneralError('Invalid or expired reset link. Please request a new one.');
      }
    } else if (devMode && (!token || !email)) {
      setIsValidToken(false);
      setGeneralError('Invalid reset link. Please request a new password reset.');
    } else {
      // In production mode, Supabase handles token validation
      setIsValidToken(true);
    }
  }, [token, email]);

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
      if (isDev) {
        // Development mode: update mock user password in localStorage
        // Get existing mock users or create default ones
        const mockUsers = JSON.parse(localStorage.getItem('ai-rad-mock-users') || JSON.stringify({
          'radiologist@test.com': { password: 'password123', role: 'radiologist', name: 'Dr. Test Radiologist' },
          'admin@test.com': { password: 'admin123', role: 'admin', name: 'Admin User' },
        }));

        // Update password for the email
        if (email) {
          if (!mockUsers[email]) {
            // Create user if doesn't exist
            mockUsers[email] = { password: formData.password, role: 'radiologist', name: email.split('@')[0] };
          } else {
            mockUsers[email].password = formData.password;
          }
          localStorage.setItem('ai-rad-mock-users', JSON.stringify(mockUsers));

          // Clear the reset token
          const resetTokens = JSON.parse(localStorage.getItem('ai-rad-reset-tokens') || '{}');
          delete resetTokens[email];
          localStorage.setItem('ai-rad-reset-tokens', JSON.stringify(resetTokens));

          console.log('='.repeat(60));
          console.log('🔐 PASSWORD UPDATED (Development Mode)');
          console.log('='.repeat(60));
          console.log(`Email: ${email}`);
          console.log(`New password has been set.`);
          console.log('You can now sign in with your new password.');
          console.log('='.repeat(60));
        }

        setSuccess(true);
        return;
      }

      // Production mode: use real Supabase
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

  // Show loading state while checking token
  if (isValidToken === null) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen flex-col items-center justify-center p-8"
      >
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto"></div>
          <p className="text-text-secondary">Validating reset link...</p>
        </div>
      </main>
    );
  }

  // Show error for invalid token
  if (!isValidToken) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen flex-col items-center justify-center p-8"
      >
        <div className="w-full max-w-md text-center">
          <div className="mb-4 text-6xl">❌</div>
          <h1 className="mb-2 text-2xl font-bold">Invalid Reset Link</h1>
          <p className="mb-6 text-text-secondary">
            {generalError || 'This password reset link is invalid or has expired.'}
          </p>
          <Link href="/forgot-password" className="btn-primary">
            Request New Reset Link
          </Link>
        </div>
      </main>
    );
  }

  // Show success message
  if (success) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen flex-col items-center justify-center p-8"
      >
        <div className="w-full max-w-md text-center">
          <div className="mb-4 text-6xl">✅</div>
          <h1 className="mb-2 text-2xl font-bold">Password Updated!</h1>
          <p className="mb-6 text-text-secondary">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <Link href="/login" className="btn-primary" data-testid="go-to-login">
            Sign in
          </Link>
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
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Reset your password</h1>
          <p className="text-text-secondary">
            Enter your new password below
          </p>
          {email && (
            <p className="mt-2 text-sm text-text-muted">
              Resetting password for: <strong>{email}</strong>
            </p>
          )}
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

            {/* Password */}
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

            {/* Confirm Password */}
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

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
              data-testid="reset-password-submit"
            >
              {loading ? 'Updating...' : 'Reset password'}
            </button>
          </form>

          {/* Development mode note */}
          {isDev && (
            <div className="mt-4 rounded-lg border border-info/30 bg-info/10 p-3">
              <p className="text-sm text-info">
                <strong>Development Mode:</strong> Password will be stored in localStorage for testing purposes.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-text-muted hover:text-text-secondary">
            &larr; Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
