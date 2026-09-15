import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CreateTemplateRequest, Template, UpdateTemplateRequest } from '../models/template.model';
import { environment } from '../../../environments/environment';
import { LocalCacheService } from './local-cache.service';

const BASE_URL = `${environment.apiBaseUrl}/api/templates`;

/** TASK-041: templates are fetched as one unfiltered list. */
export const TEMPLATES_LIST_CACHE_KEY = 'templates:list';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  constructor(
    private readonly http: HttpClient,
    private readonly cache: LocalCacheService
  ) {}

  getAll(): Observable<Template[]> {
    return this.http.get<Template[]>(BASE_URL);
  }

  create(request: CreateTemplateRequest): Observable<Template> {
    return this.http.post<Template>(BASE_URL, request).pipe(tap((created) => this.cacheUpsert(created)));
  }

  update(id: string, request: UpdateTemplateRequest): Observable<Template> {
    return this.http.put<Template>(`${BASE_URL}/${id}`, request).pipe(tap((updated) => this.cacheUpsert(updated)));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${BASE_URL}/${id}`)
      .pipe(tap(() => void this.cache.removeFromMatchingLists(TEMPLATES_LIST_CACHE_KEY, id)));
  }

  setDefault(id: string): Observable<Template> {
    return this.http.post<Template>(`${BASE_URL}/${id}/set-default`, {}).pipe(tap((updated) => this.cacheUpsert(updated)));
  }

  private cacheUpsert(template: Template): void {
    void this.cache.upsertInMatchingLists(TEMPLATES_LIST_CACHE_KEY, template);
  }
}
