import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService, CUSTOMERS_LIST_CACHE_KEY } from '../../core/services/customer.service';
import { DocumentService } from '../../core/services/document.service';
import { WorkspaceProfileService } from '../../core/services/workspace-profile.service';
import { LocalCacheService } from '../../core/services/local-cache.service';
import { staleWhileRevalidate } from '../../core/utils/stale-while-revalidate.util';
import { Customer } from '../../core/models/customer.model';
import { Document as DocumentModel } from '../../core/models/document.model';
import { ISO_COUNTRIES } from '../../core/constants/locale.constants';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  loading = true;
  loadError = false;
  searchTerm = '';

  showAddModal = false;
  addModalMode: 'add' | 'edit' = 'add';
  editingCustomer: Customer | null = null;
  addForm: FormGroup;
  addError = '';
  saving = false;

  selectedCustomer: Customer | null = null;
  selectedCustomerDocuments: DocumentModel[] = [];
  profileLoading = false;

  deletingCustomer: Customer | null = null;
  deletingCustomerInFlight = false;
  deleteError = '';

  /** Inline error surfaced when an optimistic edit gets rolled back (TASK-041). */
  editRollbackError = '';

  readonly countries = ISO_COUNTRIES;
  /** Workspace's own default currency (TASK-029) — used to format the aggregate LifetimeValue figure, which isn't tied to any single document's currency. */
  workspaceCurrency = 'USD';

  constructor(
    private readonly fb: FormBuilder,
    private readonly customerService: CustomerService,
    private readonly documentService: DocumentService,
    private readonly workspaceProfileService: WorkspaceProfileService,
    private readonly cache: LocalCacheService
  ) {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      company: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      country: [null as string | null]
    });
  }

  ngOnInit(): void {
    this.load();
    this.workspaceProfileService.getCached().subscribe((profile) => (this.workspaceCurrency = profile.defaultCurrency));
  }

  get filteredCustomers(): Customer[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.customers;
    }

    return this.customers.filter(
      (c) => c.name.toLowerCase().includes(term) || c.company.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)
    );
  }

  get formErrors(): string[] {
    const errors: string[] = [];
    if (this.addForm.get('name')?.invalid) {
      errors.push('Name is required.');
    }
    if (this.addForm.get('company')?.invalid) {
      errors.push('Company is required.');
    }
    if (this.addForm.get('email')?.hasError('required')) {
      errors.push('Email is required.');
    } else if (this.addForm.get('email')?.hasError('email')) {
      errors.push('Enter a valid email address.');
    }
    return errors;
  }

  openAddModal(): void {
    this.addModalMode = 'add';
    this.editingCustomer = null;
    this.addForm.reset();
    this.addError = '';
    this.showAddModal = true;
  }

  openEditModal(customer: Customer): void {
    this.addModalMode = 'edit';
    this.editingCustomer = customer;
    this.addForm.reset({
      name: customer.name,
      company: customer.company,
      email: customer.email,
      phone: customer.phone ?? '',
      country: customer.country ?? null
    });
    this.addError = '';
    this.showAddModal = true;
    // The edit form replaces the read-only profile view rather than stacking on top of it.
    this.selectedCustomer = null;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  submitAdd(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }

    this.addError = '';
    const { name, company, email, phone, country } = this.addForm.value;
    const request = { name, company, email, phone: phone || null, country: country || null };

    if (this.addModalMode === 'edit' && this.editingCustomer) {
      this.submitEditOptimistically(this.editingCustomer, request);
      return;
    }

    // Creating goes through the normal wait-for-the-server flow (TASK-041): there's
    // no real id to render a new card under until the server assigns one, so there's
    // nothing safe to show optimistically here — only an edit to an existing,
    // already-identified row qualifies.
    this.saving = true;
    this.customerService.create(request).subscribe({
      next: () => {
        this.saving = false;
        this.showAddModal = false;
        this.load();
      },
      error: () => {
        this.saving = false;
        this.addError = 'Could not add this customer. Please try again.';
      }
    });
  }

  /** TASK-041: an edit to a customer already in the list updates the card immediately and reconciles once the server responds, rolling back (with an inline error) if the save actually fails. */
  private submitEditOptimistically(target: Customer, request: { name: string; company: string; email: string; phone: string | null; country: string | null }): void {
    this.editRollbackError = '';
    const previous = target;
    const optimistic: Customer = { ...target, ...request };

    this.customers = this.customers.map((c) => (c.id === target.id ? optimistic : c));
    this.showAddModal = false;

    this.customerService.update(target.id, request).subscribe({
      next: (updated) => {
        this.customers = this.customers.map((c) => (c.id === updated.id ? updated : c));
      },
      error: () => {
        this.customers = this.customers.map((c) => (c.id === previous.id ? previous : c));
        this.editRollbackError = `Could not save changes to ${previous.name}. Please try again.`;
      }
    });
  }

  viewProfile(customer: Customer): void {
    this.selectedCustomer = customer;
    this.selectedCustomerDocuments = [];
    this.profileLoading = true;

    this.documentService.getAll().subscribe({
      next: (documents) => {
        this.selectedCustomerDocuments = documents.filter((d) => d.customerId === customer.id);
        this.profileLoading = false;
      },
      error: () => {
        this.profileLoading = false;
      }
    });
  }

  closeProfile(): void {
    this.selectedCustomer = null;
    this.selectedCustomerDocuments = [];
  }

  requestDelete(customer: Customer): void {
    this.deletingCustomer = customer;
    this.deleteError = '';
    this.selectedCustomer = null;
  }

  cancelDelete(): void {
    this.deletingCustomer = null;
  }

  /** Deletion is irreversible, so it waits for the server rather than optimistically removing the card (TASK-041 guardrail) — deletingCustomerInFlight keeps the confirm button disabled with a busy label instead of just doing nothing if double-clicked. */
  confirmDelete(): void {
    if (!this.deletingCustomer) {
      return;
    }

    const id = this.deletingCustomer.id;
    this.deletingCustomerInFlight = true;

    this.customerService.delete(id).subscribe({
      next: () => {
        this.customers = this.customers.filter((c) => c.id !== id);
        this.deletingCustomer = null;
        this.deletingCustomerInFlight = false;
      },
      error: (error) => {
        this.deletingCustomer = null;
        this.deletingCustomerInFlight = false;
        // 409: the database still has documents pointing at this customer (restricted FK) — see DeleteCustomerCommand.
        this.deleteError = error?.status === 409
          ? 'This customer has existing quotes or invoices and can\'t be deleted. Void those documents first.'
          : 'Could not delete this customer. Please try again.';
      }
    });
  }

  /**
   * TASK-041: renders the last-known-good cached list immediately on a repeat
   * visit this session (stale-while-revalidate) while a background refresh
   * reconciles it — `loading` only stays visible long enough to show the
   * skeleton on a genuine first-ever visit; see staleWhileRevalidate.
   */
  private load(): void {
    this.loading = true;
    this.loadError = false;

    staleWhileRevalidate(this.cache, CUSTOMERS_LIST_CACHE_KEY, this.customerService.getAll()).subscribe({
      next: ({ data }) => {
        this.customers = data;
        this.loading = false;
      },
      error: () => {
        this.loadError = this.customers.length === 0;
        this.loading = false;
      }
    });
  }
}
