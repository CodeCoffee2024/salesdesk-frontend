import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

export interface Breadcrumb {
  label: string;
  url?: string;
}

/**
 * Reads the `breadcrumb` array set on each route's `data` (see
 * app-routing.module.ts) and re-emits it on every navigation. Routes are flat, so
 * a route carries its own full trail (e.g. "documents/new" sets
 * `[{ label: 'Documents', url: '/documents' }, { label: 'New document' }]`)
 * instead of the trail being assembled from nested route segments.
 */
@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) {}

  breadcrumbs(): Observable<Breadcrumb[]> {
    return this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.currentBreadcrumbs())
    );
  }

  private currentBreadcrumbs(): Breadcrumb[] {
    let route = this.activatedRoute.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    return route.snapshot.data['breadcrumb'] ?? [];
  }
}
