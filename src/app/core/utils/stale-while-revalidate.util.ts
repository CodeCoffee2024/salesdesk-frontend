import { Observable } from 'rxjs';
import { LocalCacheService } from '../services/local-cache.service';

export interface CachedResult<T> {
  data: T;
  fromCache: boolean;
}

/**
 * Stale-while-revalidate (TASK-041): emits the cached copy under `key`
 * immediately (if one exists), then subscribes to `fetch$` and emits the fresh
 * result once it resolves, writing it back to the cache. A caller renders the
 * first emission straight away and only needs to show a skeleton when nothing
 * has been cached yet — see LocalCacheService for the cache itself.
 *
 * If the network request fails after a cached value was already shown, the
 * stream completes quietly instead of erroring — the offline-first guardrail
 * this extends means a failed background refresh should leave the user on the
 * last-known-good data, not blow away a screen they can already see. It only
 * surfaces the error when there was nothing cached to fall back on.
 */
export function staleWhileRevalidate<T>(cache: LocalCacheService, key: string, fetch$: Observable<T>): Observable<CachedResult<T>> {
  return new Observable<CachedResult<T>>((subscriber) => {
    let freshEmitted = false;

    // Read once, shared by both the initial cache emission below and the error
    // handler — a synchronous fetch$ (e.g. an already-cached HttpClient response,
    // or a test double) can error before this promise has resolved, so the error
    // handler awaits this same in-flight read rather than a boolean flag that
    // isn't reliably set yet at that point.
    const cachePromise = cache.get<T>(key);

    cachePromise.then((cached) => {
      if (cached !== undefined && !freshEmitted && !subscriber.closed) {
        subscriber.next({ data: cached, fromCache: true });
      }
    });

    const subscription = fetch$.subscribe({
      next: (data) => {
        freshEmitted = true;
        void cache.set(key, data);
        subscriber.next({ data, fromCache: false });
      },
      error: (error) => {
        void cachePromise.then((cached) => {
          // Offline-first guardrail: a failed background refresh isn't fatal
          // when there was cached data to fall back on — the screen stays on
          // the last-known-good copy instead of erroring over content the
          // user can already see.
          if (cached !== undefined) {
            subscriber.complete();
          } else {
            subscriber.error(error);
          }
        });
      },
      complete: () => subscriber.complete()
    });

    return () => subscription.unsubscribe();
  });
}
