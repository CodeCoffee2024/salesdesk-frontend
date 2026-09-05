import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { WorkspaceProfileService } from './workspace-profile.service';
import { WorkspaceProfile } from '../models/workspace-profile.model';

const profile: WorkspaceProfile = {
  name: 'Northline',
  email: 'hello@northline.studio',
  tagline: null,
  address: null,
  logoUrl: null,
  country: 'PH',
  defaultCurrency: 'PHP',
  timeZoneId: 'Asia/Manila'
};

describe('WorkspaceProfileService', () => {
  let service: WorkspaceProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(WorkspaceProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('get GETs /api/workspace/profile', () => {
    service.get().subscribe();
    const req = httpMock.expectOne({ url: '/api/workspace/profile', method: 'GET' });
    req.flush(profile);
  });

  it('update PUTs /api/workspace/profile', () => {
    service.update(profile).subscribe();
    const req = httpMock.expectOne({ url: '/api/workspace/profile', method: 'PUT' });
    req.flush(profile);
  });

  it('getCached fetches once and replays the same profile to every subscriber (TASK-029)', () => {
    let firstResult: WorkspaceProfile | undefined;
    let secondResult: WorkspaceProfile | undefined;

    service.getCached().subscribe((p) => (firstResult = p));
    service.getCached().subscribe((p) => (secondResult = p));

    // Only one HTTP GET, even though two subscribers asked for the cached profile.
    const req = httpMock.expectOne({ url: '/api/workspace/profile', method: 'GET' });
    req.flush(profile);

    expect(firstResult).toEqual(profile);
    expect(secondResult).toEqual(profile);
  });

  it('getCached replays the latest profile to a late subscriber without a new HTTP call', () => {
    service.getCached().subscribe();
    const req = httpMock.expectOne({ url: '/api/workspace/profile', method: 'GET' });
    req.flush(profile);

    let lateResult: WorkspaceProfile | undefined;
    service.getCached().subscribe((p) => (lateResult = p));

    httpMock.expectNone({ url: '/api/workspace/profile', method: 'GET' });
    expect(lateResult).toEqual(profile);
  });
});
