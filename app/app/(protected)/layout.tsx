'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { CommandPalette, useKeyboardShortcuts } from '@/components/ui/command-palette';
import { useSessionTimeout } from '@/lib/hooks/use-session-timeout';
import { FirstUseAcknowledgmentModal } from '@/components/legal/first-use-acknowledgment-modal';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCommandPaletteOpen, closeCommandPalette } = useKeyboardShortcuts();
  const [showAcknowledgment, setShowAcknowledgment] = useState(false);
  const [isCheckingAcknowledgment, setIsCheckingAcknowledgment] = useState(true);

  // Initialize session timeout tracking
  useSessionTimeout();

  // Check if user has acknowledged terms
  useEffect(() => {
    async function checkAcknowledgment() {
      try {
        const supabase = createSupabaseBrowserClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // No user - will be redirected by middleware
          setIsCheckingAcknowledgment(false);
          return;
        }

        // Check if user has acknowledged terms
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('terms_acknowledged_at')
          .eq('user_id', user.id)
          .single();

        if (error) {
          // Log error but fail open for UX
          console.error('[Acknowledgment Check] Profile query failed:', error);
          setIsCheckingAcknowledgment(false);
          return;
        }

        // Show modal if not yet acknowledged
        if (!profile?.terms_acknowledged_at) {
          setShowAcknowledgment(true);
        }
      } catch (err) {
        console.error('[Acknowledgment Check] Unexpected error:', err);
      } finally {
        setIsCheckingAcknowledgment(false);
      }
    }

    checkAcknowledgment();
  }, []);

  const handleAcknowledge = () => {
    setShowAcknowledgment(false);
  };

  return (
    <>
      <AppShell>
        {children}
      </AppShell>
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={closeCommandPalette} />

      {/* First-use acknowledgment modal - non-dismissible */}
      {!isCheckingAcknowledgment && (
        <FirstUseAcknowledgmentModal
          open={showAcknowledgment}
          onAcknowledge={handleAcknowledge}
        />
      )}
    </>
  );
}
