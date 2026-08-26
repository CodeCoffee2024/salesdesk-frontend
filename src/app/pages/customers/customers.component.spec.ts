import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { CustomersComponent } from './customers.component';
import { CustomerService } from '../../core/services/customer.service';
import { DocumentService } from '../../core/services/document.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { HasRoleDirective } from '../../shared/has-role.directive';
import { Customer } from '../../core/models/customer.model';
import { Document as DocumentModel } from '../../core/models/document.model';

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'cust-1',
    name: 'Maya Chen',
    company: 'Northstar Studio',
    email: 'maya@northstar.studio',
    phone: '+1 415 555 0100',
    createdAt: '2026-01-10T00:00:00Z',
    lifetimeValue: 4200,
    ...overrides
  };
}

describe('CustomersComponent', () => {
  let component: CustomersComponent;
  let fixture: ComponentFixture<CustomersComponent>;
  let customerServiceSpy: jasmine.SpyObj<CustomerService>;
  let documentServiceSpy: jasmine.SpyObj<DocumentService>;

  function setup(customers: Customer[] = [makeCustomer()]) {
    customerServiceSpy = jasmine.createSpyObj('CustomerService', ['getAll', 'create']);
    customerServiceSpy.getAll.and.returnValue(of(customers));
    customerServiceSpy.create.and.returnValue(of(makeCustomer({ id: 'cust-2', name: 'New Customer' })));

    documentServiceSpy = jasmine.createSpyObj('DocumentService', ['getAll']);
    documentServiceSpy.getAll.and.returnValue(of([] as DocumentModel[]));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      declarations: [CustomersComponent, EmptyStateComponent, StatusBadgeComponent, HasRoleDirective],
      providers: [
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: DocumentService, useValue: documentServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(CustomersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads and displays customers', () => {
    setup();
    expect(customerServiceSpy.getAll).toHaveBeenCalled();
    expect(component.customers.length).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('filters customers by name, company, or email', () => {
    setup([
      makeCustomer({ id: 'a', name: 'Maya Chen', company: 'Northstar Studio', email: 'maya@northstar.studio' }),
      makeCustomer({ id: 'b', name: 'Andre Santos', company: 'Santos & Co.', email: 'andre@santosco.ph' })
    ]);

    component.searchTerm = 'santos';
    expect(component.filteredCustomers.map((c) => c.id)).toEqual(['b']);
  });

  it('shows a load error state when the API call fails', () => {
    customerServiceSpy = jasmine.createSpyObj('CustomerService', ['getAll', 'create']);
    customerServiceSpy.getAll.and.returnValue(throwError(() => new Error('down')));
    documentServiceSpy = jasmine.createSpyObj('DocumentService', ['getAll']);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      declarations: [CustomersComponent, EmptyStateComponent, StatusBadgeComponent, HasRoleDirective],
      providers: [
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: DocumentService, useValue: documentServiceSpy }
      ]
    });
    fixture = TestBed.createComponent(CustomersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.loadError).toBeTrue();
  });

  it('rejects an incomplete add-customer form without calling the API', () => {
    setup();
    component.openAddModal();
    component.submitAdd();

    expect(customerServiceSpy.create).not.toHaveBeenCalled();
    expect(component.formErrors.length).toBeGreaterThan(0);
  });

  it('submits a valid add-customer form and reloads the list', () => {
    setup();
    component.openAddModal();
    component.addForm.setValue({ name: 'New Customer', company: 'New Co.', email: 'new@co.com', phone: '' });

    component.submitAdd();

    expect(customerServiceSpy.create).toHaveBeenCalledWith({
      name: 'New Customer',
      company: 'New Co.',
      email: 'new@co.com',
      phone: null
    });
    expect(component.showAddModal).toBeFalse();
  });

  it('viewProfile loads that customer\'s documents and opens the overlay', () => {
    const customer = makeCustomer();
    const doc = { customerId: customer.id, documentNumber: 'INV-2026-001' } as DocumentModel;
    setup([customer]);
    documentServiceSpy.getAll.and.returnValue(of([doc, { customerId: 'other', documentNumber: 'QUO-2026-002' } as DocumentModel]));

    component.viewProfile(customer);

    expect(component.selectedCustomer).toBe(customer);
    expect(component.selectedCustomerDocuments).toEqual([doc]);
  });

  it('closeProfile clears the selected customer', () => {
    setup();
    component.viewProfile(component.customers[0]);
    component.closeProfile();

    expect(component.selectedCustomer).toBeNull();
    expect(component.selectedCustomerDocuments).toEqual([]);
  });
});
