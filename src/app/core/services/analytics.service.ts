import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

// Left un-replaced by vercel.json's buildCommand when the Vercel project's
// GA_MEASUREMENT_ID env var isn't set — treated the same as "" (analytics
// disabled), not as a literal id to send traffic to.
const UNSET_PLACEHOLDER = '__GA_MEASUREMENT_ID__';

/**
 * Thin GA4 (gtag.js) wrapper (TASK-032 follow-up — see
 * docs/research/TASK-DAY-BY-DAY-MARKET.md's Day-0 analytics setup). Loads the
 * GA4 script only when a real Measurement ID has been build-time-injected
 * (environment.prod.ts / vercel.json), and fires a `page_view` on every SPA
 * route change — gtag's own automatic page_view only fires once, on the
 * initial script load, which would miss every client-side Angular navigation.
 *
 * Exposes trackEvent() for the marketing funnel's three named events —
 * landing_view (LandingComponent), signup_started (RegisterComponent),
 * first_quote_sent (DocumentFormComponent) — each of which shows up in GA4 as
 * a normal custom event; mark them as "key events" in the GA4 console once
 * they've fired at least once (Admin → Events → toggle "Mark as key event").
 * GA4's own Funnel Exploration report handles "first occurrence per user"
 * analysis, so this service doesn't need any client-side de-duplication.
 *
 * A no-op everywhere the Measurement ID isn't configured (local dev, unit
 * tests, or a production build where the Vercel env var wasn't set) —
 * trackEvent() is always safe to call regardless of environment.
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly measurementId = environment.gaMeasurementId;
  private enabled = false;

  constructor(private readonly router: Router) {
    if (this.measurementId && this.measurementId !== UNSET_PLACEHOLDER) {
      this.enabled = true;
      this.loadGtagScript();
      this.trackPageViewsOnNavigation();
    }
  }

  /** Records a named funnel/product event. Safe to call unconditionally from any component — no-ops when GA4 isn't configured. */
  trackEvent(name: string, params: Record<string, unknown> = {}): void {
    if (!this.enabled) {
      return;
    }

    this.gtag('event', name, params);
  }

  private trackPageViewsOnNavigation(): void {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.gtag('event', 'page_view', { page_path: event.urlAfterRedirects });
    });
  }

  private loadGtagScript(): void {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    this.gtag('js', new Date());
    // send_page_view: false — this SPA reports page views itself on every
    // Angular route change (see trackPageViewsOnNavigation) instead of
    // relying on gtag's one-time automatic page_view.
    this.gtag('config', this.measurementId, { send_page_view: false });
  }

  private gtag(...args: unknown[]): void {
    window.dataLayer.push(args);
  }
}
