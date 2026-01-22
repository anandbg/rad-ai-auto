'use client';

import useSWR from 'swr';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// Subscription interface matching the database schema
interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  updated_at: string;
}

// Default subscription for users without one
const DEFAULT_SUBSCRIPTION = {
  plan: 'free',
  status: 'active',
} as const;

// Usage stats interface
interface UsageStats {
  reportsGenerated: number;
  transcriptionMinutes: number;
  templateCount: number;
}

// Fetcher for subscription data
const fetchSubscription = async (userId: string): Promise<Subscription | typeof DEFAULT_SUBSCRIPTION> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  // PGRST116 = no rows found, which is fine (user is on free plan)
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? DEFAULT_SUBSCRIPTION;
};

// Fetcher for usage statistics
const fetchUsageStats = async (userId: string): Promise<UsageStats> => {
  const supabase = createSupabaseBrowserClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [creditsResult, templateCountResult] = await Promise.all([
    supabase
      .from('credits_ledger')
      .select('delta, reason, meta')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth)
      .lt('delta', 0), // Deductions are negative
    supabase
      .from('templates_personal')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  const creditsUsed = creditsResult.data ?? [];

  // Count reports by checking meta.type === 'report'
  const reportsGenerated = creditsUsed.filter(
    (c) => c.reason === 'debit' && (c.meta as { type?: string })?.type === 'report'
  ).length;

  // Sum transcription minutes from meta.minutes or abs(delta)
  const transcriptionMinutes = creditsUsed
    .filter((c) => c.reason === 'debit' && (c.meta as { type?: string })?.type === 'transcription')
    .reduce((sum, c) => sum + ((c.meta as { minutes?: number })?.minutes || Math.abs(c.delta)), 0);

  return {
    reportsGenerated,
    transcriptionMinutes,
    templateCount: templateCountResult.count ?? 0,
  };
};

/**
 * SWR hook for fetching user's subscription
 * @param userId - The user ID to fetch subscription for (null/undefined skips fetch)
 */
export function useSubscription(userId: string | undefined) {
  return useSWR(
    userId ? ['subscription', userId] : null,
    () => fetchSubscription(userId!),
    { revalidateOnFocus: false }
  );
}

/**
 * SWR hook for fetching user's usage statistics for the current billing period
 * @param userId - The user ID to fetch stats for (null/undefined skips fetch)
 */
export function useUsageStats(userId: string | undefined) {
  return useSWR(
    userId ? ['usage-stats', userId] : null,
    () => fetchUsageStats(userId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 10s deduping to avoid excessive queries
    }
  );
}
