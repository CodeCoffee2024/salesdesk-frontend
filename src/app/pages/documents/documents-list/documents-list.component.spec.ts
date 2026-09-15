import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { DocumentsListComponent } from './documents-list.component';
import { DocumentService } from '../../../core/services/document.service';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { HasRoleDirective } from '../../../shared/has-role.directive';
import { TooltipDirective } from '../../../shared/tooltip.directive';
import { SkeletonListComponent } from '../../../shared/skeleton/skeleton-list.component';
import { SkeletonRowComponent } from '../../../shared/skeleton/skeleton-row.component';
import { SkeletonCardComponent } from '../../../shared/skeleton/skeleton-card.component';
import { SkeletonLineComponent } from '../../../shared/skeleton/skeleton-line.component';
import { CurrencyLocalePipe } from '../../../core/pipes/currency-locale.pipe';
import { Document as DocumentModel } from '../../../core/models/document.model';
import { offlineDb } from '../../../core/offline/offline-db';

function makeDocument(overrides: Partial<DocumentModel> = {}): DocumentModel {
  return {
    id: 'doc-1',
    publicToken: 'pub-token-1',
    isLocked: false,
    isDispatched: false,
    dispatchedAt: null,
    signature: null,
    documentNumber: 'QUO-2026-035',
    type: 'Quote',
    status: 'Draft',
    issueDate: '2026-08-25',
    dueDate: '2026-09-08',
    customerId: 'cust-1',
    customerName: 'Maya Chen',
    customerCompany: 'Northstar Studio',
    templateId: 'tpl-1',
    templateName: 'Studio Standard',
    subtotal: 1000,
    total: 1000,
    currency: 'USD',
    clientCountry: null,
    lineItems: [],
    activities: [],
    ...overrides
  };
}

describe('DocumentsListComponent', () => {
  let fixture: ComponentFixture<DocumentsListComponent>;
  let component: DocumentsListComponent;
  let documentServiceSpy: jasmine.SpyObj<DocumentService>;
  let router: Router;

  beforeEach(async () => {
    await offlineDb.cacheEntries.clear();

    documentServiceSpy = jasmine.createSpyObj('DocumentService', ['getAll', 'updateStatus', 'delete']);
    documentServiceSpy.getAll.and.returnValue(of([makeDocument()]));
    documentServiceSpy.updateStatus.and.returnValue(of(makeDocument({ status: 'Sent' })));
    documentServiceSpy.delete.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      declarations: [
        DocumentsListComponent,
        StatusBadgeComponent,
        ConfirmDialogComponent,
        HasRoleDirective,
        TooltipDirective,
        SkeletonListComponent,
        SkeletonRowComponent,
        SkeletonCardComponent,
        SkeletonLineComponent,
        CurrencyLocalePipe
      ],
      providers: [{ provide: DocumentService, useValue: documentServiceSpy }]
    });

    fixture = TestBed.createComponent(DocumentsListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(async () => {
    await offlineDb.cacheEntries.clear();
  });

  it('should create and load documents with the "all" tab on init', () => {
    expect(component).toBeTruthy();
    expect(documentServiceSpy.getAll).toHaveBeenCalledWith({ type: 'all', search: undefined });
    expect(component.documents.length).toBe(1);
  });

  it('switching tabs reloads with the new type filter', () => {
    component.setTab('invoice');
    expect(documentServiceSpy.getAll).toHaveBeenCalledWith({ type: 'invoice', search: undefined });
  });

  it('does not reload when clicking the already-active tab', () => {
    documentServiceSpy.getAll.calls.reset();
    component.setTab('all');
    expect(documentServiceSpy.getAll).not.toHaveBeenCalled();
  });

  it('debounces search input before reloading', fakeAsync(() => {
    documentServiceSpy.getAll.calls.reset();

    component.onSearchInput('m');
    component.onSearchInput('ma');
    component.onSearchInput('maya');
    tick(299);
    expect(documentServiceSpy.getAll).not.toHaveBeenCalled();

    tick(1);
    expect(documentServiceSpy.getAll).toHaveBeenCalledWith({ type: 'all', search: 'maya' });
    expect(documentServiceSpy.getAll).toHaveBeenCalledTimes(1);
  }));

  it('toggles the kebab menu open and closed for a row', () => {
    const event = new MouseEvent('click');
    component.toggleMenu('doc-1', event);
    expect(component.openMenuForId).toBe('doc-1');

    component.toggleMenu('doc-1', event);
    expect(component.openMenuForId).toBeNull();
  });

  it('closeMenu (bound to document:click) closes any open menu', () => {
    component.openMenuForId = 'doc-1';
    component.statusMenuOpen = true;

    component.closeMenu();

    expect(component.openMenuForId).toBeNull();
    expect(component.statusMenuOpen).toBeFalse();
  });

  it('changeStatus updates the row optimistically for a reversible status, without waiting on the server', () => {
    // updateStatus deliberately never resolves here — proves the row updates before the response arrives.
    documentServiceSpy.updateStatus.and.returnValue(new Subject<DocumentModel>());
    component.documents = [makeDocument()];

    component.changeStatus(component.documents[0], 'Sent');

    expect(documentServiceSpy.updateStatus).toHaveBeenCalledWith('doc-1', 'Sent');
    expect(component.documents[0].status).toBe('Sent');
  });

  it('changeStatus rolls back the row and surfaces an inline error if the request fails', () => {
    documentServiceSpy.updateStatus.and.returnValue(throwError(() => new Error('down')));
    component.documents = [makeDocument({ status: 'Draft' })];

    component.changeStatus(component.documents[0], 'Sent');

    expect(component.documents[0].status).toBe('Draft');
    expect(component.actionError).toContain('QUO-2026-035');
  });

  it('changeStatus to "Paid" waits for the server rather than updating optimistically', () => {
    const pending = new Subject<DocumentModel>();
    documentServiceSpy.updateStatus.and.returnValue(pending);
    component.documents = [makeDocument({ status: 'Sent' })];

    component.changeStatus(component.documents[0], 'Paid');

    expect(component.documents[0].status).toBe('Sent');
    expect(component.updatingStatusForId).toBe('doc-1');

    pending.next(makeDocument({ status: 'Paid' }));
    expect(component.documents[0].status).toBe('Paid');
    expect(component.updatingStatusForId).toBeNull();
  });

  it('requestDelete shows the confirm dialog, and confirming removes the row without a full reload', () => {
    const target = makeDocument();
    component.documents = [target];
    component.requestDelete(target);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-confirm-dialog')).toBeTruthy();

    documentServiceSpy.getAll.calls.reset();
    component.confirmDelete();

    expect(documentServiceSpy.delete).toHaveBeenCalledWith('doc-1');
    expect(documentServiceSpy.getAll).not.toHaveBeenCalled();
    expect(component.documents.length).toBe(0);
    expect(component.documentPendingDelete).toBeNull();
  });

  it('cancelDelete dismisses the confirm dialog without deleting', () => {
    component.requestDelete(makeDocument());
    component.cancelDelete();

    expect(component.documentPendingDelete).toBeNull();
    expect(documentServiceSpy.delete).not.toHaveBeenCalled();
  });

  it('preview navigates to the document preview route', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.preview('doc-1');
    expect(navigateSpy).toHaveBeenCalledWith(['/documents', 'doc-1', 'preview']);
  });

  it('edit navigates to the document edit route', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.edit('doc-1');
    expect(navigateSpy).toHaveBeenCalledWith(['/documents', 'doc-1', 'edit']);
  });
});
