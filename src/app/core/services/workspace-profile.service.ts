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
  private readonly cachedProfileSubject = new ReplaySubject<WorkspaceProfile>(1);
  private cacheRequested = false;

  constructor(private readonly http: HttpClient) {}

  get(): Observable<WorkspaceProfile> {
    return this.http.get<WorkspaceProfile>(BASE_URL).pipe(tap((profile) => this.cachedProfileSubject.next(profile)));
  }

  update(request: UpdateWorkspaceProfileRequest): Observable<WorkspaceProfile> {
    return this.http.put<WorkspaceProfile>(BASE_URL, request).pipe(tap((profile) => this.cachedProfileSubject.next(profile)));
  }

  /** Cached profile stream — triggers a single fetch on first subscription, replays it (and every subsequent get()/update()) to all subscribers after that. */
  getCached(): Observable<WorkspaceProfile> {
    if (!this.cacheRequested) {
      this.cacheRequested = true;
      this.get().subscribe({ error: () => (this.cacheRequested = false) });
    }

    return this.cachedProfileSubject.asObservable();
  }
}
