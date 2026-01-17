'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/shared/cn';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - always visible on desktop, collapsible */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Workspace - flexible width */}
      <main
        id="main-content"
        className={cn(
          "flex-1 overflow-auto",
          "pt-16 md:pt-0" // Account for mobile header
        )}
      >
        {children}
      </main>
    </div>
  );
}
