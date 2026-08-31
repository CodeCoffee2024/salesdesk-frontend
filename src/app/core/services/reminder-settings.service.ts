import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReminderSettings, SaveReminderSettingsRequest } from '../models/reminder-settings.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/settings/reminders`;

@Injectable({
  providedIn: 'root'
})
export class ReminderSettingsService {
  constructor(private readonly http: HttpClient) {}

  get(): Observable<ReminderSettings> {
    return this.http.get<ReminderSettings>(BASE_URL);
  }

  save(request: SaveReminderSettingsRequest): Observable<ReminderSettings> {
    return this.http.put<ReminderSettings>(BASE_URL, request);
  }
}
