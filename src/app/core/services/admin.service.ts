import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminUser, AuditLogEntry, PagedResult, PlatformMetrics, WorkspaceSummary } from '../models/admin.model';
import { AuthResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/admin`;

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private readonly http: HttpClient) {}

  getMetrics(): Observable<PlatformMetrics> {
    return this.http.get<PlatformMetrics>(`${BASE_URL}/metrics`);
  }

  getWorkspaces(search?: string): Observable<WorkspaceSummary[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<WorkspaceSummary[]>(`${BASE_URL}/workspaces`, { params });
  }

  setWorkspaceStatus(id: string, isActive: boolean): Observable<WorkspaceSummary> {
    return this.http.patch<WorkspaceSummary>(`${BASE_URL}/workspaces/${id}/status`, { isActive });
  }

  setWorkspaceQuota(id: string, documentQuota: number | null): Observable<WorkspaceSummary> {
    return this.http.patch<WorkspaceSummary>(`${BASE_URL}/workspaces/${id}/quota`, { documentQuota });
  }

  getAuditLog(search: string | undefined, page: number, pageSize: number): Observable<PagedResult<AuditLogEntry>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PagedResult<AuditLogEntry>>(`${BASE_URL}/audit-log`, { params });
  }

  getUsers(search?: string, workspaceId?: string): Observable<AdminUser[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    if (workspaceId) {
      params = params.set('workspaceId', workspaceId);
    }

    return this.http.get<AdminUser[]>(`${BASE_URL}/users`, { params });
  }

  /** Pure API call — no session side effects. Callers hand the response to
   *  AuthService.beginImpersonation() to actually switch the active session. */
  impersonate(userId: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE_URL}/users/${userId}/impersonate`, {});
  }
}
