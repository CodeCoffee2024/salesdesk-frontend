import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { DocumentPreviewComponent } from './document-preview.component';
import { DocumentService } from '../../../core/services/document.service';
import { PdfService } from '../../../core/services/pdf.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { HasRoleDirective } from '../../../shared/has-role.directive';
import { Document as DocumentModel } from '../../../core/models/document.model';

function makeDocument(overrides: Partial<DocumentModel> = {}): DocumentModel {
  return {
    id: '3a94928f-7367-4206-a02f-b2fc9884b087',
    publicToken: 'b1e2c3d4-0000-0000-0000-000000000000',
    isLocked: false,
    signature: null,
    documentNumber: 'QUO-2026-028',
    type: 'Quote',
    status: 'Sent',
    issueDate: '2026-08-10',
    dueDate: '2026-08-24',
    customerId: 'cust-1',
    customerName: 'Andre Santos',
    customerCompany: 'Santos & Co.',
    templateId: 'tpl-1',
    templateName: 'Friendly Quote',
    subtotal: 6800,
    total: 6800,
    lineItems: [{ id: 'li-1', productId: null, description: 'Web design & build', quantity: 1, unitPrice: 6800, lineTotal: 6800 }],
    ...overrides
  };
}

describe('DocumentPreviewComponent', () => {
  let fixture: ComponentFixture<DocumentPreviewComponent>;
  let component: DocumentPreviewComponent;
  let documentServiceSpy: jasmine.SpyObj<DocumentService>;
  let pdfServiceSpy: jasmine.SpyObj<PdfService>;
  let router: Router;

  function setup(id: string, documentResult: DocumentModel | 'error' = makeDocument()) {
    documentServiceSpy = jasmine.createSpyObj('DocumentService', ['getById', 'updateStatus', 'convertToInvoice', 'delete']);
    documentServiceSpy.getById.and.returnValue(
      documentResult === 'error' ? throwError(() => new Error('not found')) : of(documentResult)
    );
    documentServiceSpy.updateStatus.and.returnValue(of(makeDocument({ status: 'Accepted' })));
    documentServiceSpy.convertToInvoice.and.returnValue(of(makeDocument({ id: 'new-invoice-id', type: 'Invoice' })));
    documentServiceSpy.delete.and.returnValue(of(undefined));
    pdfServiceSpy = jasmine.createSpyObj('PdfService', ['download']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      declarations: [DocumentPreviewComponent, EmptyStateComponent, StatusBadgeComponent, ConfirmDialogComponent, HasRoleDirective],
      providers: [
        { provide: DocumentService, useValue: documentServiceSpy },
        { provide: PdfService, useValue: pdfServiceSpy },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id })) } }
      ]
    });

    fixture = TestBed.createComponent(DocumentPreviewComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  it('shows not-found for a syntactically invalid id without calling the API', () => {
    setup('invalid-id');
    expect(component.notFound).toBeTrue();
    expect(documentServiceSpy.getById).not.toHaveBeenCalled();
  });

  it('fetches and displays a valid document', () => {
    setup('3a94928f-7367-4206-a02f-b2fc9884b087');
    expect(documentServiceSpy.getById).toHaveBeenCalledWith('3a94928f-7367-4206-a02f-b2fc9884b087');
    expect(component.document?.documentNumber).toBe('QUO-2026-028');
    expect(component.notFound).toBeFalse();
  });

  it('shows not-found when the API 404s for a well-formed but nonexistent id', () => {
    setup('3a94928f-7367-4206-a02f-b2fc9884b087', 'error');
    expect(component.notFound).toBeTrue();
  });

  it('offers "Mark as sent" for a Draft document', () => {
    setup('3a94928f-7367-4206-a02f-b2fc9884b087', makeDocument({ status: 'Draft' }));
    expect(component.lifecycleActions.map((a) => a.label)).toEqual(['Mark as sent']);
  });

  it('offers "Mark as accepted" for a Sent quote', () => {
    setup('3a94928f-7367-4206-a02f-b2fc9884b087', makeDocument({ type: 'Quote', status: 'Sent' }));
    expect(component.lifecycleActions.map((a) => a.label)).toEqual(['Mark as accepted']);
  });

  it('offers "Mark as paid" for a Sent or Overdue invoice, not a quote', () => {
    setup('3a94928f-7367-4206-a02f-b2fc9884b087', makeDocument({ type: 'Invoice', status: 'Overdue' }));
    expect(component.lifecycleActions.map((a) => a.label)).toEqual(['Mark as paid']);
  });

  it('offers no lifecycle actions for a Paid invoice', () => {
    setup('3a94928f-7367-4206-a02f-b2fc9884b087', makeDocument({ type: 'Invoice', status: 'Paid' }));
    expect(component.lifecycleActions).toEqual([]);
  });

  it('allows converting to invoice for an Accepted quote', () => {
    setup('3a94928f-7367-4206-a02f-b2fc9884b087', makeDocument({ type: 'Quote', status: 'Accepted' }));
    expect(component.canConvertToInvoice).toBeTrue();
  });

  it('does not allow converting to invoice for a Sent quote', () => {
    setup('3a94928f-7367-4206-a02f-b2fc9884b087', makeDocument({ type: 'Quote', status: 'Sent' }));
    expect(component.canConvertToInvoice).toBeFalse();
  });

  it('does not allow converting to invoice for a Paid invoice', () => {
    setup('3a94928f-7367-4206-a02f-b2fc9884b087', makeDocument({ type: 'Invoice', status: 'Paid' }));
    expect(component.canConvertToInvoice).toBeFalse();
  });

  it('setStatus updates the document in place on success', () => {
    setup('3a94928f-7367-4206-a02f-b2fc9884b087', makeDocument({ status: 'Sent' }));
    component.setStatus('Accepted');
    expect(documentServiceSpy.updateStatus).toHaveBeenCalledWith('3a94928f-7367-4206-a02f-b2fc9884b087', 'Accepted');
    expect(component.document?.status).toBe('Accepted');
  });

  it('convertToInvoice navigates to the new invoice preview on success', () => {
    setup('3a94928f-7367-4206-a02f-b2fc9884b087', makeDocument({ type: 'Quote', status: 'Accepted' }));
    const navigateSpy = spyOn(router, 'navigate');

    component.convertToInvoice();

    expect(documentServiceSpy.convertToInvoice).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/documents', 'new-invoice-id', 'preview']);
  });

  it('requestDelete shows the confirm dialog; confirming deletes and navigates to the list', () => {
    setup('3a94928f-7367-4206-a02f-b2fc9884b087');
    const navigateSpy = spyOn(router, 'navigate');

    component.requestDelete();
    expect(component.showDeleteConfirm).toBeTrue();

    component.confirmDelete();
    expect(documentServiceSpy.delete).toHaveBeenCalledWith('3a94928f-7367-4206-a02f-b2fc9884b087');
    expect(navigateSpy).toHaveBeenCalledWith(['/documents']);
  });

  it('cancelDelete dismisses the confirm dialog', () => {
    setup('3a94928f-7367-4206-a02f-b2fc9884b087');
    component.requestDelete();
    component.cancelDelete();
    expect(component.showDeleteConfirm).toBeFalse();
  });

  it('printDocument triggers window.print', () => {
    setup('3a94928f-7367-4206-a02f-b2fc9884b087');
    const printSpy = spyOn(window, 'print');
    component.printDocument();
    expect(printSpy).toHaveBeenCalled();
  });

  it('downloadPdf delegates to PdfService with the loaded document', () => {
    const doc = makeDocument();
    setup('3a94928f-7367-4206-a02f-b2fc9884b087', doc);
    component.downloadPdf();
    expect(pdfServiceSpy.download).toHaveBeenCalledWith(jasmine.objectContaining({ documentNumber: doc.documentNumber }), null);
  });
});
