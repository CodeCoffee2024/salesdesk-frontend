import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter, startWith } from 'rxjs/operators';

const APP_NAME = 'SalesDesk';
const FAVICON_DEFAULT = 'favicon.svg';
const FAVICON_ADMIN = 'favicon-admin.svg';

/**
 * Keeps the browser tab's title and favicon in sync with the active route.
 * Title reflects the deepest route's `data.title` (falling back to the last
 * label in its `data.breadcrumb` trail, since most routes already carry one),
 * always prefixed with the system name. Favicon switches to an accent-colored
 * variant while inside the admin console, so an admin tab is visually
 * distinguishable from a regular workspace tab at a glance.
 *
 * Instantiated once (providedIn: 'root') and activated by AppComponent simply
 * injecting it — the constructor is what starts the router subscription.
 */
@Injectable({
  providedIn: 'root'
})
export class PageMetaService {
  constructor(
    private readonly router: Router,
    private readonly title: Title
  ) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null)
      )
      .subscribe(() => this.apply());
  }

  private apply(): void {
    const pageTitle = this.readPageTitle();
    this.title.setTitle(pageTitle ? `${APP_NAME} · ${pageTitle}` : APP_NAME);
    this.setFavicon(this.router.url.startsWith('/admin') ? FAVICON_ADMIN : FAVICON_DEFAULT);
  }

  private readPageTitle(): string | null {
    // Reads off Router.routerState directly rather than injecting ActivatedRoute:
    // some test harnesses (see app.component.spec.ts) stub Router with a plain
    // object that has no routerState, and ActivatedRoute's own DI factory reads
    // router.routerState.root eagerly — injecting it would throw at construction
    // time in exactly those tests. Optional-chained here so it degrades to "no
    // title" instead.
    let route: ActivatedRouteSnapshot | undefined = this.router.routerState?.root?.snapshot;
    if (!route) {
      return null;
    }

    while (route.firstChild) {
      route = route.firstChild;
    }

    const data = route.data;
    const explicitTitle = data['title'] as string | undefined;
    if (explicitTitle) {
      return explicitTitle;
    }

    const breadcrumb = data['breadcrumb'] as { label: string }[] | undefined;
    return breadcrumb?.length ? breadcrumb[breadcrumb.length - 1].label : null;
  }

  private setFavicon(href: string): void {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
    if (link && link.getAttribute('href') !== href) {
      link.setAttribute('href', href);
    }
  }
}
