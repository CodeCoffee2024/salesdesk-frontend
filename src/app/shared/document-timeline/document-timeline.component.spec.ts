import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentTimelineComponent } from './document-timeline.component';
import { DocumentActivity } from '../../core/models/document.model';

describe('DocumentTimelineComponent', () => {
  let fixture: ComponentFixture<DocumentTimelineComponent>;
  let component: DocumentTimelineComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentTimelineComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentTimelineComponent);
    component = fixture.componentInstance;
  });

  it('shows the empty state when there are no activities', () => {
    component.activities = [];
    fixture.detectChanges();

    expect(component.entries).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No activity recorded yet.');
  });

  it('labels a Viewed entry in the third person for the business perspective', () => {
    component.activities = [{ type: 'Viewed', detail: null, occurredAtUtc: '2026-08-27T10:00:00Z' }];
    component.perspective = 'business';
    fixture.detectChanges();

    expect(component.entries[0].label).toBe('Client viewed the document');
  });

  it('labels the same Viewed entry in the second person for the client perspective', () => {
    component.activities = [{ type: 'Viewed', detail: null, occurredAtUtc: '2026-08-27T10:00:00Z' }];
    component.perspective = 'client';
    fixture.detectChanges();

    expect(component.entries[0].label).toBe('You viewed this');
  });

  it('quotes the feedback text for a RevisionRequested entry', () => {
    component.activities = [{ type: 'RevisionRequested', detail: 'Please use a different color scheme.', occurredAtUtc: '2026-08-27T10:00:00Z' }];
    fixture.detectChanges();

    expect(component.entries[0].detail).toBe('"Please use a different color scheme."');
  });

  it('prettifies a PascalCase status detail', () => {
    const activities: DocumentActivity[] = [{ type: 'StatusChanged', detail: 'Paid', occurredAtUtc: '2026-08-27T10:00:00Z' }];
    component.activities = activities;
    fixture.detectChanges();

    expect(component.entries[0].detail).toBe('Paid');
  });

  it('prettifies a multi-word PascalCase reminder type', () => {
    component.activities = [{ type: 'ReminderSent', detail: 'InvoiceOverdueFirstNotice', occurredAtUtc: '2026-08-27T10:00:00Z' }];
    fixture.detectChanges();

    expect(component.entries[0].detail).toBe('Invoice Overdue First Notice');
  });

  it('renders one timeline row per activity, oldest to newest as given', () => {
    component.activities = [
      { type: 'Created', detail: null, occurredAtUtc: '2026-08-25T09:00:00Z' },
      { type: 'Dispatched', detail: null, occurredAtUtc: '2026-08-26T09:00:00Z' },
      { type: 'Viewed', detail: null, occurredAtUtc: '2026-08-27T09:00:00Z' }
    ];
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.timeline__entry');
    expect(rows.length).toBe(3);
  });
});
