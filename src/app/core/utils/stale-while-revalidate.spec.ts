import { Subject, of, throwError } from 'rxjs';

import { staleWhileRevalidate } from './stale-while-revalidate.util';
import { LocalCacheService } from '../services/local-cache.service';

function fakeCache(initial: Record<string, unknown> = {}): jasmine.SpyObj<LocalCacheService> {
  const store = { ...initial };
  const spy = jasmine.createSpyObj<LocalCacheService>('LocalCacheService', ['get', 'set']);
  spy.get.and.callFake(((key: string) => Promise.resolve(store[key])) as LocalCacheService['get']);
  spy.set.and.callFake(((key: string, data: unknown) => {
    store[key] = data;
    return Promise.resolve();
  }) as LocalCacheService['set']);
  return spy;
}

describe('staleWhileRevalidate', () => {
  it('emits only the fresh result when there is nothing cached yet', (done) => {
    const cache = fakeCache();
    const emissions: Array<{ data: unknown; fromCache: boolean }> = [];

    staleWhileRevalidate(cache, 'documents:all', of(['fresh'])).subscribe({
      next: (result) => emissions.push(result),
      complete: () => {
        expect(emissions).toEqual([{ data: ['fresh'], fromCache: false }]);
        expect(cache.set).toHaveBeenCalledWith('documents:all', ['fresh']);
        done();
      }
    });
  });

  it('emits the cached value first, then the fresh value once the network resolves', (done) => {
    const cache = fakeCache({ 'documents:all': ['stale'] });
    const fetch$ = new Subject<string[]>();
    const emissions: Array<{ data: unknown; fromCache: boolean }> = [];

    staleWhileRevalidate(cache, 'documents:all', fetch$).subscribe({
      next: (result) => emissions.push(result),
      complete: () => {
        expect(emissions).toEqual([
          { data: ['stale'], fromCache: true },
          { data: ['fresh'], fromCache: false }
        ]);
        done();
      }
    });

    // The cached value resolves on a microtask — give it one before completing the fetch.
    setTimeout(() => {
      fetch$.next(['fresh']);
      fetch$.complete();
    }, 0);
  });

  it('completes quietly on a failed refresh when cached data was already shown', (done) => {
    const cache = fakeCache({ 'documents:all': ['stale'] });
    const emissions: Array<{ data: unknown; fromCache: boolean }> = [];
    let errored = false;

    staleWhileRevalidate(cache, 'documents:all', throwError(() => new Error('offline'))).subscribe({
      next: (result) => emissions.push(result),
      error: () => (errored = true),
      complete: () => {
        expect(errored).toBeFalse();
        expect(emissions).toEqual([{ data: ['stale'], fromCache: true }]);
        done();
      }
    });
  });

  it('propagates the error when there was nothing cached to fall back on', (done) => {
    const cache = fakeCache();

    staleWhileRevalidate(cache, 'documents:all', throwError(() => new Error('offline'))).subscribe({
      error: (error) => {
        expect(error.message).toBe('offline');
        done();
      }
    });
  });
});
