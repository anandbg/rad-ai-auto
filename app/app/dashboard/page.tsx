import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // This should be caught by middleware, but double-check
  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  return (
    <main id="main-content" className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-text-secondary">
              Welcome back, {user.email}
            </p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="btn-secondary">
              Sign out
            </button>
          </form>
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
    </main>
  );
}
