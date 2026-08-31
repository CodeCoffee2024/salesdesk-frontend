import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PublicDocument, SignDocumentRequest } from '../models/public-document.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/public/documents`;

/** Talks to the unauthenticated public document endpoints (TASK-023/024) — no auth token is ever attached, by design. */
@Injectable({
  providedIn: 'root'
})
export class PublicDocumentService {
  constructor(private readonly http: HttpClient) {}

  getByToken(token: string): Observable<PublicDocument> {
    return this.http.get<PublicDocument>(`${BASE_URL}/${token}`);
  }

  sign(token: string, request: SignDocumentRequest): Observable<PublicDocument> {
    return this.http.post<PublicDocument>(`${BASE_URL}/${token}/signature`, request);
  }
}
