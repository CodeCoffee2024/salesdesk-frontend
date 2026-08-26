import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { NotFoundPageComponent } from './not-found-page.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

describe('NotFoundPageComponent', () => {
  let fixture: ComponentFixture<NotFoundPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [NotFoundPageComponent, EmptyStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundPageComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows an on-brand 404 message with a link back to the overview', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty-state__heading')?.textContent).toContain('Page not found');

    const action = el.querySelector('.empty-state__action');
    expect(action?.getAttribute('href')).toBe('/overview');
  });
});
