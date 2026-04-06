import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Use isSingleton: true to ensure only one client instance is created
  // This prevents lock conflicts in @supabase/auth-js when multiple
  // components/functions call createSupabaseBrowserClient()
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    isSingleton: true,
  });
}
