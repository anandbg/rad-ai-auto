'use client';

import { useAuth } from '@/lib/auth/auth-context';

export default function AdminPage() {
  const { user, isLoading } = useAuth();

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
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-text-secondary">
            Manage users, templates, and system settings
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="card p-6">
            <div className="mb-3 text-3xl">👥</div>
            <h2 className="mb-2 text-lg font-semibold">User Management</h2>
            <p className="mb-4 text-sm text-text-secondary">
              View and manage all registered users
            </p>
            <button className="btn-secondary">Manage Users</button>
          </div>

          <div className="card p-6">
            <div className="mb-3 text-3xl">📋</div>
            <h2 className="mb-2 text-lg font-semibold">Global Templates</h2>
            <p className="mb-4 text-sm text-text-secondary">
              Create and manage global templates
            </p>
            <button className="btn-secondary">Manage Templates</button>
          </div>

          <div className="card p-6">
            <div className="mb-3 text-3xl">⚡</div>
            <h2 className="mb-2 text-lg font-semibold">Global Macros</h2>
            <p className="mb-4 text-sm text-text-secondary">
              Create system-wide transcription macros
            </p>
            <button className="btn-secondary">Manage Macros</button>
          </div>

          <div className="card p-6">
            <div className="mb-3 text-3xl">📊</div>
            <h2 className="mb-2 text-lg font-semibold">System Statistics</h2>
            <p className="mb-4 text-sm text-text-secondary">
              View usage metrics and analytics
            </p>
            <button className="btn-secondary">View Stats</button>
          </div>

          <div className="card p-6">
            <div className="mb-3 text-3xl">🏢</div>
            <h2 className="mb-2 text-lg font-semibold">Institutions</h2>
            <p className="mb-4 text-sm text-text-secondary">
              Manage registered institutions
            </p>
            <button className="btn-secondary">Manage Institutions</button>
          </div>

          <div className="card p-6">
            <div className="mb-3 text-3xl">⚙️</div>
            <h2 className="mb-2 text-lg font-semibold">System Settings</h2>
            <p className="mb-4 text-sm text-text-secondary">
              Configure application settings
            </p>
            <button className="btn-secondary">Settings</button>
          </div>
        </div>

        <div className="mt-8 rounded-lg border bg-info/10 p-4">
          <p className="text-sm text-info">
            <strong>Admin Info:</strong> You are logged in as {user?.name} ({user?.email}) with role: {user?.role}
          </p>
        </div>
      </div>
    </div>
  );
}
