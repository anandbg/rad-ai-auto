'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { CommandPalette, useKeyboardShortcuts } from '@/components/ui/command-palette';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCommandPaletteOpen, closeCommandPalette } = useKeyboardShortcuts();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main id="main-content" className="flex-1 overflow-auto">
        {children}
      </main>
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={closeCommandPalette} />
    </div>
  );
}
