import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EMPTY } from 'rxjs';
import { AppComponent, isPublicRoute } from './app.component';

describe('isPublicRoute', () => {
  it('treats the landing page and the auth pages as public', () => {
    expect(isPublicRoute('/')).toBeTrue();
    expect(isPublicRoute('/login')).toBeTrue();
    expect(isPublicRoute('/register')).toBeTrue();
    expect(isPublicRoute('/forgot-password')).toBeTrue();
    expect(isPublicRoute('/reset-password')).toBeTrue();
    expect(isPublicRoute('/view/abc123')).toBeTrue();
  });

  it('treats every dashboard route as non-public', () => {
    expect(isPublicRoute('/overview')).toBeFalse();
    expect(isPublicRoute('/documents')).toBeFalse();
    expect(isPublicRoute('/admin')).toBeFalse();
  });
});

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      declarations: [AppComponent],
      // The shell's children (sidebar/topbar/breadcrumb) have their own specs —
      // stub them here so this stays a lean "does the shell assemble" smoke test.
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create the app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders a bare router outlet, without the app shell, on the public landing page (/)', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-sidebar')).toBeFalsy();
    expect(compiled.querySelector('app-topbar')).toBeFalsy();
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('renders the sidebar, topbar, breadcrumb and router outlet on a non-public route', () => {
    // Stubs Router.url directly (isPublicRoute's own logic is covered above) so
    // this stays a synchronous DOM assertion instead of driving a real navigation
    // through RouterTestingModule's async initial-navigation machinery.
    TestBed.overrideProvider(Router, { useValue: { url: '/overview', events: EMPTY } });

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-sidebar')).toBeTruthy();
    expect(compiled.querySelector('app-topbar')).toBeTruthy();
    expect(compiled.querySelector('app-breadcrumb')).toBeTruthy();
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
