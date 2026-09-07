import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateRecurringScheduleRequest, RecurringSchedule } from '../models/recurring-schedule.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/recurring-schedules`;

@Injectable({
  providedIn: 'root'
})
export class RecurringScheduleService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<RecurringSchedule[]> {
    return this.http.get<RecurringSchedule[]>(BASE_URL);
  }

  create(request: CreateRecurringScheduleRequest): Observable<RecurringSchedule> {
    return this.http.post<RecurringSchedule>(BASE_URL, request);
  }

  pause(id: string): Observable<RecurringSchedule> {
    return this.http.post<RecurringSchedule>(`${BASE_URL}/${id}/pause`, {});
  }

  resume(id: string): Observable<RecurringSchedule> {
    return this.http.post<RecurringSchedule>(`${BASE_URL}/${id}/resume`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/${id}`);
  }
}
