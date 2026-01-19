'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { PageWrapper } from '@/components/motion/page-wrapper';
import { ReportWorkspace } from '@/components/workspace/report-workspace';

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const [showUnauthorizedError, setShowUnauthorizedError] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setShowUnauthorizedError(true);
      // Clear the error after showing
      setTimeout(() => setShowUnauthorizedError(false), 5000);
    }
  }, [searchParams]);

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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><span className="animate-pulse">Loading...</span></div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
