import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { TemplateService } from './template.service';

describe('TemplateService', () => {
  let service: TemplateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(TemplateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAll GETs /api/templates', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne({ url: '/api/templates', method: 'GET' });
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('create POSTs to /api/templates', () => {
    service.create({ name: 'Friendly Quote', targetType: 'QuotesOnly', description: null, accentColor: '#8B5FBF' }).subscribe();
    const req = httpMock.expectOne({ url: '/api/templates', method: 'POST' });
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('update PUTs to /api/templates/{id}', () => {
    service.update('abc', { name: 'Friendly Quote', targetType: 'QuotesOnly', description: null, accentColor: '#8B5FBF' }).subscribe();
    const req = httpMock.expectOne({ url: '/api/templates/abc', method: 'PUT' });
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('delete DELETEs /api/templates/{id}', () => {
    service.delete('abc').subscribe();
    const req = httpMock.expectOne({ url: '/api/templates/abc', method: 'DELETE' });
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('setDefault POSTs to /api/templates/{id}/set-default', () => {
    service.setDefault('abc').subscribe();
    const req = httpMock.expectOne({ url: '/api/templates/abc/set-default', method: 'POST' });
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
