import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateDocumentRequest,
  Document as DocumentModel,
  DocumentListFilters,
  DocumentStatus,
  UpdateDocumentRequest
} from '../models/document.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/documents`;

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  constructor(private readonly http: HttpClient) {}

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
    return this.http.post<DocumentModel>(BASE_URL, request);
  }

  update(id: string, request: UpdateDocumentRequest): Observable<DocumentModel> {
    return this.http.put<DocumentModel>(`${BASE_URL}/${id}`, request);
  }

  updateStatus(id: string, status: DocumentStatus): Observable<DocumentModel> {
    return this.http.patch<DocumentModel>(`${BASE_URL}/${id}/status`, { status });
  }

  convertToInvoice(id: string): Observable<DocumentModel> {
    return this.http.post<DocumentModel>(`${BASE_URL}/${id}/convert-to-invoice`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/${id}`);
  }
}
