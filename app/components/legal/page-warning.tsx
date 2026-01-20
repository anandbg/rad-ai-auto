'use client';

import { Info } from 'lucide-react';

type WarningVariant = 'dashboard' | 'transcription' | 'report' | 'template';

interface PageWarningProps {
  variant: WarningVariant;
  className?: string;
}

const variantText: Record<WarningVariant, string> = {
  dashboard: 'This is a drafting tool. Do not enter patient-identifiable or personal information.',
  transcription: 'Audio is processed by AI and not stored. Do not dictate personal identifiers.',
  report: 'AI-generated draft. Review and verify all content before use.',
  template: 'Templates should not contain personal information.',
};

/**
 * Context-specific warning component for key pages.
 * Uses blue/info styling to distinguish from the amber app-wide banner.
 * Non-dismissible - users should always see these warnings.
 */
export function PageWarning({ variant, className = '' }: PageWarningProps) {
  const text = variantText[variant];

  return (
    <div
      role="note"
      className={`flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20 ${className}`}
    >
      <Info
        className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
        aria-hidden="true"
      />
      <p className="text-sm text-blue-800 dark:text-blue-200">
        {text}
      </p>
    </div>
  );
}
