'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
        const supabase = createSupabaseBrowserClient();

        // Get authenticated user
        const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !supabaseUser) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Fetch user profile from profiles table
        const profileResult = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', supabaseUser.id)
          .single();
        let profile = profileResult.data;
        const profileError = profileResult.error;

        // If no profile exists, try to create one (handles case where trigger didn't run)
        if (profileError && profileError.code === 'PGRST116') {
          const defaultName = supabaseUser.user_metadata?.name ||
                              supabaseUser.email?.split('@')[0] ||
                              'User';

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: supabaseUser.id,
              name: defaultName,
              role: 'radiologist',
            })
            .select()
            .single();

          if (!insertError) {
            profile = newProfile;
          } else {
            console.error('Error creating profile:', insertError);
          }
        }

        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: profile?.name || supabaseUser.email?.split('@')[0] || 'User',
          role: profile?.role || 'radiologist',
          specialty: profile?.specialty || undefined,
          institution: profile?.institution || undefined,
        });
      } catch (error) {
        console.error('Error loading auth user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Listen for auth state changes
    let subscription: { unsubscribe: () => void } | null = null;

    const setupAuthListener = async () => {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = createSupabaseBrowserClient();

      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_OUT') {
            setUser(null);
          } else if (event === 'SIGNED_IN' && session?.user) {
            // Reload user data on sign in
            const profileResult = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            let profile = profileResult.data;
            const profileError = profileResult.error;

            // If no profile exists, try to create one
            if (profileError && profileError.code === 'PGRST116') {
              const defaultName = session.user.user_metadata?.name ||
                                  session.user.email?.split('@')[0] ||
                                  'User';

              const { data: newProfile } = await supabase
                .from('profiles')
                .insert({
                  user_id: session.user.id,
                  name: defaultName,
                  role: 'radiologist',
                })
                .select()
                .single();

              if (newProfile) {
                profile = newProfile;
              }
            }

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: profile?.name || session.user.email?.split('@')[0] || 'User',
              role: profile?.role || 'radiologist',
              specialty: profile?.specialty || undefined,
              institution: profile?.institution || undefined,
            });
          }
        }
      );
      subscription = sub;
    };

    setupAuthListener();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }

    setUser(null);
    window.location.href = '/login';
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = createSupabaseBrowserClient();

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
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
