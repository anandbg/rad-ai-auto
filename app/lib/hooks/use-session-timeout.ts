'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { SESSION_TIMEOUT_MS, SESSION_TIMESTAMP_COOKIE } from '@/lib/auth/session';

// Activity events to track
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

// Storage key for last activity timestamp
const LAST_ACTIVITY_KEY = 'ai-rad-last-activity';

export function useSessionTimeout() {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  // Get last activity from storage
  const getLastActivity = useCallback((): number => {
    if (typeof window === 'undefined') return Date.now();
    const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
    return stored ? parseInt(stored, 10) : Date.now();
  }, []);

  // Update last activity in storage and cookie
  const updateLastActivity = useCallback(() => {
    if (typeof window === 'undefined') return;
    const now = Date.now().toString();
    localStorage.setItem(LAST_ACTIVITY_KEY, now);
    // Also set a cookie so API can check session validity
    document.cookie = `${SESSION_TIMESTAMP_COOKIE}=${now}; path=/; max-age=${Math.floor(SESSION_TIMEOUT_MS / 1000)}`;
  }, []);

  // Check if session has expired
  const checkSessionExpired = useCallback((): boolean => {
    const lastActivity = getLastActivity();
    const timeSinceActivity = Date.now() - lastActivity;
    return timeSinceActivity >= SESSION_TIMEOUT_MS;
  }, [getLastActivity]);

  // Handle session timeout
  const handleTimeout = useCallback(() => {
    console.log('[Session] Session expired due to inactivity');
    // Clear the last activity timestamp
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    // Sign out the user
    signOut();
  }, [signOut]);

  // Reset the timeout timer
  const resetTimeout = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Update last activity
    updateLastActivity();

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, SESSION_TIMEOUT_MS);

    // Optionally set a warning 5 minutes before timeout
    const warningTime = SESSION_TIMEOUT_MS - 5 * 60 * 1000;
    if (warningTime > 0) {
      warningRef.current = setTimeout(() => {
        console.log('[Session] Warning: Session will expire in 5 minutes');
        // Could dispatch a custom event for UI to show warning
        window.dispatchEvent(new CustomEvent('session-warning', {
          detail: { minutesRemaining: 5 }
        }));
      }, warningTime);
    }
  }, [handleTimeout, updateLastActivity]);

  // Handle activity events
  const handleActivity = useCallback(() => {
    if (user) {
      resetTimeout();
    }
  }, [user, resetTimeout]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    // Check if session is already expired on mount
    if (checkSessionExpired()) {
      console.log('[Session] Session already expired, signing out');
      handleTimeout();
      return;
    }

    // Add activity listeners
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timeout setup
    resetTimeout();

    // Cleanup
    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [user, handleActivity, resetTimeout, checkSessionExpired, handleTimeout]);

  // Listen for storage events from other tabs
  useEffect(() => {
    if (!user) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
        // Another tab updated activity, reset our timer
        resetTimeout();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, resetTimeout]);

  return {
    resetTimeout,
    checkSessionExpired,
    getLastActivity,
    SESSION_TIMEOUT_MS,
  };
}

// Hook to get session status for API middleware
export function getSessionStatus() {
  if (typeof window === 'undefined') return { expired: false, lastActivity: null };

  const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!stored) return { expired: false, lastActivity: null };

  const lastActivity = parseInt(stored, 10);
  const timeSinceActivity = Date.now() - lastActivity;
  const expired = timeSinceActivity >= SESSION_TIMEOUT_MS;

  return { expired, lastActivity, timeSinceActivity };
}
