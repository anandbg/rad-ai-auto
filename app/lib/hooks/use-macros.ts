'use client';

import useSWR from 'swr';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// Context expansion interface
interface ContextExpansion {
  bodyPart: string;
  text: string;
}

// Macro interface matching the database schema
interface Macro {
  id: string;
  user_id: string;
  name: string;
  replacement_text: string;
  is_active: boolean;
  category_id: string | null;
  is_smart_macro: boolean;
  context_expansions: ContextExpansion[] | null;
  created_at: string;
  updated_at: string;
  macro_categories?: MacroCategory | null;
}

// Macro category interface
interface MacroCategory {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// Fetcher for user's macros with category join
const fetchMacros = async (userId: string): Promise<Macro[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('macros')
    .select('*, macro_categories(*)')
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;
  return data ?? [];
};

// Fetcher for macro categories
const fetchMacroCategories = async (userId: string): Promise<MacroCategory[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('macro_categories')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;
  return data ?? [];
};

/**
 * SWR hook for fetching user's macros
 * @param userId - The user ID to fetch macros for (null/undefined skips fetch)
 */
export function useMacros(userId: string | undefined) {
  return useSWR(
    userId ? ['macros', userId] : null,
    () => fetchMacros(userId!),
    { revalidateOnFocus: false }
  );
}

/**
 * SWR hook for fetching user's macro categories
 * @param userId - The user ID to fetch categories for (null/undefined skips fetch)
 */
export function useMacroCategories(userId: string | undefined) {
  return useSWR(
    userId ? ['macro-categories', userId] : null,
    () => fetchMacroCategories(userId!),
    { revalidateOnFocus: false }
  );
}
