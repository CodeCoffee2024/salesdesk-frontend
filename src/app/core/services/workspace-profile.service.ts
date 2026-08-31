import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UpdateWorkspaceProfileRequest, WorkspaceProfile } from '../models/workspace-profile.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/workspace/profile`;

@Injectable({
  providedIn: 'root'
})
export class WorkspaceProfileService {
  constructor(private readonly http: HttpClient) {}

  get(): Observable<WorkspaceProfile> {
    return this.http.get<WorkspaceProfile>(BASE_URL);
  }

  update(request: UpdateWorkspaceProfileRequest): Observable<WorkspaceProfile> {
    return this.http.put<WorkspaceProfile>(BASE_URL, request);
  }
}
