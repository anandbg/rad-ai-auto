/**
 * Draft storage utility for localStorage-based persistence.
 * Provides type-safe access with JSON serialization.
 *
 * Usage:
 * - saveDraft('report', { text: '...' })
 * - const draft = loadDraft<ReportDraft>('report')
 * - clearDraft('report')
 */

const DRAFT_PREFIX = 'airad_draft_';

interface DraftMetadata {
  savedAt: string;
  version: number;
}

interface StoredDraft<T> {
  data: T;
  metadata: DraftMetadata;
}

/**
 * Save a draft to localStorage
 * @param key - Unique key for this draft
 * @param data - Data to save
 */
export function saveDraft<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;

  const stored: StoredDraft<T> = {
    data,
    metadata: {
      savedAt: new Date().toISOString(),
      version: 1,
    },
  };

  try {
    localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify(stored));
  } catch (error) {
    // Handle quota exceeded or other storage errors
    console.warn('Failed to save draft:', error);
  }
}

/**
 * Load a draft from localStorage
 * @param key - Unique key for this draft
 * @returns The saved data or null if not found
 */
export function loadDraft<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + key);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredDraft<T>;
    return stored.data;
  } catch {
    return null;
  }
}

/**
 * Check if a draft exists
 * @param key - Unique key for this draft
 * @returns True if draft exists
 */
export function hasDraft(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DRAFT_PREFIX + key) !== null;
}

/**
 * Get draft metadata (savedAt, version)
 * @param key - Unique key for this draft
 * @returns Metadata or null if not found
 */
export function getDraftMetadata(key: string): DraftMetadata | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + key);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredDraft<unknown>;
    return stored.metadata;
  } catch {
    return null;
  }
}

/**
 * Clear a specific draft
 * @param key - Unique key for this draft
 */
export function clearDraft(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRAFT_PREFIX + key);
}

/**
 * Clear all drafts
 */
export function clearAllDrafts(): void {
  if (typeof window === 'undefined') return;

  const keys = Object.keys(localStorage).filter(k => k.startsWith(DRAFT_PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
}

/**
 * Get all draft keys (without prefix)
 * @returns Array of draft keys
 */
export function listDraftKeys(): string[] {
  if (typeof window === 'undefined') return [];

  return Object.keys(localStorage)
    .filter(k => k.startsWith(DRAFT_PREFIX))
    .map(k => k.replace(DRAFT_PREFIX, ''));
}

/**
 * Get all drafts with their data
 * @returns Record of key to draft data
 */
export function getAllDrafts<T>(): Record<string, T> {
  if (typeof window === 'undefined') return {};

  const keys = listDraftKeys();
  const drafts: Record<string, T> = {};

  for (const key of keys) {
    const data = loadDraft<T>(key);
    if (data !== null) {
      drafts[key] = data;
    }
  }

  return drafts;
}

/**
 * Get the age of a draft in milliseconds
 * @param key - Unique key for this draft
 * @returns Age in milliseconds or null if not found
 */
export function getDraftAge(key: string): number | null {
  const metadata = getDraftMetadata(key);
  if (!metadata) return null;

  return Date.now() - new Date(metadata.savedAt).getTime();
}

/**
 * Check if a draft is older than a given age
 * @param key - Unique key for this draft
 * @param maxAgeMs - Maximum age in milliseconds
 * @returns True if draft is older than maxAgeMs
 */
export function isDraftStale(key: string, maxAgeMs: number): boolean {
  const age = getDraftAge(key);
  if (age === null) return false;
  return age > maxAgeMs;
}

/**
 * Clear drafts older than a given age
 * @param maxAgeMs - Maximum age in milliseconds
 * @returns Number of drafts cleared
 */
export function clearStaleDrafts(maxAgeMs: number): number {
  if (typeof window === 'undefined') return 0;

  const keys = listDraftKeys();
  let cleared = 0;

  for (const key of keys) {
    if (isDraftStale(key, maxAgeMs)) {
      clearDraft(key);
      cleared++;
    }
  }

  return cleared;
}
