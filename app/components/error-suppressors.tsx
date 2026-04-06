'use client';

import { useEffect } from 'react';

/**
 * Suppresses known benign errors that appear in development but don't affect functionality.
 *
 * Currently suppresses:
 * - AbortError from Supabase auth-js locks.js: This occurs when browser lock operations
 *   are aborted during navigation or when multiple auth operations happen. It's a known
 *   issue with the navigator.locks API that doesn't affect auth functionality.
 */
export function ErrorSuppressors() {
  useEffect(() => {
    // Suppress AbortError from Supabase auth-js locks
    const handleError = (event: ErrorEvent) => {
      if (
        event.error?.name === 'AbortError' &&
        event.error?.message?.includes('signal is aborted')
      ) {
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.name === 'AbortError' &&
        event.reason?.message?.includes('signal is aborted')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
