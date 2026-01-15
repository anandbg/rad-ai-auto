'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Mock users for development
const mockUsers = [
  {
    id: 'user-001',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@hospital.com',
    role: 'radiologist',
    institution: 'City Medical Center',
    plan: 'pro',
    status: 'active',
    lastActive: '2024-01-14T08:30:00Z',
    createdAt: '2023-11-15T10:00:00Z',
  },
  {
    id: 'user-002',
    name: 'Dr. Michael Chen',
    email: 'michael.chen@radiology.com',
    role: 'radiologist',
    institution: 'Metro Radiology Associates',
    plan: 'plus',
    status: 'active',
    lastActive: '2024-01-13T16:45:00Z',
    createdAt: '2023-12-01T14:30:00Z',
  },
  {
    id: 'user-003',
    name: 'Dr. Emily Williams',
    email: 'emily.williams@healthcare.org',
    role: 'radiologist',
    institution: 'Regional Hospital Network',
    plan: 'free',
    status: 'active',
    lastActive: '2024-01-12T09:15:00Z',
    createdAt: '2024-01-02T11:00:00Z',
  },
  {
    id: 'user-004',
    name: 'Admin User',
    email: 'admin@airad.com',
    role: 'admin',
    institution: 'AI Radiologist',
    plan: 'pro',
    status: 'active',
    lastActive: '2024-01-14T10:00:00Z',
    createdAt: '2023-10-01T09:00:00Z',
  },
  {
    id: 'user-005',
    name: 'Dr. Robert Davis',
    email: 'robert.davis@clinic.com',
    role: 'radiologist',
    institution: 'Downtown Clinic',
    plan: 'plus',
    status: 'inactive',
    lastActive: '2023-12-20T14:00:00Z',
    createdAt: '2023-11-20T16:30:00Z',
  },
];

function getPlanBadgeClass(plan: string) {
  switch (plan) {
    case 'pro':
      return 'bg-brand/10 text-brand';
    case 'plus':
      return 'bg-info/10 text-info';
    default:
      return 'bg-surface-muted text-text-secondary';
  }
}

function getRoleBadgeClass(role: string) {
  return role === 'admin' ? 'bg-warning/10 text-warning' : 'bg-surface-muted text-text-secondary';
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminUsersPage() {
  const activeUsers = mockUsers.filter(u => u.status === 'active');
  const inactiveUsers = mockUsers.filter(u => u.status === 'inactive');

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/admin" className="hover:text-text-primary">
          Admin
        </Link>
        <span>/</span>
        <span className="text-text-primary">Users</span>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
          <p className="mt-1 text-text-secondary">
            View and manage all registered users
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Export Users
          </Button>
          <Button>
            + Invite User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-text-primary">{mockUsers.length}</div>
            <div className="text-sm text-text-secondary">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-success">{activeUsers.length}</div>
            <div className="text-sm text-text-secondary">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-brand">
              {mockUsers.filter(u => u.plan === 'pro').length}
            </div>
            <div className="text-sm text-text-secondary">Pro Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-warning">
              {mockUsers.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-text-secondary">Admins</div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Active Users ({activeUsers.length})
        </h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[700px]">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Institution</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Plan</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Last Active</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-text-primary">{user.name}</div>
                      <div className="text-sm text-text-secondary">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{user.institution}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPlanBadgeClass(user.plan)}`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {formatDate(user.lastActive)}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inactive Users */}
      {inactiveUsers.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-text-secondary">
            Inactive Users ({inactiveUsers.length})
          </h2>
          <div className="overflow-x-auto rounded-xl border opacity-60">
            <table className="w-full min-w-[600px]">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Institution</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Plan</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Last Active</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inactiveUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-muted/50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-text-primary">{user.name}</div>
                        <div className="text-sm text-text-secondary">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{user.institution}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPlanBadgeClass(user.plan)}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {formatDate(user.lastActive)}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">
                        Reactivate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
