'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { MOCK_AUTH_COOKIE, MOCK_USERS, type MockUser } from './mock-auth';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'radiologist' | 'admin';
  specialty?: string;
  institution?: string;
}

// Profile data stored in localStorage
interface UserProfile {
  name: string;
  specialty: string;
  institution: string;
}

function getProfileStorageKey(userId: string): string {
  return `ai-rad-profile-${userId}`;
}

function loadUserProfile(userId: string): Partial<UserProfile> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(getProfileStorageKey(userId));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signOut: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: () => {},
  updateProfile: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      // Check for mock auth first
      const mockUserKey = getCookie(MOCK_AUTH_COOKIE);
      if (mockUserKey && MOCK_USERS[mockUserKey]) {
        const mockUser = MOCK_USERS[mockUserKey];
        // Load profile data from localStorage (may override mock name)
        const storedProfile = loadUserProfile(mockUser.id);
        setUser({
          id: mockUser.id,
          email: mockUser.email,
          name: storedProfile.name || mockUser.name,
          role: mockUser.role,
          specialty: storedProfile.specialty,
          institution: storedProfile.institution,
        });
        setIsLoading(false);
        return;
      }

      // Check for Supabase auth
      if (isSupabaseConfigured()) {
        try {
          const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
          const supabase = createSupabaseBrowserClient();
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          if (supabaseUser) {
            setUser({
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: supabaseUser.email?.split('@')[0] || 'User',
              role: 'radiologist', // Default role, would come from profile
            });
          }
        } catch (error) {
          console.error('Error loading auth user:', error);
        }
      }

      setIsLoading(false);
    };

    loadUser();
  }, []);

  const signOut = async () => {
    // Clear mock auth cookie
    deleteCookie(MOCK_AUTH_COOKIE);

    // Clear Supabase session if configured
    if (isSupabaseConfigured()) {
      try {
        const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }

    setUser(null);
    // Redirect to login
    window.location.href = '/login';
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    if (!user) return;

    // Update user state
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        name: profile.name || prev.name,
        specialty: profile.specialty !== undefined ? profile.specialty : prev.specialty,
        institution: profile.institution !== undefined ? profile.institution : prev.institution,
      };
    });

    // Save to localStorage
    const storageKey = getProfileStorageKey(user.id);
    const currentProfile = loadUserProfile(user.id);
    const updatedProfile = {
      ...currentProfile,
      ...profile,
    };
    localStorage.setItem(storageKey, JSON.stringify(updatedProfile));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
