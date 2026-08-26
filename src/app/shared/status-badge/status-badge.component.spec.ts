import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StatusBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.status = 'Draft';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the status label and a matching modifier class for each status', () => {
    const statuses: Array<[typeof component.status, string]> = [
      ['Draft', 'status-badge--draft'],
      ['Sent', 'status-badge--sent'],
      ['Overdue', 'status-badge--overdue'],
      ['Accepted', 'status-badge--accepted'],
      ['Paid', 'status-badge--paid']
    ];

    for (const [status, cssClass] of statuses) {
      component.status = status;
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.status-badge');
      expect(badge.textContent.trim()).toBe(status);
      expect(badge.classList).toContain(cssClass);
    }
  });
});
