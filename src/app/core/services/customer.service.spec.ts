import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CustomerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAll GETs /api/customers', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne({ url: '/api/customers', method: 'GET' });
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('create POSTs to /api/customers', () => {
    service.create({ name: 'Maya', company: 'Northstar', email: 'maya@northstar.studio', phone: null }).subscribe();
    const req = httpMock.expectOne({ url: '/api/customers', method: 'POST' });
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('update PUTs to /api/customers/{id}', () => {
    service.update('abc', { name: 'Maya', company: 'Northstar', email: 'maya@northstar.studio', phone: null }).subscribe();
    const req = httpMock.expectOne({ url: '/api/customers/abc', method: 'PUT' });
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('delete DELETEs /api/customers/{id}', () => {
    service.delete('abc').subscribe();
    const req = httpMock.expectOne({ url: '/api/customers/abc', method: 'DELETE' });
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
