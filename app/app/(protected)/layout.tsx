'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { CommandPalette, useKeyboardShortcuts } from '@/components/ui/command-palette';
import { useSessionTimeout } from '@/lib/hooks/use-session-timeout';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCommandPaletteOpen, closeCommandPalette } = useKeyboardShortcuts();

  // Initialize session timeout tracking
  useSessionTimeout();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main id="main-content" className="flex-1 overflow-auto pt-16 md:pt-0">
        {children}
      </main>
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={closeCommandPalette} />
    </div>
  );
}
