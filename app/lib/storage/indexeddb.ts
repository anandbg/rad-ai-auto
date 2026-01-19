// IndexedDB utility for offline draft storage

// Only log in development
const isDev = process.env.NODE_ENV === 'development';
const log = isDev ? (...args: unknown[]) => console.log('[IndexedDB]', ...args) : () => {};
const logError = (...args: unknown[]) => console.error('[IndexedDB]', ...args);

const DB_NAME = 'ai-radiologist-drafts';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';

export interface Draft {
  id: string;
  type: 'template' | 'report' | 'transcription';
  userId: string;
  data: Record<string, unknown>;
  savedAt: string;
  isOffline: boolean;
}

let db: IDBDatabase | null = null;

// Initialize the database
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logError('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create drafts store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };
  });
}

// Save a draft to IndexedDB
export async function saveDraft(draft: Draft): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Update savedAt timestamp
    const draftToSave = {
      ...draft,
      savedAt: new Date().toISOString(),
    };

    const request = store.put(draftToSave);

    request.onerror = () => {
      logError('Failed to save draft:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      log('Draft saved:', draft.id);
      resolve();
    };
  });
}

// Get a draft by ID
export async function getDraft(id: string): Promise<Draft | null> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => {
      logError('Failed to get draft:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
}

// Get all drafts for a user
export async function getDraftsByUser(userId: string): Promise<Draft[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onerror = () => {
      logError('Failed to get drafts:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result || []);
    };
  });
}

// Get drafts by type for a user
export async function getDraftsByType(userId: string, type: Draft['type']): Promise<Draft[]> {
  const drafts = await getDraftsByUser(userId);
  return drafts.filter(d => d.type === type);
}

// Delete a draft
export async function deleteDraft(id: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => {
      logError('Failed to delete draft:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      log('Draft deleted:', id);
      resolve();
    };
  });
}

// Clear all drafts for a user
export async function clearUserDrafts(userId: string): Promise<void> {
  const drafts = await getDraftsByUser(userId);

  for (const draft of drafts) {
    await deleteDraft(draft.id);
  }
}

// Check if we're online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Listen for online/offline events
export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
