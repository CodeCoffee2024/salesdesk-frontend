import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { DocumentsListComponent } from './documents-list.component';
import { DocumentService } from '../../../core/services/document.service';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { HasRoleDirective } from '../../../shared/has-role.directive';
import { CurrencyLocalePipe } from '../../../core/pipes/currency-locale.pipe';
import { Document as DocumentModel } from '../../../core/models/document.model';

function makeDocument(overrides: Partial<DocumentModel> = {}): DocumentModel {
  return {
    id: 'doc-1',
    publicToken: 'pub-token-1',
    isLocked: false,
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
    ...overrides
  };
}

describe('DocumentsListComponent', () => {
  let fixture: ComponentFixture<DocumentsListComponent>;
  let component: DocumentsListComponent;
  let documentServiceSpy: jasmine.SpyObj<DocumentService>;
  let router: Router;

  beforeEach(() => {
    documentServiceSpy = jasmine.createSpyObj('DocumentService', ['getAll', 'updateStatus', 'delete']);
    documentServiceSpy.getAll.and.returnValue(of([makeDocument()]));
    documentServiceSpy.updateStatus.and.returnValue(of(makeDocument({ status: 'Sent' })));
    documentServiceSpy.delete.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      declarations: [DocumentsListComponent, StatusBadgeComponent, ConfirmDialogComponent, HasRoleDirective, CurrencyLocalePipe],
      providers: [{ provide: DocumentService, useValue: documentServiceSpy }]
    });

    fixture = TestBed.createComponent(DocumentsListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
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

  it('changeStatus calls the service and reloads the list', () => {
    documentServiceSpy.getAll.calls.reset();

    component.changeStatus(makeDocument(), 'Sent');

    expect(documentServiceSpy.updateStatus).toHaveBeenCalledWith('doc-1', 'Sent');
    expect(documentServiceSpy.getAll).toHaveBeenCalled();
  });

  it('requestDelete shows the confirm dialog, and confirming deletes and reloads', () => {
    const target = makeDocument();
    component.requestDelete(target);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-confirm-dialog')).toBeTruthy();

    documentServiceSpy.getAll.calls.reset();
    component.confirmDelete();

    expect(documentServiceSpy.delete).toHaveBeenCalledWith('doc-1');
    expect(documentServiceSpy.getAll).toHaveBeenCalled();
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
