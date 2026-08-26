import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { take } from 'rxjs';

import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(HealthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('emits true when GET /api/health succeeds', fakeAsync(() => {
    let result: boolean | undefined;
    // take(1): status() polls forever, and this test only cares about the first
    // (immediate) check — subscribing without take(1) would leave a pending timer
    // when fakeAsync tears down the zone.
    service.status().pipe(take(1)).subscribe((value) => (result = value));

    tick();
    httpMock.expectOne('/api/health').flush({ status: 'healthy' });

    expect(result).toBeTrue();
  }));

  it('emits false when GET /api/health fails', fakeAsync(() => {
    let result: boolean | undefined;
    service.status().pipe(take(1)).subscribe((value) => (result = value));

    tick();
    httpMock.expectOne('/api/health').flush('error', { status: 500, statusText: 'Server Error' });

    expect(result).toBeFalse();
  }));
});
