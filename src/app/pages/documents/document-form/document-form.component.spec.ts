import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DocumentFormComponent } from './document-form.component';
import { DocumentService } from '../../../core/services/document.service';
import { CustomerService } from '../../../core/services/customer.service';
import { TemplateService } from '../../../core/services/template.service';
import { ProductService } from '../../../core/services/product.service';
import { Customer } from '../../../core/models/customer.model';
import { Template } from '../../../core/models/template.model';
import { Product } from '../../../core/models/product.model';
import { Document as DocumentModel } from '../../../core/models/document.model';

const customers: Customer[] = [
  { id: 'cust-1', name: 'Maya Chen', company: 'Northstar Studio', email: 'maya@northstar.studio', phone: null, createdAt: '2026-01-01', lifetimeValue: 0 }
];
const templates: Template[] = [
  { id: 'tpl-1', name: 'Modern Minimal', description: null, targetType: 'QuotesAndInvoices', accentColor: '#2F6F6C', isDefault: false, usageCount: 0 },
  { id: 'tpl-2', name: 'Studio Standard', description: null, targetType: 'QuotesAndInvoices', accentColor: '#D9A441', isDefault: true, usageCount: 10 }
];
const products: Product[] = [
  { id: 'prod-1', name: 'SEO Audit', description: null, price: 750, unit: 'Project', category: null },
  { id: 'prod-2', name: 'Brand identity sprint', description: null, price: 4200, unit: 'Project', category: null }
];

function makeDocument(overrides: Partial<DocumentModel> = {}): DocumentModel {
  return {
    id: 'doc-1',
    documentNumber: 'QUO-2026-035',
    type: 'Quote',
    status: 'Sent',
    issueDate: '2026-08-25',
    dueDate: '2026-09-08',
    customerId: 'cust-1',
    customerName: 'Maya Chen',
    customerCompany: 'Northstar Studio',
    templateId: 'tpl-1',
    templateName: 'Modern Minimal',
    subtotal: 1000,
    total: 1000,
    lineItems: [{ id: 'li-1', productId: null, description: 'Research', quantity: 2, unitPrice: 500, lineTotal: 1000 }],
    ...overrides
  };
}

describe('DocumentFormComponent', () => {
  let fixture: ComponentFixture<DocumentFormComponent>;
  let component: DocumentFormComponent;
  let documentServiceSpy: jasmine.SpyObj<DocumentService>;
  let router: Router;

  function setup(routeId: string | null) {
    documentServiceSpy = jasmine.createSpyObj('DocumentService', ['getById', 'create', 'update']);
    documentServiceSpy.getById.and.returnValue(of(makeDocument()));
    documentServiceSpy.create.and.returnValue(of(makeDocument({ id: 'new-doc' })));
    documentServiceSpy.update.and.returnValue(of(makeDocument()));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [DocumentFormComponent],
      providers: [
        { provide: DocumentService, useValue: documentServiceSpy },
        { provide: CustomerService, useValue: { getAll: () => of(customers) } },
        { provide: TemplateService, useValue: { getAll: () => of(templates) } },
        { provide: ProductService, useValue: { getAll: () => of(products) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(routeId ? { id: routeId } : {}) } } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    });

    fixture = TestBed.createComponent(DocumentFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  describe('create mode', () => {
    beforeEach(() => setup(null));

    it('defaults to the workspace default template and one empty line item', () => {
      expect(component.isEditMode).toBeFalse();
      expect(component.form.value.templateId).toBe('tpl-2');
      expect(component.lineItems.length).toBe(1);
    });

    it('leaves type and customer editable', () => {
      expect(component.form.get('type')?.disabled).toBeFalse();
      expect(component.form.get('customerId')?.disabled).toBeFalse();
    });

    it('computes the line total and subtotal from quantity and unit price', () => {
      component.lineItems.at(0).patchValue({ quantity: 3, unitPrice: 100 });
      expect(component.lineTotal(0)).toBe(300);
      expect(component.subtotal).toBe(300);
    });

    it('adds and removes line items', () => {
      component.addLineItem();
      expect(component.lineItems.length).toBe(2);

      component.removeLineItem(0);
      expect(component.lineItems.length).toBe(1);
    });

    it('filters catalog suggestions by the typed description', () => {
      component.lineItems.at(0).patchValue({ description: 'brand' });
      const suggestions = component.productSuggestions(0);
      expect(suggestions).toEqual([products[1]]);
    });

    it('selecting a product fills description, unit price, quantity, and links productId', () => {
      component.selectProduct(0, products[0]);

      const value = component.lineItems.at(0).value;
      expect(value.description).toBe('SEO Audit');
      expect(value.unitPrice).toBe(750);
      expect(value.quantity).toBe(1);
      expect(value.productId).toBe('prod-1');
    });

    it('editing the description after selecting a product detaches the catalog link', () => {
      component.selectProduct(0, products[0]);
      component.lineItems.at(0).patchValue({ description: 'SEO Audit (custom scope)' });

      component.onDescriptionEdited(0);

      expect(component.lineItems.at(0).value.productId).toBeNull();
    });

    it('does not detach the link if the description still matches the product name', () => {
      component.selectProduct(0, products[0]);
      component.onDescriptionEdited(0);

      expect(component.lineItems.at(0).value.productId).toBe('prod-1');
    });

    it('blocks submit and marks the form touched when invalid', () => {
      component.form.patchValue({ customerId: '' });
      component.submit();

      expect(documentServiceSpy.create).not.toHaveBeenCalled();
      expect(component.form.get('customerId')?.touched).toBeTrue();
    });

    it('blocks submit when there are no line items', () => {
      component.form.patchValue({ customerId: 'cust-1' });
      component.removeLineItem(0);

      component.submit();

      expect(documentServiceSpy.create).not.toHaveBeenCalled();
    });

    it('creates the document and navigates to the list with a highlight state on success', () => {
      component.form.patchValue({ customerId: 'cust-1' });
      component.lineItems.at(0).patchValue({ description: 'Research', quantity: 1, unitPrice: 500 });

      component.submit();

      expect(documentServiceSpy.create).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/documents'], { state: { highlightId: 'new-doc' } });
    });

    it('shows an error and stops saving if create fails', () => {
      documentServiceSpy.create.and.returnValue(throwError(() => new Error('failed')));
      component.form.patchValue({ customerId: 'cust-1' });
      component.lineItems.at(0).patchValue({ description: 'Research', quantity: 1, unitPrice: 500 });

      component.submit();

      expect(component.saving).toBeFalse();
      expect(component.saveError).toContain('Could not create');
    });
  });

  describe('edit mode', () => {
    beforeEach(() => setup('doc-1'));

    it('loads the existing document and disables type and customer', () => {
      expect(component.isEditMode).toBeTrue();
      expect(documentServiceSpy.getById).toHaveBeenCalledWith('doc-1');
      expect(component.form.get('type')?.disabled).toBeTrue();
      expect(component.form.get('customerId')?.disabled).toBeTrue();
      expect(component.lineItems.length).toBe(1);
      expect(component.lineItems.at(0).value.description).toBe('Research');
    });

    it('saves via update and navigates to the preview page, preserving the existing status', () => {
      component.submit();

      expect(documentServiceSpy.update).toHaveBeenCalledWith(
        'doc-1',
        jasmine.objectContaining({ status: 'Sent', templateId: 'tpl-1' })
      );
      expect(router.navigate).toHaveBeenCalledWith(['/documents', 'doc-1', 'preview']);
    });
  });
});
