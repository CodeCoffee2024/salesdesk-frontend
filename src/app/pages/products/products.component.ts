import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService, PRODUCTS_LIST_CACHE_KEY } from '../../core/services/product.service';
import { WorkspaceProfileService } from '../../core/services/workspace-profile.service';
import { LocalCacheService } from '../../core/services/local-cache.service';
import { staleWhileRevalidate } from '../../core/utils/stale-while-revalidate.util';
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

  deletingProduct: Product | null = null;
  deletingProductInFlight = false;
  deleteError = '';

  /** Inline error surfaced when an optimistic edit gets rolled back (TASK-041). */
  editRollbackError = '';

  /** Workspace's own default currency (TASK-029) — catalog prices aren't per-document, so they format in the workspace's base currency. */
  workspaceCurrency = 'USD';

  constructor(
    private readonly fb: FormBuilder,
    private readonly productService: ProductService,
    private readonly workspaceProfileService: WorkspaceProfileService,
    private readonly cache: LocalCacheService
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

    this.saveError = '';
    const { name, price, unit, description, category } = this.form.value;
    const request = { name, price, unit, description: description || null, category: category || null };

    if (this.modalMode === 'edit' && this.editingProduct) {
      this.submitEditOptimistically(this.editingProduct, request);
      return;
    }

    // Creating waits for the server as before (TASK-041): there's no real id to
    // render a new row under until one is assigned, so there's nothing safe to
    // show optimistically — only an edit to an already-identified row qualifies.
    this.saving = true;
    this.productService.create(request).subscribe({
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

  /** TASK-041: an edit to a product already in the list updates the row immediately and reconciles once the server responds, rolling back (with an inline error) if the save actually fails. */
  private submitEditOptimistically(
    target: Product,
    request: { name: string; price: number; unit: ProductUnit; description: string | null; category: string | null }
  ): void {
    this.editRollbackError = '';
    const previous = target;
    const optimistic: Product = { ...target, ...request };

    this.products = this.products.map((p) => (p.id === target.id ? optimistic : p));
    this.showModal = false;

    this.productService.update(target.id, request).subscribe({
      next: (updated) => {
        this.products = this.products.map((p) => (p.id === updated.id ? updated : p));
      },
      error: () => {
        this.products = this.products.map((p) => (p.id === previous.id ? previous : p));
        this.editRollbackError = `Could not save changes to ${previous.name}. Please try again.`;
      }
    });
  }

  requestDelete(product: Product, event: MouseEvent): void {
    event.stopPropagation();
    this.deletingProduct = product;
    this.deleteError = '';
  }

  cancelDelete(): void {
    this.deletingProduct = null;
  }

  /** Deletion is irreversible, so it waits for the server rather than optimistically removing the row (TASK-041 guardrail). */
  confirmDelete(): void {
    if (!this.deletingProduct) {
      return;
    }

    const id = this.deletingProduct.id;
    this.deletingProductInFlight = true;

    this.productService.delete(id).subscribe({
      next: () => {
        this.products = this.products.filter((p) => p.id !== id);
        this.deletingProduct = null;
        this.deletingProductInFlight = false;
      },
      error: () => {
        this.deleteError = 'Could not delete this product. Please try again.';
        this.deletingProduct = null;
        this.deletingProductInFlight = false;
      }
    });
  }

  /** TASK-041: renders the cached catalog immediately on a repeat visit this session (stale-while-revalidate) while a background refresh reconciles it — see staleWhileRevalidate. */
  private load(): void {
    this.loading = true;
    this.loadError = false;

    staleWhileRevalidate(this.cache, PRODUCTS_LIST_CACHE_KEY, this.productService.getAll()).subscribe({
      next: ({ data }) => {
        this.products = data;
        this.loading = false;
      },
      error: () => {
        this.loadError = this.products.length === 0;
        this.loading = false;
      }
    });
  }
}
