import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { DocumentService } from '../../core/services/document.service';
import { WorkspaceProfileService } from '../../core/services/workspace-profile.service';
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
  deleteError = '';

  readonly countries = ISO_COUNTRIES;
  /** Workspace's own default currency (TASK-029) — used to format the aggregate LifetimeValue figure, which isn't tied to any single document's currency. */
  workspaceCurrency = 'USD';

  constructor(
    private readonly fb: FormBuilder,
    private readonly customerService: CustomerService,
    private readonly documentService: DocumentService,
    private readonly workspaceProfileService: WorkspaceProfileService
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

    this.saving = true;
    this.addError = '';

    const { name, company, email, phone, country } = this.addForm.value;
    const request = { name, company, email, phone: phone || null, country: country || null };

    const save$ =
      this.addModalMode === 'edit' && this.editingCustomer
        ? this.customerService.update(this.editingCustomer.id, request)
        : this.customerService.create(request);

    save$.subscribe({
      next: () => {
        this.saving = false;
        this.showAddModal = false;
        this.load();
      },
      error: () => {
        this.saving = false;
        this.addError = this.addModalMode === 'edit'
          ? 'Could not save this customer. Please try again.'
          : 'Could not add this customer. Please try again.';
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

  confirmDelete(): void {
    if (!this.deletingCustomer) {
      return;
    }

    this.customerService.delete(this.deletingCustomer.id).subscribe({
      next: () => {
        this.deletingCustomer = null;
        this.load();
      },
      error: (error) => {
        this.deletingCustomer = null;
        // 409: the database still has documents pointing at this customer (restricted FK) — see DeleteCustomerCommand.
        this.deleteError = error?.status === 409
          ? 'This customer has existing quotes or invoices and can\'t be deleted. Void those documents first.'
          : 'Could not delete this customer. Please try again.';
      }
    });
  }

  private load(): void {
    this.loading = true;
    this.loadError = false;

    this.customerService.getAll().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      }
    });
  }
}
