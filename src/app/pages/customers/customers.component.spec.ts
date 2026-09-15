import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, of, throwError } from 'rxjs';

import { CustomersComponent } from './customers.component';
import { CustomerService } from '../../core/services/customer.service';
import { DocumentService } from '../../core/services/document.service';
import { WorkspaceProfileService } from '../../core/services/workspace-profile.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { HasRoleDirective } from '../../shared/has-role.directive';
import { TooltipDirective } from '../../shared/tooltip.directive';
import { SkeletonListComponent } from '../../shared/skeleton/skeleton-list.component';
import { SkeletonRowComponent } from '../../shared/skeleton/skeleton-row.component';
import { SkeletonCardComponent } from '../../shared/skeleton/skeleton-card.component';
import { SkeletonLineComponent } from '../../shared/skeleton/skeleton-line.component';
import { CurrencyLocalePipe } from '../../core/pipes/currency-locale.pipe';
import { Customer } from '../../core/models/customer.model';
import { Document as DocumentModel } from '../../core/models/document.model';
import { WorkspaceProfile } from '../../core/models/workspace-profile.model';
import { offlineDb } from '../../core/offline/offline-db';

const SKELETON_DECLARATIONS = [SkeletonListComponent, SkeletonRowComponent, SkeletonCardComponent, SkeletonLineComponent];

const workspaceProfile: WorkspaceProfile = {
  name: 'Northline',
  email: 'hello@northline.studio',
  tagline: null,
  address: null,
  logoUrl: null,
  country: 'US',
  defaultCurrency: 'USD',
  timeZoneId: 'UTC'
};

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'cust-1',
    name: 'Maya Chen',
    company: 'Northstar Studio',
    email: 'maya@northstar.studio',
    phone: '+1 415 555 0100',
    country: null,
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

  beforeEach(async () => {
    await offlineDb.cacheEntries.clear();
  });

  afterEach(async () => {
    await offlineDb.cacheEntries.clear();
  });

  function setup(customers: Customer[] = [makeCustomer()]) {
    customerServiceSpy = jasmine.createSpyObj('CustomerService', ['getAll', 'create', 'update', 'delete']);
    customerServiceSpy.getAll.and.returnValue(of(customers));
    customerServiceSpy.create.and.returnValue(of(makeCustomer({ id: 'cust-2', name: 'New Customer' })));

    documentServiceSpy = jasmine.createSpyObj('DocumentService', ['getAll']);
    documentServiceSpy.getAll.and.returnValue(of([] as DocumentModel[]));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      declarations: [CustomersComponent, EmptyStateComponent, StatusBadgeComponent, HasRoleDirective, TooltipDirective, ...SKELETON_DECLARATIONS, CurrencyLocalePipe],
      providers: [
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: DocumentService, useValue: documentServiceSpy },
        { provide: WorkspaceProfileService, useValue: { getCached: () => of(workspaceProfile) } }
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

  it('shows a load error state when the API call fails', async () => {
    customerServiceSpy = jasmine.createSpyObj('CustomerService', ['getAll', 'create', 'update', 'delete']);
    customerServiceSpy.getAll.and.returnValue(throwError(() => new Error('down')));
    documentServiceSpy = jasmine.createSpyObj('DocumentService', ['getAll']);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      declarations: [CustomersComponent, EmptyStateComponent, StatusBadgeComponent, HasRoleDirective, TooltipDirective, ...SKELETON_DECLARATIONS, CurrencyLocalePipe],
      providers: [
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: DocumentService, useValue: documentServiceSpy },
        { provide: WorkspaceProfileService, useValue: { getCached: () => of(workspaceProfile) } }
      ]
    });
    fixture = TestBed.createComponent(CustomersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // staleWhileRevalidate's "nothing cached, so surface the error" branch checks
    // the cache promise before erroring — a real (if effectively instant) async
    // IndexedDB read, not just a synchronous rethrow.
    await new Promise((resolve) => setTimeout(resolve, 50));

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
    component.addForm.setValue({ name: 'New Customer', company: 'New Co.', email: 'new@co.com', phone: '', country: null });

    component.submitAdd();

    expect(customerServiceSpy.create).toHaveBeenCalledWith({
      name: 'New Customer',
      company: 'New Co.',
      email: 'new@co.com',
      phone: null,
      country: null
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

  it('editing a customer updates the card immediately and closes the modal without waiting on the server', () => {
    const customer = makeCustomer();
    setup([customer]);
    customerServiceSpy.update.and.returnValue(new Subject<Customer>());

    component.openEditModal(customer);
    component.addForm.patchValue({ name: 'Maya Chen-Ortiz' });
    component.submitAdd();

    expect(component.showAddModal).toBeFalse();
    expect(component.customers[0].name).toBe('Maya Chen-Ortiz');
    expect(customerServiceSpy.update).toHaveBeenCalledWith('cust-1', jasmine.objectContaining({ name: 'Maya Chen-Ortiz' }));
  });

  it('rolls back an edited customer and surfaces an inline error if the save fails', () => {
    const customer = makeCustomer();
    setup([customer]);
    customerServiceSpy.update.and.returnValue(throwError(() => new Error('down')));

    component.openEditModal(customer);
    component.addForm.patchValue({ name: 'Maya Chen-Ortiz' });
    component.submitAdd();

    expect(component.customers[0].name).toBe('Maya Chen');
    expect(component.editRollbackError).toContain('Maya Chen');
  });

  it('confirmDelete waits for the server and removes the card only once it confirms', () => {
    const customer = makeCustomer();
    setup([customer]);
    const pending = new Subject<void>();
    customerServiceSpy.delete.and.returnValue(pending);

    component.requestDelete(customer);
    component.confirmDelete();

    expect(component.deletingCustomerInFlight).toBeTrue();
    expect(component.customers.length).toBe(1);

    pending.next();
    pending.complete();

    expect(component.customers.length).toBe(0);
    expect(component.deletingCustomerInFlight).toBeFalse();
  });
});
