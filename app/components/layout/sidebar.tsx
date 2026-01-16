'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '>' },
  { href: '/transcribe', label: 'Transcribe', icon: '>' },
  { href: '/generate', label: 'Generate', icon: '>' },
  { href: '/templates', label: 'Templates', icon: '>' },
  { href: '/brand-templates', label: 'Branding', icon: '>' },
  { href: '/macros', label: 'Macros', icon: '>' },
  { href: '/productivity', label: 'Productivity', icon: '>' },
  { href: '/billing', label: 'Billing', icon: '>' },
  { href: '/settings', label: 'Settings', icon: '>' },
  { href: '/admin', label: 'Admin', icon: '>', adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <>
      {/* Mobile hamburger button - 44x44px minimum touch target */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-3 left-3 z-50 flex h-11 w-11 items-center justify-center rounded-lg bg-surface border shadow-md md:hidden"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        data-testid="mobile-menu-button"
      >
        {isMobileMenuOpen ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile overlay with backdrop blur */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r bg-surface
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
      {/* Logo - 44px minimum touch target */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 min-h-[44px] px-2 rounded-lg hover:bg-surface-muted transition-colors">
          <span className="text-xl">+</span>
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
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 min-h-[44px] text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-brand/10 text-brand font-medium'
                      : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary hover:translate-x-0.5'
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
      <div className="border-t p-4" ref={userMenuRef}>
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="mb-3 flex w-full items-center gap-3 rounded-lg p-2 hover:bg-surface-muted transition-all duration-150 cursor-pointer hover:scale-[1.01]"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
            data-testid="user-menu-trigger"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <p className="truncate text-sm font-medium">{user?.name || 'Loading...'}</p>
              <p className="truncate text-xs text-text-muted">{user?.email}</p>
            </div>
            <svg
              className={`h-4 w-4 text-text-muted transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu with animation */}
          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border bg-surface shadow-lg overflow-hidden"
              >
                <Link
                  href="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-surface-muted transition-colors"
                  data-testid="user-menu-profile"
                >
                  <span>@</span>
                  <span>Profile & Settings</span>
                </Link>
                <hr className="border-surface-muted" />
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-danger hover:bg-surface-muted transition-colors"
                >
                  <span>!</span>
                  <span>Sign out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
    </>
  );
}
