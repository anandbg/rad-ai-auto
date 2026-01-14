'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
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
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl">
        {showUnauthorizedError && (
          <div
            className="mb-6 rounded-lg border border-danger/50 bg-danger/10 p-4 text-danger"
            role="alert"
          >
            <p className="font-medium">Access Denied</p>
            <p className="text-sm">You don&apos;t have permission to access that page.</p>
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-text-secondary">
            Welcome back, {user?.name || user?.email}
          </p>
        </header>

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/transcribe"
              className="card p-6 transition-shadow hover:shadow-lg"
            >
              <div className="mb-2 text-2xl">🎤</div>
              <h3 className="font-semibold">New Transcription</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Record or upload audio for transcription
              </p>
            </Link>

            <Link
              href="/generate"
              className="card p-6 transition-shadow hover:shadow-lg"
            >
              <div className="mb-2 text-2xl">📝</div>
              <h3 className="font-semibold">Generate Report</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Create an AI-powered radiology report
              </p>
            </Link>

            <Link
              href="/templates"
              className="card p-6 transition-shadow hover:shadow-lg"
            >
              <div className="mb-2 text-2xl">📋</div>
              <h3 className="font-semibold">Browse Templates</h3>
              <p className="mt-1 text-sm text-text-secondary">
                View and manage your report templates
              </p>
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Usage This Month</h2>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Reports Generated</span>
                  <span className="text-text-muted">0 / 10</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full bg-brand transition-all"
                    style={{ width: '0%' }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Transcription Minutes</span>
                  <span className="text-text-muted">0 / 15</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full bg-brand transition-all"
                    style={{ width: '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Current Plan</h2>
            <div className="mb-4">
              <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
                Free Plan
              </span>
            </div>
            <p className="mb-4 text-sm text-text-secondary">
              10 reports/month, 15 minutes transcription
            </p>
            <Link href="/billing" className="btn-secondary inline-block">
              Upgrade Plan
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
