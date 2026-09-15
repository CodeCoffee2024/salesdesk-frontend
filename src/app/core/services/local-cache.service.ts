import { Injectable } from '@angular/core';
import { offlineDb } from '../offline/offline-db';

interface WithId {
  id: string;
}

/**
 * Read cache built on the existing offline-capable Dexie/IndexedDB layer
 * (TASK-041) — not a second, competing caching mechanism. List/detail screens
 * use this (via staleWhileRevalidate, see core/utils) to render last-known-good
 * data immediately on repeat visits, and entity services use the upsert/remove
 * helpers below to keep a cached list in sync with the user's own writes
 * instead of leaving it stale until the next full refetch.
 */
@Injectable({
  providedIn: 'root'
})
export class LocalCacheService {
  async get<T>(key: string): Promise<T | undefined> {
    const entry = await offlineDb.cacheEntries.get(key);
    return entry?.data as T | undefined;
  }

  async set<T>(key: string, data: T): Promise<void> {
    await offlineDb.cacheEntries.put({ key, data, updatedAt: new Date().toISOString() });
  }

  async remove(key: string): Promise<void> {
    await offlineDb.cacheEntries.delete(key);
  }

  /** Wipes every cached read — called on logout so the next sign-in never renders another workspace's stale data before its own fetch resolves. */
  async clearAll(): Promise<void> {
    await offlineDb.cacheEntries.clear();
  }

  /**
   * Cache invalidation for a successful create/update: writes `item` straight
   * into every cached list whose key starts with `keyPrefix` (e.g. "documents:"
   * covers "documents:all", "documents:quote", "documents:invoice" at once),
   * so the list a user returns to already reflects their own edit instead of
   * waiting on the next full refetch.
   *
   * `belongsInList` decides whether a *new* item should be inserted into a
   * given cached key (e.g. a newly-created Quote shouldn't be inserted into the
   * "documents:invoice" bucket) — an item already present in a list is always
   * updated in place regardless, since removing it there would be a stale-cache
   * bug of its own (an edited item disappearing from a filtered view it's
   * still a member of).
   */
  async upsertInMatchingLists<T extends WithId>(
    keyPrefix: string,
    item: T,
    belongsInList: (key: string) => boolean = () => true
  ): Promise<void> {
    const entries = await offlineDb.cacheEntries.where('key').startsWith(keyPrefix).toArray();

    await Promise.all(
      entries.map(async (entry) => {
        const list = entry.data as T[];
        const index = list.findIndex((existing) => existing.id === item.id);

        if (index === -1) {
          if (!belongsInList(entry.key)) {
            return;
          }
          await this.set(entry.key, [item, ...list]);
          return;
        }

        await this.set(
          entry.key,
          list.map((existing, i) => (i === index ? item : existing))
        );
      })
    );
  }

  /** Removes a deleted entity from every cached list under `keyPrefix`. */
  async removeFromMatchingLists(keyPrefix: string, id: string): Promise<void> {
    const entries = await offlineDb.cacheEntries.where('key').startsWith(keyPrefix).toArray();

    await Promise.all(
      entries.map((entry) => {
        const list = entry.data as WithId[];
        return this.set(
          entry.key,
          list.filter((existing) => existing.id !== id)
        );
      })
    );
  }
}
