/**
 * Server-side request deduplication utilities.
 *
 * This module provides caching utilities for Server Components using
 * React's cache function (available in React 18+ when used with Next.js 14+).
 *
 * Note: React.cache is automatically available in Server Components via Next.js.
 * This file provides type-safe wrappers and documentation for consistent usage.
 */

// React.cache is available in Next.js Server Components via the 'react' package
// Dynamic require needed for React.cache access in Server Components
const reactCache: <T, Args extends unknown[]>(fn: (...args: Args) => Promise<T>) => (...args: Args) => Promise<T> =
  typeof require !== 'undefined' ? require('react').cache : (fn: unknown) => fn;

/**
 * Wraps a query function with React.cache for server-side request deduplication.
 * Multiple calls with same arguments in the same request will only execute once.
 *
 * This utility leverages React's built-in `cache` function which:
 * - Deduplicates requests within a single server render
 * - Automatically invalidates at the end of each request
 * - Works with async functions in Server Components
 *
 * @example
 * ```typescript
 * const getCachedUser = cachedQuery(async (userId: string) => {
 *   const { data } = await supabase.from('users').select('*').eq('id', userId).single();
 *   return data;
 * });
 *
 * // In Server Components - both calls resolve to one database query
 * const user1 = await getCachedUser('123');
 * const user2 = await getCachedUser('123'); // Uses cached result
 * ```
 *
 * @param queryFn The async function to cache
 * @returns Cached version of the function
 */
export function cachedQuery<T, Args extends unknown[]>(
  queryFn: (...args: Args) => Promise<T>
): (...args: Args) => Promise<T> {
  return reactCache(queryFn);
}

/**
 * Common cached queries for server components.
 * Add frequently used queries here as the codebase evolves.
 *
 * Example usage for future implementation:
 * ```typescript
 * export const getCachedSubscription = cachedQuery(async (userId: string) => {
 *   const supabase = createSupabaseServerClient();
 *   const { data } = await supabase
 *     .from('subscriptions')
 *     .select('*')
 *     .eq('user_id', userId)
 *     .single();
 *   return data;
 * });
 * ```
 */

// Pre-cached common queries will be added here when converting
// client components to server components in future phases
