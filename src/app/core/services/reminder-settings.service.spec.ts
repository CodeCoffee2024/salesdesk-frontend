import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ReminderSettingsService } from './reminder-settings.service';

describe('ReminderSettingsService', () => {
  let service: ReminderSettingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ReminderSettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('get GETs /api/settings/reminders', () => {
    service.get().subscribe();
    const req = httpMock.expectOne({ url: '/api/settings/reminders', method: 'GET' });
    expect(req.request.method).toBe('GET');
    req.flush({
      isEnabled: false,
      quoteFollowUpEnabled: true,
      invoiceDueWarningEnabled: true,
      overdueNoticesEnabled: true,
      ccEmail: null
    });
  });

  it('save PUTs to /api/settings/reminders', () => {
    service
      .save({
        isEnabled: true,
        quoteFollowUpEnabled: true,
        invoiceDueWarningEnabled: true,
        overdueNoticesEnabled: true,
        ccEmail: 'owner@northline.studio'
      })
      .subscribe();
    const req = httpMock.expectOne({ url: '/api/settings/reminders', method: 'PUT' });
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });
});
