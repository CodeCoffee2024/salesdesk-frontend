import { TestBed } from '@angular/core/testing';

import { LocalCacheService } from './local-cache.service';
import { offlineDb } from '../offline/offline-db';

interface Item {
  id: string;
  name: string;
}

describe('LocalCacheService', () => {
  let service: LocalCacheService;

  beforeEach(async () => {
    await offlineDb.cacheEntries.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalCacheService);
  });

  afterEach(async () => {
    await offlineDb.cacheEntries.clear();
  });

  it('returns undefined for a key that was never written', async () => {
    expect(await service.get('missing')).toBeUndefined();
  });

  it('round-trips a value through set/get', async () => {
    await service.set('documents:all', [{ id: 'doc-1', name: 'Quote #1' }]);

    expect(await service.get<Item[]>('documents:all')).toEqual([{ id: 'doc-1', name: 'Quote #1' }]);
  });

  it('clearAll wipes every cached key', async () => {
    await service.set('documents:all', []);
    await service.set('customers:list', []);

    await service.clearAll();

    expect(await service.get('documents:all')).toBeUndefined();
    expect(await service.get('customers:list')).toBeUndefined();
  });

  describe('upsertInMatchingLists', () => {
    it('inserts a new item into every matching list that accepts it', async () => {
      await service.set('documents:all', [{ id: 'doc-1', name: 'Quote #1' }]);
      await service.set('documents:quote', [{ id: 'doc-1', name: 'Quote #1' }]);
      await service.set('documents:invoice', []);

      const created: Item = { id: 'doc-2', name: 'Quote #2' };
      await service.upsertInMatchingLists('documents:', created, (key) => key !== 'documents:invoice');

      expect(await service.get<Item[]>('documents:all')).toContain(created);
      expect(await service.get<Item[]>('documents:quote')).toContain(created);
      expect(await service.get<Item[]>('documents:invoice')).toEqual([]);
    });

    it('updates an item already present in a list even when belongsInList says no', async () => {
      await service.set('documents:invoice', [{ id: 'doc-1', name: 'Draft invoice' }]);

      await service.upsertInMatchingLists('documents:', { id: 'doc-1', name: 'Sent invoice' }, () => false);

      expect(await service.get<Item[]>('documents:invoice')).toEqual([{ id: 'doc-1', name: 'Sent invoice' }]);
    });

    it('leaves lists under a different prefix untouched', async () => {
      await service.set('customers:list', [{ id: 'cust-1', name: 'Acme' }]);

      await service.upsertInMatchingLists('documents:', { id: 'doc-1', name: 'Quote #1' });

      expect(await service.get<Item[]>('customers:list')).toEqual([{ id: 'cust-1', name: 'Acme' }]);
    });
  });

  describe('removeFromMatchingLists', () => {
    it('removes the entity from every cached list under the prefix', async () => {
      await service.set('documents:all', [{ id: 'doc-1', name: 'Quote #1' }, { id: 'doc-2', name: 'Quote #2' }]);
      await service.set('documents:quote', [{ id: 'doc-1', name: 'Quote #1' }]);

      await service.removeFromMatchingLists('documents:', 'doc-1');

      expect(await service.get<Item[]>('documents:all')).toEqual([{ id: 'doc-2', name: 'Quote #2' }]);
      expect(await service.get<Item[]>('documents:quote')).toEqual([]);
    });
  });
});
