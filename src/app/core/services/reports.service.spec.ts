import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ReportsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getRevenue GETs /api/reports/revenue with the from/to range', () => {
    service.getRevenue('2026-08-01', '2026-08-31').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/reports/revenue');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('from')).toBe('2026-08-01');
    expect(req.request.params.get('to')).toBe('2026-08-31');
    req.flush({});
  });

  it('getTopCustomers GETs /api/reports/top-customers with the from/to range', () => {
    service.getTopCustomers('2026-08-01', '2026-08-31').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/reports/top-customers');
    expect(req.request.params.get('from')).toBe('2026-08-01');
    expect(req.request.params.get('to')).toBe('2026-08-31');
    req.flush([]);
  });

  it('getTopProducts GETs /api/reports/top-products with the from/to range', () => {
    service.getTopProducts('2026-08-01', '2026-08-31').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/reports/top-products');
    expect(req.request.params.get('from')).toBe('2026-08-01');
    expect(req.request.params.get('to')).toBe('2026-08-31');
    req.flush([]);
  });
});
