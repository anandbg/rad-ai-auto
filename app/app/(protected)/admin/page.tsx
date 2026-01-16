'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminStats {
  users: {
    total: number;
    admins: number;
    radiologists: number;
    newThisMonth: number;
  };
  usage: {
    totalReports: number;
    reportsThisMonth: number;
    totalTranscriptions: number;
    transcriptionsThisMonth: number;
  };
  subscriptions: {
    free: number;
    plus: number;
    pro: number;
    activeCount: number;
  };
  templates: {
    globalPublished: number;
    globalDraft: number;
    personalTotal: number;
  };
}

function StatCard({
  title,
  value,
  subtitle
}: {
  title: string;
  value: number | string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border bg-surface-elevated p-4">
      <p className="text-sm text-text-secondary">{title}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-text-tertiary">{subtitle}</p>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const response = await fetch('/api/admin/stats');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || 'Failed to load statistics');
        }

        if (data.success) {
          setStats(data.data);
        } else {
          throw new Error(data.error || 'Failed to load statistics');
        }
      } catch (err) {
        setStatsError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setStatsLoading(false);
      }
    }

    fetchStats();
  }, []);

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

      {/* System Statistics Section */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">System Statistics</h2>
        {statsLoading ? (
          <div className="rounded-xl border bg-surface p-6 text-center">
            <p className="text-text-secondary">Loading statistics...</p>
          </div>
        ) : statsError ? (
          <div className="rounded-xl border border-error/20 bg-error/5 p-6 text-center">
            <p className="text-error">{statsError}</p>
          </div>
        ) : stats ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={stats.users.total}
              subtitle={`+${stats.users.newThisMonth} this month`}
            />
            <StatCard
              title="Reports Generated"
              value={stats.usage.totalReports}
              subtitle={`${stats.usage.reportsThisMonth} this month`}
            />
            <StatCard
              title="Transcriptions"
              value={stats.usage.totalTranscriptions}
              subtitle={`${stats.usage.transcriptionsThisMonth} this month`}
            />
            <StatCard
              title="Active Subscriptions"
              value={stats.subscriptions.activeCount}
              subtitle={`${stats.subscriptions.free} free, ${stats.subscriptions.plus} plus, ${stats.subscriptions.pro} pro`}
            />
          </div>
        ) : null}
      </section>

      {/* Management Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
          <Link href="/admin/users" className="block p-6" data-testid="admin-users-link">
            <div className="mb-3 text-3xl">Users</div>
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
            <div className="mb-3 text-3xl">Templates</div>
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
          <div className="mb-3 text-3xl">Macros</div>
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Global Macros</h2>
          <p className="mb-4 text-sm text-text-secondary">
            Create system-wide transcription macros
          </p>
          <Button variant="secondary" size="sm" disabled>
            Coming Soon
          </Button>
        </Card>

        <Card className="group cursor-pointer transition-shadow hover:shadow-lg">
          <Link href="/admin/institutions" className="block p-6" data-testid="admin-institutions-link">
            <div className="mb-3 text-3xl">Institutions</div>
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
          <div className="mb-3 text-3xl">Settings</div>
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
