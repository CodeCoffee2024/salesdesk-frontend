import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { OverviewComponent } from './overview.component';
import { DashboardService } from '../../core/services/dashboard.service';
import { DocumentService } from '../../core/services/document.service';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { Document as DocumentModel } from '../../core/models/document.model';
import { DashboardSummary } from '../../core/models/dashboard.model';

function makeDocument(overrides: Partial<DocumentModel>): DocumentModel {
  return {
    id: 'doc-1',
    publicToken: 'pub-token-1',
    isLocked: false,
    signature: null,
    documentNumber: 'QUO-2026-001',
    type: 'Quote',
    status: 'Draft',
    issueDate: '2026-08-01',
    dueDate: '2026-08-15',
    customerId: 'cust-1',
    customerName: 'Maya Chen',
    customerCompany: 'Northstar Studio',
    templateId: 'tpl-1',
    templateName: 'Studio Standard',
    subtotal: 100,
    total: 100,
    lineItems: [],
    ...overrides
  };
}

describe('OverviewComponent', () => {
  let fixture: ComponentFixture<OverviewComponent>;
  let component: OverviewComponent;

  function setup(summary: DashboardSummary, documents: DocumentModel[]) {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [OverviewComponent, StatusBadgeComponent],
      providers: [
        { provide: DashboardService, useValue: { getSummary: () => of(summary) } },
        { provide: DocumentService, useValue: { getAll: () => of(documents) } }
      ]
    });

    fixture = TestBed.createComponent(OverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const summary: DashboardSummary = { revenueThisYear: 28450, outstanding: 9600, quotePipeline: 6800, activeCustomers: 4 };

  it('should create and load the summary and recent documents', () => {
    setup(summary, [makeDocument({})]);
    expect(component).toBeTruthy();
    expect(component.summary).toEqual(summary);
    expect(component.loading).toBeFalse();
  });

  it('formats KPI values as currency, matching the reference formatting', () => {
    setup(summary, []);
    const el = fixture.nativeElement as HTMLElement;
    const values = Array.from(el.querySelectorAll('.kpi-tile__value')).map((node) => node.textContent?.trim());

    expect(values).toContain('$28,450.00');
    expect(values).toContain('$9,600.00');
    expect(values).toContain('$6,800.00');
    expect(values).toContain('4');
  });

  it('shows at most the 5 most recent documents', () => {
    const documents = Array.from({ length: 8 }, (_, i) => makeDocument({ id: `doc-${i}`, documentNumber: `QUO-2026-0${i}` }));
    setup(summary, documents);

    expect(component.recentDocuments.length).toBe(5);
    expect(fixture.nativeElement.querySelectorAll('.recent-documents__table tbody tr').length).toBe(5);
  });

  it('shows an empty message when there are no documents yet', () => {
    setup(summary, []);
    expect(fixture.nativeElement.querySelector('.recent-documents__empty')).toBeTruthy();
  });

  it('sums only Paid invoices into the current month\'s revenue bucket', () => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-10`;

    const documents = [
      makeDocument({ id: 'paid-invoice', type: 'Invoice', status: 'Paid', issueDate: thisMonth, total: 500 }),
      makeDocument({ id: 'sent-invoice', type: 'Invoice', status: 'Sent', issueDate: thisMonth, total: 300 }),
      makeDocument({ id: 'paid-quote', type: 'Quote', status: 'Paid', issueDate: thisMonth, total: 999 })
    ];
    setup(summary, documents);

    const currentMonthPoint = component.monthlyRevenue[component.monthlyRevenue.length - 1];
    expect(currentMonthPoint.amount).toBe(500);
  });

  it('shows the "warm quote" message when the pipeline is non-zero', () => {
    setup({ ...summary, quotePipeline: 6800 }, []);
    expect(component.nextBestActionMessage).toContain('Turn a warm quote into a yes.');
  });

  it('shows a caught-up message when the pipeline is empty', () => {
    setup({ ...summary, quotePipeline: 0 }, []);
    expect(component.nextBestActionMessage).toContain('caught up');
  });

  it('shows an error state when loading fails', () => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [OverviewComponent, StatusBadgeComponent],
      providers: [
        { provide: DashboardService, useValue: { getSummary: () => throwError(() => new Error('network')) } },
        { provide: DocumentService, useValue: { getAll: () => of([]) } }
      ]
    });

    fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Something went wrong');
  });
});
