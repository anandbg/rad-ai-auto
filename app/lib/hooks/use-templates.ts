'use client';

import useSWR from 'swr';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// Template interface matching the database schema
interface PersonalTemplate {
  id: string;
  user_id: string;
  name: string;
  modality: string;
  body_part: string;
  description: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

interface GlobalTemplate {
  id: string;
  name: string;
  modality: string;
  body_part: string;
  description: string | null;
  content: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// Fetcher for personal templates
const fetchPersonalTemplates = async (userId: string): Promise<PersonalTemplate[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('templates_personal')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
};

// Fetcher for global templates
const fetchGlobalTemplates = async (): Promise<GlobalTemplate[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('templates_global')
    .select('*')
    .eq('is_published', true)
    .order('name');

  if (error) throw error;
  return data ?? [];
};

/**
 * SWR hook for fetching user's personal templates
 * @param userId - The user ID to fetch templates for (null/undefined skips fetch)
 */
export function usePersonalTemplates(userId: string | undefined) {
  return useSWR(
    userId ? ['personal-templates', userId] : null,
    () => fetchPersonalTemplates(userId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
}

/**
 * SWR hook for fetching published global templates
 */
export function useGlobalTemplates() {
  return useSWR(
    'global-templates',
    fetchGlobalTemplates,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Global templates change less frequently
    }
  );
}

/**
 * Combined hook for fetching both personal and global templates
 * @param userId - The user ID to fetch personal templates for
 */
export function useTemplates(userId: string | undefined) {
  const personal = usePersonalTemplates(userId);
  const global = useGlobalTemplates();

  return {
    personalTemplates: personal.data ?? [],
    globalTemplates: global.data ?? [],
    isLoading: personal.isLoading || global.isLoading,
    error: personal.error || global.error,
    mutatePersonal: personal.mutate,
    mutateGlobal: global.mutate,
  };
}
