'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseUnsavedChangesOptions {
  isDirty: boolean;
  message?: string;
  onConfirmLeave?: () => void;
}

interface UseUnsavedChangesReturn {
  showDialog: boolean;
  pendingNavigation: string | null;
  handleStay: () => void;
  handleLeave: () => void;
  setIsDirty: (value: boolean) => void;
}

export function useUnsavedChanges({
  isDirty,
  message = 'You have unsaved changes. Are you sure you want to leave?',
  onConfirmLeave,
}: UseUnsavedChangesOptions): UseUnsavedChangesReturn {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [internalIsDirty, setInternalIsDirty] = useState(isDirty);
  const isNavigatingRef = useRef(false);

  // Sync internal state with prop
  useEffect(() => {
    setInternalIsDirty(isDirty);
  }, [isDirty]);

  // Handle browser beforeunload event (refresh, close tab)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (internalIsDirty) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [internalIsDirty, message]);

  // Intercept link clicks to show dialog
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!internalIsDirty || isNavigatingRef.current) return;

      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href) {
        const url = new URL(link.href);
        const currentUrl = new URL(window.location.href);

        // Only intercept internal navigation
        if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
          e.preventDefault();
          e.stopPropagation();
          setPendingNavigation(url.pathname);
          setShowDialog(true);
        }
      }
    };

    // Use capture phase to intercept before other handlers
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [internalIsDirty]);

  const handleStay = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  const handleLeave = useCallback(() => {
    if (onConfirmLeave) {
      onConfirmLeave();
    }

    isNavigatingRef.current = true;
    setInternalIsDirty(false);
    setShowDialog(false);

    if (pendingNavigation) {
      router.push(pendingNavigation);
    }

    setPendingNavigation(null);
  }, [pendingNavigation, router, onConfirmLeave]);

  return {
    showDialog,
    pendingNavigation,
    handleStay,
    handleLeave,
    setIsDirty: setInternalIsDirty,
  };
}
