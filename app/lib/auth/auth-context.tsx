'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// Activity storage key - must match use-session-timeout.ts
const LAST_ACTIVITY_KEY = 'ai-rad-last-activity';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'radiologist' | 'admin';
  specialty?: string;
  institution?: string;
}

interface UserProfile {
  name: string;
  specialty: string;
  institution: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signOut: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: () => {},
  updateProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Helper to fetch profile and build AuthUser
async function fetchUserProfile(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  supabaseUser: User
): Promise<AuthUser> {
  // Fetch user profile from profiles table with timeout to prevent hanging

  // Add timeout to prevent hanging
  const profilePromise = supabase
    .from('profiles')
    .select('*')
    .eq('user_id', supabaseUser.id)
    .single();

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Profile query timeout')), 5000)
  );

  let profile = null;
  let profileError = null;

  try {
    const result = await Promise.race([profilePromise, timeoutPromise]);
    profile = result.data;
    profileError = result.error;
  } catch {
    // Query timed out - likely due to Supabase client race condition
    profileError = { code: 'TIMEOUT', message: 'Query timed out' };
  }

  // If query timed out, just return basic user info without trying to create profile
  if (profileError && profileError.code === 'TIMEOUT') {
    const defaultName = supabaseUser.user_metadata?.name ||
                        supabaseUser.email?.split('@')[0] ||
                        'User';
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: defaultName,
      role: 'radiologist',
    };
  }

  // If no profile exists, try to create one (handles case where trigger didn't run)
  if (profileError && profileError.code === 'PGRST116') {
    const defaultName = supabaseUser.user_metadata?.name ||
                        supabaseUser.email?.split('@')[0] ||
                        'User';

    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        user_id: supabaseUser.id,
        name: defaultName,
        role: 'radiologist',
      })
      .select()
      .single();

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: newProfile?.name || defaultName,
      role: newProfile?.role || 'radiologist',
      specialty: newProfile?.specialty || undefined,
      institution: newProfile?.institution || undefined,
    };
  }

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: profile?.name || supabaseUser.email?.split('@')[0] || 'User',
    role: profile?.role || 'radiologist',
    specialty: profile?.specialty || undefined,
    institution: profile?.institution || undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  // Get or create supabase client
  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  };

  useEffect(() => {
    const supabase = getSupabase();
    let isMounted = true;

    // Handle session changes - this is the ONLY place we set user state
    const handleSession = async (session: Session | null) => {
      if (!isMounted) return;

      if (!session?.user) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Reset activity timestamp when session is valid (prevents false timeout on browser reopen)
      if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      }

      try {
        const authUser = await fetchUserProfile(supabase, session.user);
        if (isMounted) {
          setUser(authUser);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        if (isMounted) {
          // Still set basic user info even if profile fetch fails
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.email?.split('@')[0] || 'User',
            role: 'radiologist',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener - handles ALL session events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await handleSession(session);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = getSupabase();
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    setUser(null);
    window.location.href = '/login';
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    if (!user) return;

    const supabase = getSupabase();

    // Update profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({
        name: profile.name,
        specialty: profile.specialty,
        institution: profile.institution,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    // Update local user state
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        name: profile.name || prev.name,
        specialty: profile.specialty !== undefined ? profile.specialty : prev.specialty,
        institution: profile.institution !== undefined ? profile.institution : prev.institution,
      };
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
