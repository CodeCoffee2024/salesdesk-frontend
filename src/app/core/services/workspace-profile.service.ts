import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { UpdateWorkspaceProfileRequest, WorkspaceProfile } from '../models/workspace-profile.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/workspace/profile`;

@Injectable({
  providedIn: 'root'
})
export class WorkspaceProfileService {
  // TASK-029: pages that just need the workspace's DefaultCurrency/Country for
  // locale-aware formatting (customers, products, dashboard) shouldn't each
  // re-fetch the full profile — this replays the last-loaded profile to every
  // subscriber, fetching once lazily on first use.
  // Not readonly: a failed fetch replaces this with a fresh subject (see
  // getCached) rather than reusing one that's already errored out, since an
  // rxjs Subject can't emit again after calling error() on it.
  private cachedProfileSubject = new ReplaySubject<WorkspaceProfile>(1);
  private cacheRequested = false;

  constructor(private readonly http: HttpClient) {}

  get(): Observable<WorkspaceProfile> {
    return this.http.get<WorkspaceProfile>(BASE_URL).pipe(tap((profile) => this.cachedProfileSubject.next(profile)));
  }

  update(request: UpdateWorkspaceProfileRequest): Observable<WorkspaceProfile> {
    return this.http.put<WorkspaceProfile>(BASE_URL, request).pipe(tap((profile) => this.cachedProfileSubject.next(profile)));
  }

  /**
   * Cached profile stream: triggers a single fetch on first subscription, replays it
   * (and every subsequent get()/update()) to all subscribers after that.
   *
   * A failed fetch errors out the current subject rather than leaving it silently
   * unresolved: an rxjs ReplaySubject that never receives next() or error() leaves
   * every current waiter (e.g. document-form's forkJoin) hanging indefinitely,
   * which reads to the user as a page stuck loading forever. The subject is then
   * swapped for a fresh one so the next getCached() call gets a real retry instead
   * of subscribing to one that already terminated.
   */
  getCached(): Observable<WorkspaceProfile> {
    if (!this.cacheRequested) {
      this.cacheRequested = true;
      this.get().subscribe({
        error: (error) => {
          this.cacheRequested = false;
          this.cachedProfileSubject.error(error);
          this.cachedProfileSubject = new ReplaySubject<WorkspaceProfile>(1);
        }
      });
    }

    return this.cachedProfileSubject.asObservable();
  }
}
