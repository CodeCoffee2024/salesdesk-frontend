import Dexie, { Table } from 'dexie';
import { CreateDocumentRequest } from '../models/document.model';

export type PendingDocumentStatus = 'pending' | 'syncing' | 'failed';

export interface PendingDocument {
  id?: number;
  payload: CreateDocumentRequest;
  createdAt: string;
  status: PendingDocumentStatus;
  errorMessage?: string;
}

/**
 * A last-known-good read cached under an arbitrary string key (TASK-041), e.g.
 * `documents:all` or `customers:list`. `data` is whatever shape the caller put
 * there (typically an entity list) — see LocalCacheService for the read/write API.
 */
export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  updatedAt: string;
}

/**
 * The offline draft/queue store (TASK-027). A studio owner who creates a quote
 * with no connectivity gets it written here instead of losing the work; the
 * queue is flushed to the real API once connectivity returns (see
 * OfflineQueueService). `authToken` mirrors the session token from
 * AuthService's localStorage copy, since a Service Worker's `sync` event
 * handler (ngsw-sync.js) can't reach localStorage — only IndexedDB — but needs
 * the token to authenticate the POST it makes on the app's behalf.
 *
 * `cacheEntries` (TASK-041) is the stale-while-revalidate read cache: list/detail
 * screens render this immediately on repeat visits while a background refresh
 * reconciles it, instead of showing a skeleton every time. See LocalCacheService.
 */
export class OfflineDatabase extends Dexie {
  pendingDocuments!: Table<PendingDocument, number>;
  authToken!: Table<{ id: string; value: string }, string>;
  cacheEntries!: Table<CacheEntry, string>;

  constructor() {
    super('salesdesk-offline');
    this.version(1).stores({
      pendingDocuments: '++id, status, createdAt',
      authToken: 'id'
    });
    // New table only — existing stores are untouched, so this upgrade never
    // touches a queued offline document a user hasn't synced yet.
    this.version(2).stores({
      pendingDocuments: '++id, status, createdAt',
      authToken: 'id',
      cacheEntries: 'key'
    });
  }
}

export const offlineDb = new OfflineDatabase();
