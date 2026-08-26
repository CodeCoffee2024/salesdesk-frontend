import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, timer } from 'rxjs';
import { environment } from '../../../environments/environment';

const POLL_INTERVAL_MS = 30_000;
const BASE_URL = `${environment.apiBaseUrl}/api/health`;

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  constructor(private readonly http: HttpClient) {}

  /** True while the API answers GET /api/health; false the moment it stops. */
  status(): Observable<boolean> {
    return timer(0, POLL_INTERVAL_MS).pipe(
      switchMap(() => this.checkOnce())
    );
  }

  private checkOnce(): Observable<boolean> {
    return this.http.get(BASE_URL).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
