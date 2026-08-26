import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [EmptyStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the heading and description from inputs', () => {
    component.heading = 'Document not found';
    component.description = 'This document may have been removed.';
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty-state__heading')?.textContent).toContain('Document not found');
    expect(el.querySelector('.empty-state__description')?.textContent).toContain('This document may have been removed.');
  });

  it('renders the action button only when actionLabel is set', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.empty-state__action')).toBeNull();

    component.actionLabel = 'Back to documents';
    component.actionLink = '/documents';
    fixture.detectChanges();

    const action = fixture.nativeElement.querySelector('.empty-state__action');
    expect(action.textContent).toContain('Back to documents');
    expect(action.getAttribute('href')).toBe('/documents');
  });
});
