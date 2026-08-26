import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { DocumentService } from '../../core/services/document.service';
import { Customer } from '../../core/models/customer.model';
import { Document as DocumentModel } from '../../core/models/document.model';

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
  addForm: FormGroup;
  addError = '';
  saving = false;

  selectedCustomer: Customer | null = null;
  selectedCustomerDocuments: DocumentModel[] = [];
  profileLoading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly customerService: CustomerService,
    private readonly documentService: DocumentService
  ) {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      company: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });
  }

  ngOnInit(): void {
    this.load();
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
    this.addForm.reset();
    this.addError = '';
    this.showAddModal = true;
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

    const { name, company, email, phone } = this.addForm.value;
    this.customerService.create({ name, company, email, phone: phone || null }).subscribe({
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
