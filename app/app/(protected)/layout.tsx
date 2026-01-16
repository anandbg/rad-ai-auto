'use client';

import { AppShell } from '@/components/layout/app-shell';
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
    <>
      <AppShell>
        {children}
      </AppShell>
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={closeCommandPalette} />
    </>
  );
}
