'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/transcribe', label: 'Transcribe', icon: '🎤' },
  { href: '/generate', label: 'Generate', icon: '📝' },
  { href: '/templates', label: 'Templates', icon: '📋' },
  { href: '/brand-templates', label: 'Branding', icon: '🎨' },
  { href: '/macros', label: 'Macros', icon: '⚡' },
  { href: '/billing', label: 'Billing', icon: '💳' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
  { href: '/admin', label: 'Admin', icon: '🔐', adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-surface">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🩻</span>
          <span className="font-semibold">AI Radiologist</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-brand/10 text-brand font-medium'
                      : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user?.name || 'Loading...'}</p>
            <p className="truncate text-xs text-text-muted">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="btn-secondary w-full text-sm"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
