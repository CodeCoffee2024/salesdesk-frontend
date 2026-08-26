import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { BreadcrumbComponent } from './breadcrumb.component';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';

describe('BreadcrumbComponent', () => {
  let component: BreadcrumbComponent;
  let fixture: ComponentFixture<BreadcrumbComponent>;

  function setup(breadcrumbs: { label: string; url?: string }[]) {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [BreadcrumbComponent],
      providers: [{ provide: BreadcrumbService, useValue: { breadcrumbs: () => of(breadcrumbs) } }]
    });

    fixture = TestBed.createComponent(BreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    setup([]);
    expect(component).toBeTruthy();
  });

  it('always shows the leading "Workspace" segment', () => {
    setup([]);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Workspace');
  });

  it('renders a link for segments with a url, and plain text for the current segment', () => {
    setup([{ label: 'Documents', url: '/documents' }, { label: 'New document' }]);

    const link = fixture.nativeElement.querySelector('a.breadcrumb__item--link');
    expect(link.textContent).toContain('Documents');
    expect(link.getAttribute('href')).toBe('/documents');

    const current = fixture.nativeElement.querySelector('.breadcrumb__item--current');
    expect(current.textContent).toContain('New document');
  });
});
