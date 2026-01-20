'use client';

import { AlertTriangle } from 'lucide-react';

/**
 * Persistent disclaimer banner displayed on all authenticated pages.
 * Non-dismissible - users must always see this warning.
 */
export function DisclaimerBanner() {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="w-full bg-amber-50 border-b border-amber-200 shadow-sm"
    >
      <div className="flex items-center justify-center gap-2 px-4 py-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-sm text-amber-800">
          <span className="font-medium">Warning:</span> Do not upload personal data. AI-generated content requires review. Use at your own risk.
        </p>
      </div>
    </div>
  );
}
