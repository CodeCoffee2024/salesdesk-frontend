import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { offlineDb, PendingDocument } from '../offline/offline-db';
import { DocumentService } from './document.service';
import { CreateDocumentRequest } from '../models/document.model';

export const BACKGROUND_SYNC_TAG = 'sync-documents';

/**
 * Offline draft queue (TASK-027): when creating a document fails because the
 * browser has no connectivity, DocumentFormComponent enqueues the request
 * here (IndexedDB, via Dexie) instead of losing the work. Delivery is
 * guaranteed by the `online` listener below, which works in every browser;
 * `requestBackgroundSync` is a Chrome/Edge-only progressive enhancement layered
 * on top (Safari and Firefox have no Background Sync API at all, so the queue
 * must not depend on it to actually work on iOS).
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineQueueService {
  private readonly pendingCountSubject = new BehaviorSubject<number>(0);
  readonly pendingCount$ = this.pendingCountSubject.asObservable();

  constructor(private readonly documentService: DocumentService) {
    void this.refreshCount();
    window.addEventListener('online', () => void this.flushPending());

    if (navigator.onLine) {
      // Covers anything left over from a previous session — the app may not
      // have been open (or online) when connectivity last returned.
      void this.flushPending();
    }
  }

  async enqueue(payload: CreateDocumentRequest): Promise<void> {
    await offlineDb.pendingDocuments.add({
      payload,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
    await this.refreshCount();
    await this.requestBackgroundSync();
  }

  getPending(): Promise<PendingDocument[]> {
    return offlineDb.pendingDocuments.orderBy('createdAt').toArray();
  }

  async retry(id: number): Promise<void> {
    await offlineDb.pendingDocuments.update(id, { status: 'pending', errorMessage: undefined });
    await this.flushPending();
  }

  async discard(id: number): Promise<void> {
    await offlineDb.pendingDocuments.delete(id);
    await this.refreshCount();
  }

  async flushPending(): Promise<void> {
    if (!navigator.onLine) {
      return;
    }

    const pending = await offlineDb.pendingDocuments.where('status').notEqual('syncing').toArray();

    for (const item of pending) {
      if (item.id === undefined) {
        continue;
      }

      await offlineDb.pendingDocuments.update(item.id, { status: 'syncing' });

      try {
        await firstValueFrom(this.documentService.create(item.payload));
        await offlineDb.pendingDocuments.delete(item.id);
      } catch {
        await offlineDb.pendingDocuments.update(item.id, {
          status: 'failed',
          errorMessage: 'Could not sync automatically. It will retry the next time you reconnect.'
        });
      }
    }

    await this.refreshCount();
  }

  private async refreshCount(): Promise<void> {
    this.pendingCountSubject.next(await offlineDb.pendingDocuments.count());
  }

  private async requestBackgroundSync(): Promise<void> {
    // `navigator.serviceWorker.ready` never resolves unless a service worker is
    // already controlling the page — checking `.controller` first (a plain,
    // synchronous property) avoids ever awaiting `.ready` when there's nothing
    // to wait for, which would otherwise hang indefinitely with no service
    // worker registered at all (every non-production environment). Not fatal
    // either way: the `online` listener in the constructor is what actually
    // guarantees delivery, regardless of whether real Background Sync fires.
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        await registration.sync.register(BACKGROUND_SYNC_TAG);
      }
    } catch {
      // Not fatal — the `online` listener in the constructor still delivers it.
    }
  }
}
