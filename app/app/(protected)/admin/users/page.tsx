'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  specialty?: string;
  institution?: string;
  createdAt: string;
  lastActive: string;
}

interface Subscription {
  user_id: string;
  plan_type: string;
  status: string;
}

interface UserWithPlan extends User {
  plan: string;
  status: string;
}

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
  const [users, setUsers] = useState<UserWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      // Fetch users from API
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const result = await response.json();
      const userData: User[] = result.data || [];

      // Fetch subscriptions
      const supabase = createSupabaseBrowserClient();
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('user_id, plan_type, status');

      // Merge users with subscription data
      const subscriptionMap = new Map<string, Subscription>();
      (subscriptions || []).forEach(sub => {
        subscriptionMap.set(sub.user_id, sub);
      });

      const usersWithPlans: UserWithPlan[] = userData.map(user => {
        const sub = subscriptionMap.get(user.id);
        return {
          ...user,
          plan: sub?.plan_type || 'free',
          status: sub?.status || 'active',
        };
      });

      setUsers(usersWithPlans);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    setActionLoading(userId);
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating role:', error);
    } else {
      await loadUsers();
    }
    setActionLoading(null);
  };

  const activeUsers = users.filter(u => u.status === 'active');
  const inactiveUsers = users.filter(u => u.status !== 'active');

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto" />
          <p className="text-text-secondary">Loading users...</p>
        </div>
      </div>
    );
  }

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
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-text-primary">{users.length}</div>
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
              {users.filter(u => u.plan === 'pro').length}
            </div>
            <div className="text-sm text-text-secondary">Pro Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-warning">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-text-secondary">Admins</div>
          </CardContent>
        </Card>
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-text-secondary">No users found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active User List */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">
              Active Users ({activeUsers.length})
            </h2>
            {activeUsers.length === 0 ? (
              <p className="text-sm text-text-muted">No active users</p>
            ) : (
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
                            <div className="font-medium text-text-primary">{user.name || 'No name'}</div>
                            <div className="text-sm text-text-secondary">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {user.institution || '-'}
                        </td>
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
                          {user.lastActive ? formatDate(user.lastActive) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {user.role !== 'admin' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateRole(user.id, 'admin')}
                                disabled={actionLoading === user.id}
                              >
                                Make Admin
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateRole(user.id, 'radiologist')}
                                disabled={actionLoading === user.id}
                              >
                                Remove Admin
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {inactiveUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-surface-muted/50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-text-primary">{user.name || 'No name'}</div>
                            <div className="text-sm text-text-secondary">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {user.institution || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPlanBadgeClass(user.plan)}`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {user.lastActive ? formatDate(user.lastActive) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-warning/10 text-warning">
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
