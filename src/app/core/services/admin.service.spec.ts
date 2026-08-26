import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('GETs platform metrics from /api/admin/metrics', () => {
    service.getMetrics().subscribe();
    const req = httpMock.expectOne('/api/admin/metrics');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('GETs workspaces with a search query param when provided', () => {
    service.getWorkspaces('north').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/admin/workspaces');
    expect(req.request.params.get('search')).toBe('north');
    req.flush([]);
  });

  it('omits the search param when none is given', () => {
    service.getWorkspaces().subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/admin/workspaces');
    expect(req.request.params.has('search')).toBeFalse();
    req.flush([]);
  });

  it('PATCHes workspace status', () => {
    service.setWorkspaceStatus('workspace-1', false).subscribe();
    const req = httpMock.expectOne('/api/admin/workspaces/workspace-1/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ isActive: false });
    req.flush({});
  });

  it('PATCHes workspace quota', () => {
    service.setWorkspaceQuota('workspace-1', 250).subscribe();
    const req = httpMock.expectOne('/api/admin/workspaces/workspace-1/quota');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ documentQuota: 250 });
    req.flush({});
  });

  it('GETs the audit log with page and pageSize params', () => {
    service.getAuditLog(undefined, 2, 25).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/admin/audit-log');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('25');
    req.flush({ items: [], totalCount: 0, page: 2, pageSize: 25 });
  });
});
