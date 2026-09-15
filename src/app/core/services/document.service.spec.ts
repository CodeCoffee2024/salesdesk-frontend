import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DocumentService } from './document.service';
import { LocalCacheService } from './local-cache.service';
import { offlineDb } from '../offline/offline-db';
import { documentDetailCacheKey, documentsListCacheKey } from '../utils/document-cache-keys.util';
import { Document as DocumentModel } from '../models/document.model';

function makeDocument(overrides: Partial<DocumentModel> = {}): DocumentModel {
  return {
    id: 'doc-1',
    publicToken: 'pub-1',
    isLocked: false,
    isDispatched: false,
    dispatchedAt: null,
    signature: null,
    documentNumber: 'QUO-1',
    type: 'Quote',
    status: 'Draft',
    issueDate: '2026-09-01',
    dueDate: '2026-09-15',
    customerId: 'cust-1',
    customerName: 'Maya Chen',
    customerCompany: 'Northstar Studio',
    templateId: 'tpl-1',
    templateName: 'Studio Standard',
    subtotal: 500,
    total: 500,
    currency: 'USD',
    clientCountry: null,
    lineItems: [],
    activities: [],
    ...overrides
  };
}

describe('DocumentService', () => {
  let service: DocumentService;
  let cache: LocalCacheService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await offlineDb.cacheEntries.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(DocumentService);
    cache = TestBed.inject(LocalCacheService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(async () => {
    httpMock.verify();
    await offlineDb.cacheEntries.clear();
  });

  describe('TASK-041 cache invalidation', () => {
    it('create() writes the new document into the cached "all" and "quote" tabs, and its detail cache', async () => {
      await cache.set(documentsListCacheKey('all'), []);
      await cache.set(documentsListCacheKey('quote'), []);
      await cache.set(documentsListCacheKey('invoice'), []);

      const created = makeDocument();
      service.create({} as never).subscribe();
      httpMock.expectOne('/api/documents').flush(created);
      // The cache writes triggered by the tap() are real (async) IndexedDB
      // operations chained across more than one round trip (a list read, then a
      // write) — one macrotask isn't reliably enough to drain that, so this waits
      // a short real delay instead (same reasoning as OfflineQueueService's own
      // spec, just for a longer chain).
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(await cache.get(documentsListCacheKey('all'))).toEqual([created]);
      expect(await cache.get(documentsListCacheKey('quote'))).toEqual([created]);
      expect(await cache.get(documentsListCacheKey('invoice'))).toEqual([]);
      expect(await cache.get(documentDetailCacheKey('doc-1'))).toEqual(created);
    });

    it('delete() removes the document from every cached tab and its detail cache', async () => {
      const existing = makeDocument();
      await cache.set(documentsListCacheKey('all'), [existing]);
      await cache.set(documentDetailCacheKey('doc-1'), existing);

      service.delete('doc-1').subscribe();
      httpMock.expectOne('/api/documents/doc-1').flush(null);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(await cache.get(documentsListCacheKey('all'))).toEqual([]);
      expect(await cache.get(documentDetailCacheKey('doc-1'))).toBeUndefined();
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAll with no filters requests the bare endpoint', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne('/api/documents');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getAll includes only the filters that are set', () => {
    service.getAll({ type: 'quote', search: 'maya' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/documents');
    expect(req.request.params.get('type')).toBe('quote');
    expect(req.request.params.get('search')).toBe('maya');
    expect(req.request.params.has('status')).toBeFalse();
    req.flush([]);
  });

  it('getById requests /api/documents/{id}', () => {
    service.getById('abc').subscribe();
    const req = httpMock.expectOne('/api/documents/abc');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create POSTs to /api/documents', () => {
    const body = { type: 'Quote', customerId: 'c1', templateId: 't1', dueDate: '2026-09-01', lineItems: [] } as any;
    service.create(body).subscribe();
    const req = httpMock.expectOne('/api/documents');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(body);
    req.flush({});
  });

  it('update PUTs to /api/documents/{id}', () => {
    service.update('abc', {} as any).subscribe();
    const req = httpMock.expectOne('/api/documents/abc');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('updateStatus PATCHes /api/documents/{id}/status with the status body', () => {
    service.updateStatus('abc', 'Sent').subscribe();
    const req = httpMock.expectOne('/api/documents/abc/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'Sent' });
    req.flush({});
  });

  it('convertToInvoice POSTs to /api/documents/{id}/convert-to-invoice', () => {
    service.convertToInvoice('abc').subscribe();
    const req = httpMock.expectOne('/api/documents/abc/convert-to-invoice');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('delete DELETEs /api/documents/{id}', () => {
    service.delete('abc').subscribe();
    const req = httpMock.expectOne('/api/documents/abc');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
