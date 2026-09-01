import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { WorkspaceProfileService } from '../../core/services/workspace-profile.service';
import { Product, ProductUnit } from '../../core/models/product.model';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  readonly unitOptions: ProductUnit[] = ['Project', 'Hour', 'Day', 'Month'];

  products: Product[] = [];
  loading = true;
  loadError = false;
  searchTerm = '';

  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  editingProduct: Product | null = null;
  form: FormGroup;
  saveError = '';
  saving = false;

  /** Workspace's own default currency (TASK-029) — catalog prices aren't per-document, so they format in the workspace's base currency. */
  workspaceCurrency = 'USD';

  constructor(
    private readonly fb: FormBuilder,
    private readonly productService: ProductService,
    private readonly workspaceProfileService: WorkspaceProfileService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      unit: ['Project' as ProductUnit, Validators.required],
      description: [''],
      category: ['']
    });
  }

  ngOnInit(): void {
    this.load();
    this.workspaceProfileService.getCached().subscribe((profile) => (this.workspaceCurrency = profile.defaultCurrency));
  }

  get filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.products;
    }

    return this.products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.category ?? '').toLowerCase().includes(term) ||
        (p.description ?? '').toLowerCase().includes(term)
    );
  }

  get formErrors(): string[] {
    const errors: string[] = [];
    if (this.form.get('name')?.invalid) {
      errors.push('Name is required.');
    }
    if (this.form.get('price')?.invalid) {
      errors.push('Price must be greater than zero.');
    }
    return errors;
  }

  openAddModal(): void {
    this.modalMode = 'add';
    this.editingProduct = null;
    this.form.reset({ name: '', price: 0, unit: 'Project', description: '', category: '' });
    this.saveError = '';
    this.showModal = true;
  }

  openEditModal(product: Product, event: MouseEvent): void {
    event.stopPropagation();
    this.modalMode = 'edit';
    this.editingProduct = product;
    this.form.reset({
      name: product.name,
      price: product.price,
      unit: product.unit,
      description: product.description ?? '',
      category: product.category ?? ''
    });
    this.saveError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.saveError = '';

    const { name, price, unit, description, category } = this.form.value;
    const request = { name, price, unit, description: description || null, category: category || null };

    const save$ =
      this.modalMode === 'edit' && this.editingProduct
        ? this.productService.update(this.editingProduct.id, request)
        : this.productService.create(request);

    save$.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.load();
      },
      error: () => {
        this.saving = false;
        this.saveError = 'Could not save this product. Please try again.';
      }
    });
  }

  private load(): void {
    this.loading = true;
    this.loadError = false;

    this.productService.getAll().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      }
    });
  }
}
