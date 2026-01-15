'use client';

import { useEffect, useState } from 'react';
import { getCsrfToken, validateCsrfToken, regenerateCsrfToken } from '@/lib/auth/csrf';

/**
 * React hook for CSRF protection in forms
 *
 * Usage:
 * ```tsx
 * const { csrfToken, CsrfInput, validateToken } = useCsrf();
 *
 * // In your form:
 * <form onSubmit={handleSubmit}>
 *   <CsrfInput />
 *   ... other fields
 * </form>
 *
 * // In your submit handler:
 * const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
 *   e.preventDefault();
 *   const formData = new FormData(e.currentTarget);
 *   const token = formData.get('_csrf') as string;
 *
 *   if (!validateToken(token)) {
 *     // Handle invalid token
 *     return;
 *   }
 *   // Proceed with form submission
 * };
 * ```
 */
export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string>('');

  useEffect(() => {
    // Generate/retrieve CSRF token on mount
    setCsrfToken(getCsrfToken());
  }, []);

  /**
   * Hidden input component to include in forms
   */
  const CsrfInput = () => (
    <input
      type="hidden"
      name="_csrf"
      value={csrfToken}
      data-testid="csrf-token-input"
    />
  );

  /**
   * Validate a provided token against the session token
   */
  const validateToken = (token: string | null | undefined): boolean => {
    return validateCsrfToken(token);
  };

  /**
   * Regenerate the CSRF token (call after sensitive operations)
   */
  const regenerateToken = (): string => {
    const newToken = regenerateCsrfToken();
    setCsrfToken(newToken);
    return newToken;
  };

  return {
    csrfToken,
    CsrfInput,
    validateToken,
    regenerateToken,
  };
}

export default useCsrf;
