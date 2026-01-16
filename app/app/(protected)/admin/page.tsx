'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">Loading...</div>
          <p className="text-text-secondary">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="mt-1 text-text-secondary">
          Manage users, templates, and system settings
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
          <Link href="/admin/users" className="block p-6" data-testid="admin-users-link">
            <div className="mb-3 text-3xl">👥</div>
            <h2 className="mb-2 text-lg font-semibold text-text-primary group-hover:text-brand">
              User Management
            </h2>
            <p className="mb-4 text-sm text-text-secondary">
              View and manage all registered users
            </p>
            <Button variant="secondary" size="sm">
              Manage Users
            </Button>
          </Link>
        </Card>

        <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
          <Link href="/admin/templates" className="block p-6" data-testid="admin-templates-link">
            <div className="mb-3 text-3xl">📋</div>
            <h2 className="mb-2 text-lg font-semibold text-text-primary group-hover:text-brand">
              Global Templates
            </h2>
            <p className="mb-4 text-sm text-text-secondary">
              Create and manage global templates
            </p>
            <Button variant="secondary" size="sm">
              Manage Templates
            </Button>
          </Link>
        </Card>

        <Card className="p-6">
          <div className="mb-3 text-3xl">⚡</div>
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Global Macros</h2>
          <p className="mb-4 text-sm text-text-secondary">
            Create system-wide transcription macros
          </p>
          <Button variant="secondary" size="sm" disabled>
            Coming Soon
          </Button>
        </Card>

        <Card className="p-6">
          <div className="mb-3 text-3xl">📊</div>
          <h2 className="mb-2 text-lg font-semibold text-text-primary">System Statistics</h2>
          <p className="mb-4 text-sm text-text-secondary">
            View usage metrics and analytics
          </p>
          <Button variant="secondary" size="sm" disabled>
            Coming Soon
          </Button>
        </Card>

        <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
          <Link href="/admin/institutions" className="block p-6" data-testid="admin-institutions-link">
            <div className="mb-3 text-3xl">🏢</div>
            <h2 className="mb-2 text-lg font-semibold text-text-primary group-hover:text-brand">
              Institutions
            </h2>
            <p className="mb-4 text-sm text-text-secondary">
              Manage registered institutions
            </p>
            <Button variant="secondary" size="sm">
              Manage Institutions
            </Button>
          </Link>
        </Card>

        <Card className="p-6">
          <div className="mb-3 text-3xl">⚙️</div>
          <h2 className="mb-2 text-lg font-semibold text-text-primary">System Settings</h2>
          <p className="mb-4 text-sm text-text-secondary">
            Configure application settings
          </p>
          <Button variant="secondary" size="sm" disabled>
            Coming Soon
          </Button>
        </Card>
      </div>

      <div className="mt-8 rounded-xl border bg-info/5 p-4">
        <p className="text-sm text-info">
          <strong>Admin Info:</strong> You are logged in as {user?.name} ({user?.email}) with role: <span className="font-semibold">{user?.role}</span>
        </p>
      </div>
    </div>
  );
}
