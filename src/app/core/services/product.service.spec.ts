import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAll GETs /api/products', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne({ url: '/api/products', method: 'GET' });
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('create POSTs to /api/products', () => {
    service.create({ name: 'SEO Audit', price: 750, unit: 'Project', description: null, category: null }).subscribe();
    const req = httpMock.expectOne({ url: '/api/products', method: 'POST' });
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
