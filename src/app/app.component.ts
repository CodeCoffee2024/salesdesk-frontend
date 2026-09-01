import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { PageMetaService } from './core/services/page-meta.service';
import { AuthService } from './core/services/auth.service';
import { AnalyticsService } from './core/services/analytics.service';

// '/view' (TASK-023/024's unauthenticated client document link) joins the auth
// pages here — a client following a shared quote/invoice link was never logged in
// to begin with, so the dashboard shell has nothing relevant to show them.
const PUBLIC_ROUTE_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/verify-email', '/view'];

// '/' (the landing page, TASK-018) is checked for exact equality rather than
// folded into PUBLIC_ROUTE_PREFIXES — as a prefix it would match every route.
// Exported for direct unit testing rather than driving real router navigation.
export function isPublicRoute(url: string): boolean {
  return url === '/' || PUBLIC_ROUTE_PREFIXES.some(prefix => url.startsWith(prefix));
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  readonly isPublicRoute$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(event => isPublicRoute(event.urlAfterRedirects)),
    startWith(isPublicRoute(this.router.url))
  );

  /** Shown once per login session for an account that hasn't finished onboarding (TASK-029) — see the guard logic in ngOnInit. */
  showOnboarding = false;

  private hasCheckedOnboarding = false;

  // Injecting PageMetaService/AnalyticsService (rather than calling them) is
  // what activates them: their constructors are where the router-driven
  // title/favicon subscription and the GA4 page_view tracking start.
  constructor(
    private readonly router: Router,
    private readonly pageMeta: PageMetaService,
    private readonly authService: AuthService,
    private readonly analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    // Evaluated once per "a user became present" transition (fresh login/register,
    // or the app booting already-logged-in) rather than on every currentUser$
    // emission, so re-fetching /me or an impersonation swap doesn't reopen it.
    this.authService.currentUser$.subscribe((user) => {
      if (user && !this.hasCheckedOnboarding) {
        this.hasCheckedOnboarding = true;
        this.showOnboarding = !user.hasCompletedOnboarding;
      } else if (!user) {
        this.hasCheckedOnboarding = false;
        this.showOnboarding = false;
      }
    });
  }

  onOnboardingClosed(): void {
    this.showOnboarding = false;
  }
}
