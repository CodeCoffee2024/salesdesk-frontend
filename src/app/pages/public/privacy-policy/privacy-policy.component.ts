import { Component } from '@angular/core';

/**
 * Public, unauthenticated privacy policy at /privacy — required by Google
 * Play (every listing needs a live privacy policy URL) and by PayMongo's own
 * go-live checklist. No app shell — see app.component's PUBLIC_ROUTE_PREFIXES.
 */
@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent {
  readonly lastUpdated = 'September 2026';
}
