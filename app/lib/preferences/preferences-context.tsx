'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

export type Theme = 'light' | 'dark' | 'system';

interface UserPreferences {
  theme: Theme;
  defaultTemplate: string | null;
  autoSave: boolean;
  compactMode: boolean;
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

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Resolve theme based on preferences and system
  const resolvedTheme = preferences.theme === 'system' ? systemTheme : preferences.theme;

  // Load preferences from localStorage on mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const storageKey = getStorageKey(user?.id);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<UserPreferences>;
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        }
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

    // Save to localStorage (simulates API call to database)
    try {
      const storageKey = getStorageKey(user?.id);
      localStorage.setItem(storageKey, JSON.stringify(newPreferences));

      // Dispatch storage event for other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(newPreferences),
      }));

      // Log for debugging/verification that "API call" was made
      console.log(`[Preferences API] Saved preference: ${key} = ${JSON.stringify(value)}`);
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  }, [preferences, user?.id]);

  return (
    <PreferencesContext.Provider value={{ preferences, isLoading, updatePreference, resolvedTheme }}>
      {children}
    </PreferencesContext.Provider>
  );
}
