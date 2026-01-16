'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

export type Theme = 'light' | 'dark' | 'system';

interface UserPreferences {
  theme: Theme;
  defaultTemplate: string | null;
  autoSave: boolean;
  compactMode: boolean;
  yoloMode: boolean;
  onboardingCompleted: boolean;
}

// API response format
interface ApiPreferences {
  theme: Theme;
  defaultTemplate: string | null;
  autoSave: boolean;
  yoloMode: boolean;
  onboardingCompleted: boolean;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
  resolvedTheme: 'light' | 'dark';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  defaultTemplate: null,
  autoSave: true,
  compactMode: false,
  yoloMode: false,
  onboardingCompleted: false,
};

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: DEFAULT_PREFERENCES,
  isLoading: true,
  updatePreference: async () => {},
  resolvedTheme: 'light',
});

export function usePreferences() {
  return useContext(PreferencesContext);
}

function getStorageKey(userId: string | undefined): string {
  return userId ? `ai-rad-preferences-${userId}` : 'ai-rad-preferences';
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Convert API response to full preferences (adding compactMode which is local-only)
function apiToFullPreferences(api: ApiPreferences): UserPreferences {
  return {
    ...api,
    compactMode: false, // Local-only preference, not stored in DB
  };
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const hasLoadedRef = useRef(false);

  // Resolve theme based on preferences and system
  const resolvedTheme = preferences.theme === 'system' ? systemTheme : preferences.theme;

  // Load preferences from API (with localStorage fallback)
  useEffect(() => {
    const loadPreferences = async () => {
      // Skip if we've already loaded for this user
      if (hasLoadedRef.current) return;

      // Wait for auth to finish loading
      if (authLoading) return;

      try {
        const storageKey = getStorageKey(user?.id);

        // If user is authenticated, fetch from API
        if (user?.id) {
          try {
            const response = await fetch('/api/preferences');
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data) {
                const apiPrefs = data.data as ApiPreferences;
                const fullPrefs = apiToFullPreferences(apiPrefs);

                // Load compactMode from localStorage (local-only preference)
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                  try {
                    const localPrefs = JSON.parse(stored) as Partial<UserPreferences>;
                    if (localPrefs.compactMode !== undefined) {
                      fullPrefs.compactMode = localPrefs.compactMode;
                    }
                  } catch {
                    // Ignore parse errors
                  }
                }

                setPreferences(fullPrefs);
                // Also save to localStorage as cache
                localStorage.setItem(storageKey, JSON.stringify(fullPrefs));
                hasLoadedRef.current = true;
                setIsLoading(false);
                return;
              }
            }
          } catch (apiError) {
            console.error('Error fetching preferences from API:', apiError);
            // Fall through to localStorage fallback
          }
        }

        // Fallback: Load from localStorage
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<UserPreferences>;
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        }
        hasLoadedRef.current = true;
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
      setIsLoading(false);
    };

    // Set system theme
    setSystemTheme(getSystemTheme());

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);

    loadPreferences();

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [user?.id, authLoading]);

  // Reset loaded state when user changes
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [user?.id]);

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    }
  }, [resolvedTheme]);

  // Update a single preference
  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    const storageKey = getStorageKey(user?.id);

    // Always save to localStorage (for offline support and local-only prefs)
    try {
      localStorage.setItem(storageKey, JSON.stringify(newPreferences));

      // Dispatch storage event for other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(newPreferences),
      }));
    } catch (localError) {
      console.error('Error saving to localStorage:', localError);
    }

    // Save to API if user is authenticated (skip compactMode which is local-only)
    if (user?.id && key !== 'compactMode') {
      try {
        const response = await fetch('/api/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ [key]: value }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error saving preference to API:', errorData);
          // Don't throw - we already saved to localStorage
        }
      } catch (apiError) {
        console.error('Error saving preference to API:', apiError);
        // Don't throw - we already saved to localStorage
      }
    }
  }, [preferences, user?.id]);

  return (
    <PreferencesContext.Provider value={{ preferences, isLoading, updatePreference, resolvedTheme }}>
      {children}
    </PreferencesContext.Provider>
  );
}
