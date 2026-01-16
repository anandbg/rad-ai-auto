'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageWrapper } from '@/components/motion/page-wrapper';
import { ReportWorkspace } from '@/components/workspace/report-workspace';

export default function DashboardPage() {
  const { isLoading } = useAuth();
  const searchParams = useSearchParams();
  const [showUnauthorizedError, setShowUnauthorizedError] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setShowUnauthorizedError(true);
      // Clear the error after showing
      setTimeout(() => setShowUnauthorizedError(false), 5000);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">...</div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper className="h-full">
      {showUnauthorizedError && (
        <div
          className="m-4 rounded-lg border border-danger/50 bg-danger/10 p-4 text-danger"
          role="alert"
        >
          <p className="font-medium">Access Denied</p>
          <p className="text-sm">You don&apos;t have permission to access that page.</p>
        </div>
      )}
      <ReportWorkspace />
    </PageWrapper>
  );
}
