import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RouterTestingModule] });
    service = TestBed.inject(AnalyticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // environment.gaMeasurementId is '' in the test/dev config, so the service
  // should stay fully inert — no GA4 script tag, no dataLayer writes.
  it('does not inject the GA4 script tag when no Measurement ID is configured', () => {
    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull();
  });

  it('trackEvent is a safe no-op when GA4 is not configured', () => {
    expect(() => service.trackEvent('landing_view')).not.toThrow();
  });
});
