import { Component } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { Breadcrumb, BreadcrumbService } from './breadcrumb.service';

@Component({ template: '' })
class DummyComponent {}

describe('BreadcrumbService', () => {
  let service: BreadcrumbService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DummyComponent],
      imports: [
        RouterTestingModule.withRoutes([
          { path: '', component: DummyComponent, data: { breadcrumb: [{ label: 'Overview' }] } },
          {
            path: 'documents/new',
            component: DummyComponent,
            data: { breadcrumb: [{ label: 'Documents', url: '/documents' }, { label: 'New document' }] }
          },
          { path: 'no-breadcrumb', component: DummyComponent }
        ])
      ]
    });

    service = TestBed.inject(BreadcrumbService);
    router = TestBed.inject(Router);
  });

  it('emits the current route\'s breadcrumb immediately on subscribe', fakeAsync(() => {
    router.navigate(['']);
    tick();

    let breadcrumbs: Breadcrumb[] | undefined;
    service.breadcrumbs().subscribe((value) => (breadcrumbs = value));
    tick();

    expect(breadcrumbs).toEqual([{ label: 'Overview' }]);
  }));

  it('emits a multi-segment trail for a route with a linked ancestor', fakeAsync(() => {
    let breadcrumbs: Breadcrumb[] | undefined;
    service.breadcrumbs().subscribe((value) => (breadcrumbs = value));

    router.navigate(['documents', 'new']);
    tick();

    expect(breadcrumbs).toEqual([
      { label: 'Documents', url: '/documents' },
      { label: 'New document' }
    ]);
  }));

  it('emits an empty trail for a route with no breadcrumb data', fakeAsync(() => {
    let breadcrumbs: Breadcrumb[] | undefined;
    service.breadcrumbs().subscribe((value) => (breadcrumbs = value));

    router.navigate(['no-breadcrumb']);
    tick();

    expect(breadcrumbs).toEqual([]);
  }));
});
