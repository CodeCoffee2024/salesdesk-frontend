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
 * The offline draft/queue store (TASK-027). A studio owner who creates a quote
 * with no connectivity gets it written here instead of losing the work; the
 * queue is flushed to the real API once connectivity returns (see
 * OfflineQueueService). `authToken` mirrors the session token from
 * AuthService's localStorage copy, since a Service Worker's `sync` event
 * handler (ngsw-sync.js) can't reach localStorage — only IndexedDB — but needs
 * the token to authenticate the POST it makes on the app's behalf.
 */
export class OfflineDatabase extends Dexie {
  pendingDocuments!: Table<PendingDocument, number>;
  authToken!: Table<{ id: string; value: string }, string>;

  constructor() {
    super('salesdesk-offline');
    this.version(1).stores({
      pendingDocuments: '++id, status, createdAt',
      authToken: 'id'
    });
  }
}

export const offlineDb = new OfflineDatabase();
