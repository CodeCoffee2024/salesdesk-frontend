import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTemplateRequest, Template, UpdateTemplateRequest } from '../models/template.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/templates`;

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Template[]> {
    return this.http.get<Template[]>(BASE_URL);
  }

  create(request: CreateTemplateRequest): Observable<Template> {
    return this.http.post<Template>(BASE_URL, request);
  }

  update(id: string, request: UpdateTemplateRequest): Observable<Template> {
    return this.http.put<Template>(`${BASE_URL}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/${id}`);
  }

  setDefault(id: string): Observable<Template> {
    return this.http.post<Template>(`${BASE_URL}/${id}/set-default`, {});
  }
}
