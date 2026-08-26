import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardSummary } from '../models/dashboard.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/dashboard`;

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${BASE_URL}/summary`);
  }
}
