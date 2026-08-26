import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { PageMetaService } from './core/services/page-meta.service';

const PUBLIC_ROUTE_PREFIXES = ['/login', '/register', '/forgot-password'];

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
export class AppComponent {
  readonly isPublicRoute$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(event => isPublicRoute(event.urlAfterRedirects)),
    startWith(isPublicRoute(this.router.url))
  );

  // Injecting PageMetaService (rather than calling it) is what activates it: its
  // constructor is where the router-driven title/favicon subscription starts.
  constructor(
    private readonly router: Router,
    private readonly pageMeta: PageMetaService
  ) {}
}
