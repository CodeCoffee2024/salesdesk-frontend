import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

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
