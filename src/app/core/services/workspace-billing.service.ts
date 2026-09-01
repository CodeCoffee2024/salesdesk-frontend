import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkspaceBilling } from '../models/workspace-billing.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/workspace/billing`;

/** TASK-031: read-only for now — there's no paid-upgrade flow yet, just the current workspace's subscription tier for /settings/billing. */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceBillingService {
  constructor(private readonly http: HttpClient) {}

  get(): Observable<WorkspaceBilling> {
    return this.http.get<WorkspaceBilling>(BASE_URL);
  }
}
