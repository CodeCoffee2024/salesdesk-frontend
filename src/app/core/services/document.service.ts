import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  CreateDocumentRequest,
  Document as DocumentModel,
  DocumentListFilters,
  DocumentStatus,
  UpdateDocumentRequest
} from '../models/document.model';
import { ParsedQuoteResult } from '../models/ai-quote-parse.model';
import { environment } from '../../../environments/environment';
import { LocalCacheService } from './local-cache.service';
import { DOCUMENTS_CACHE_KEY_PREFIX, documentBelongsInCachedList, documentDetailCacheKey } from '../utils/document-cache-keys.util';

const BASE_URL = `${environment.apiBaseUrl}/api/documents`;

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  constructor(
    private readonly http: HttpClient,
    private readonly cache: LocalCacheService
  ) {}

  getAll(filters: DocumentListFilters = {}): Observable<DocumentModel[]> {
    let params = new HttpParams();
    if (filters.type) {
      params = params.set('type', filters.type);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<DocumentModel[]>(BASE_URL, { params });
  }

  getById(id: string): Observable<DocumentModel> {
    return this.http.get<DocumentModel>(`${BASE_URL}/${id}`);
  }

  create(request: CreateDocumentRequest): Observable<DocumentModel> {
    return this.http.post<DocumentModel>(BASE_URL, request).pipe(tap((created) => this.cacheUpsert(created)));
  }

  /** TASK-033: sends pasted unstructured text (a WhatsApp message, email, etc.) to the AI parser, which extracts a customer + line items and auto-provisions the customer if they don't already exist. Doesn't create a Document; the caller pre-fills the normal create form with the result. */
  parseText(rawText: string): Observable<ParsedQuoteResult> {
    return this.http.post<ParsedQuoteResult>(`${BASE_URL}/parse-text`, { rawText });
  }

  update(id: string, request: UpdateDocumentRequest): Observable<DocumentModel> {
    return this.http.put<DocumentModel>(`${BASE_URL}/${id}`, request).pipe(tap((updated) => this.cacheUpsert(updated)));
  }

  updateStatus(id: string, status: DocumentStatus): Observable<DocumentModel> {
    return this.http.patch<DocumentModel>(`${BASE_URL}/${id}/status`, { status }).pipe(tap((updated) => this.cacheUpsert(updated)));
  }

  convertToInvoice(id: string): Observable<DocumentModel> {
    return this.http.post<DocumentModel>(`${BASE_URL}/${id}/convert-to-invoice`, {}).pipe(tap((invoice) => this.cacheUpsert(invoice)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/${id}`).pipe(
      tap(() => {
        void this.cache.removeFromMatchingLists(DOCUMENTS_CACHE_KEY_PREFIX, id);
        void this.cache.remove(documentDetailCacheKey(id));
      })
    );
  }

  /** TASK-041 cache invalidation: writes straight into the cached tab(s) and the single-document detail cache, so the documents list/preview a user returns to already reflects their own create/edit/status-change instead of waiting on the next full refetch. */
  private cacheUpsert(document: DocumentModel): void {
    void this.cache.upsertInMatchingLists(DOCUMENTS_CACHE_KEY_PREFIX, document, (key) => documentBelongsInCachedList(key, document.type));
    void this.cache.set(documentDetailCacheKey(document.id), document);
  }
}
