'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { usePreferences } from '@/lib/preferences/preferences-context';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageWrapper } from '@/components/motion/page-wrapper';
import { FadeIn } from '@/components/motion/fade-in';
import { StaggerContainer } from '@/components/motion/stagger-container';

// Helper to get usage stats from localStorage
function getUsageStats(): { reportsGenerated: number; transcriptionMinutes: number } {
  if (typeof window === 'undefined') return { reportsGenerated: 0, transcriptionMinutes: 0 };
  const stored = localStorage.getItem('ai-rad-usage');
  if (!stored) return { reportsGenerated: 0, transcriptionMinutes: 0 };
  try {
    return JSON.parse(stored);
  } catch {
    return { reportsGenerated: 0, transcriptionMinutes: 0 };
  }
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { preferences, updatePreference } = usePreferences();
  const searchParams = useSearchParams();
  const [showUnauthorizedError, setShowUnauthorizedError] = useState(false);
  const [usageStats, setUsageStats] = useState({ reportsGenerated: 0, transcriptionMinutes: 0 });
  const [savingYolo, setSavingYolo] = useState(false);

  const handleYoloModeToggle = async () => {
    setSavingYolo(true);
    try {
      await updatePreference('yoloMode', !preferences.yoloMode);
    } catch (error) {
      console.error('Failed to toggle YOLO mode:', error);
    } finally {
      setSavingYolo(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setShowUnauthorizedError(true);
      // Clear the error after showing
      setTimeout(() => setShowUnauthorizedError(false), 5000);
    }
  }, [searchParams]);

  // Load usage stats on mount and when window gains focus
  useEffect(() => {
    const loadStats = () => {
      setUsageStats(getUsageStats());
    };
    loadStats();

    // Also reload when the window gains focus (in case reports were generated in another tab)
    window.addEventListener('focus', loadStats);
    // Listen for storage events from other tabs
    window.addEventListener('storage', loadStats);

    return () => {
      window.removeEventListener('focus', loadStats);
      window.removeEventListener('storage', loadStats);
    };
  }, []);

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
    <PageWrapper className="p-8">
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

        <FadeIn>
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-text-secondary">
              Welcome back, {user?.name || user?.email}
            </p>
          </header>
        </FadeIn>

        {/* YOLO Mode Toggle */}
        <FadeIn delay={0.1}>
          <section className="mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">*</span>
                    <h2 className="text-xl font-semibold">YOLO Mode</h2>
                    {preferences.yoloMode && (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    Auto-detect modality, select template, and generate reports with minimal clicks
                  </p>
                </div>
                <button
                  onClick={handleYoloModeToggle}
                  disabled={savingYolo}
                  className={`relative h-11 rounded-full transition-colors ${
                    preferences.yoloMode
                      ? 'bg-success'
                      : 'bg-surface-muted'
                  } ${savingYolo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ width: '52px', minWidth: '52px' }}
                  data-testid="yolo-mode-toggle"
                  aria-label={preferences.yoloMode ? 'Disable YOLO mode' : 'Enable YOLO mode'}
                >
                  <span
                    className={`absolute top-1.5 h-8 w-8 rounded-full bg-white shadow transition-transform ${
                      preferences.yoloMode ? 'left-1' : ''
                    }`}
                    style={{ transform: preferences.yoloMode ? 'translateX(18px)' : 'translateX(4px)' }}
                  />
                </button>
              </div>
              {preferences.yoloMode && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg bg-success/5 p-3 text-sm text-success">
                    <p className="font-medium">YOLO Mode is enabled!</p>
                    <p className="mt-1 text-success/80">
                      Start transcribing and the system will automatically detect the best template and generate your report.
                    </p>
                  </div>
                  <Link
                    href="/transcribe?autostart=true"
                    className="flex items-center justify-center gap-2 rounded-lg bg-success px-6 py-3 font-semibold text-white transition-all hover:bg-success/90 hover:shadow-lg"
                    data-testid="start-yolo-btn"
                  >
                    <span className="text-xl">*</span>
                    <span>Start YOLO Recording</span>
                  </Link>
                </div>
              )}
            </div>
          </section>
        </FadeIn>

        <section className="mb-8">
          <FadeIn delay={0.2}>
            <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          </FadeIn>
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FadeIn>
              <Link
                href="/transcribe"
                className="card block p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-2 text-2xl">*</div>
                <h3 className="font-semibold">New Transcription</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Record or upload audio for transcription
                </p>
              </Link>
            </FadeIn>

            <FadeIn>
              <Link
                href="/generate"
                className="card block p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-2 text-2xl">*</div>
                <h3 className="font-semibold">Generate Report</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Create an AI-powered radiology report
                </p>
              </Link>
            </FadeIn>

            <FadeIn>
              <Link
                href="/templates"
                className="card block p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-2 text-2xl">*</div>
                <h3 className="font-semibold">Browse Templates</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  View and manage your report templates
                </p>
              </Link>
            </FadeIn>
          </StaggerContainer>
        </section>

        <FadeIn delay={0.3}>
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h2 className="mb-4 text-lg font-semibold">Usage This Month</h2>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Reports Generated</span>
                    <span className="text-text-muted" data-testid="reports-count">{usageStats.reportsGenerated} / 10</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full bg-brand transition-all"
                      style={{ width: `${Math.min((usageStats.reportsGenerated / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Transcription Minutes</span>
                    <span className="text-text-muted" data-testid="transcription-minutes">{usageStats.transcriptionMinutes} / 15</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full bg-brand transition-all"
                      style={{ width: `${Math.min((usageStats.transcriptionMinutes / 15) * 100, 100)}%` }}
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
        </FadeIn>
      </div>
    </PageWrapper>
  );
}
