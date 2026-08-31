import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';

import { DocumentService } from '../../../core/services/document.service';
import { CustomerService } from '../../../core/services/customer.service';
import { TemplateService } from '../../../core/services/template.service';
import { ProductService } from '../../../core/services/product.service';
import { OfflineQueueService } from '../../../core/services/offline-queue.service';
import { Customer } from '../../../core/models/customer.model';
import { Template } from '../../../core/models/template.model';
import { Product } from '../../../core/models/product.model';
import {
  CreateDocumentLineItemRequest,
  CreateDocumentRequest,
  Document as DocumentModel,
  DocumentStatus,
  DocumentType,
  UpdateDocumentRequest
} from '../../../core/models/document.model';

const DEFAULT_DUE_DAYS = 14;
const MAX_SUGGESTIONS = 6;

@Component({
  selector: 'app-document-form',
  templateUrl: './document-form.component.html',
  styleUrls: ['./document-form.component.scss']
})
export class DocumentFormComponent implements OnInit {
  form: FormGroup;

  isEditMode = false;
  documentId: string | null = null;
  private existingStatus: DocumentStatus = 'Draft';

  customers: Customer[] = [];
  templates: Template[] = [];
  products: Product[] = [];

  loading = true;
  loadError = false;
  saving = false;
  saveError = '';

  readonly issueDateDisplay = new Date();

  /** Which line-item row's catalog suggestion list is open, if any. */
  openSuggestionsForIndex: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly documentService: DocumentService,
    private readonly customerService: CustomerService,
    private readonly templateService: TemplateService,
    private readonly productService: ProductService,
    private readonly offlineQueue: OfflineQueueService
  ) {
    this.form = this.fb.group({
      type: ['Quote' as DocumentType, Validators.required],
      customerId: ['', Validators.required],
      templateId: ['', Validators.required],
      dueDate: ['', Validators.required],
      lineItems: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.documentId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.documentId;

    forkJoin({
      customers: this.customerService.getAll(),
      templates: this.templateService.getAll(),
      products: this.productService.getAll(),
      document: this.isEditMode ? this.documentService.getById(this.documentId as string) : of(null)
    }).subscribe({
      next: ({ customers, templates, products, document }) => {
        this.customers = customers;
        this.templates = templates;
        this.products = products;

        if (document) {
          this.populateForEdit(document);
        } else {
          this.populateDefaultsForCreate(templates);
        }

        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      }
    });
  }

  get lineItems(): FormArray {
    return this.form.get('lineItems') as FormArray;
  }

  addLineItem(): void {
    this.lineItems.push(
      this.fb.group({
        description: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(0.01)]],
        unitPrice: [0, [Validators.required, Validators.min(0)]],
        productId: [null as string | null]
      })
    );
  }

  removeLineItem(index: number): void {
    this.lineItems.removeAt(index);
  }

  lineTotal(index: number): number {
    const group = this.lineItems.at(index);
    const quantity = Number(group.get('quantity')?.value) || 0;
    const unitPrice = Number(group.get('unitPrice')?.value) || 0;
    return quantity * unitPrice;
  }

  get subtotal(): number {
    return this.lineItems.controls.reduce((sum: number, _, index) => sum + this.lineTotal(index), 0);
  }

  get selectedTemplate(): Template | undefined {
    return this.templates.find((template) => template.id === this.form.value.templateId);
  }

  get selectedCustomer(): Customer | undefined {
    return this.customers.find((customer) => customer.id === this.form.value.customerId);
  }

  // ---- Catalog-linked combobox (line-item description) ----

  productSuggestions(index: number): Product[] {
    const term = (this.lineItems.at(index).get('description')?.value ?? '').toLowerCase().trim();
    const matches = term
      ? this.products.filter((product) => product.name.toLowerCase().includes(term))
      : this.products;

    return matches.slice(0, MAX_SUGGESTIONS);
  }

  openSuggestions(index: number): void {
    this.openSuggestionsForIndex = index;
  }

  closeSuggestionsSoon(): void {
    // A short delay so a suggestion's (click) has a chance to fire before the
    // input's (blur) would otherwise close the list first.
    setTimeout(() => (this.openSuggestionsForIndex = null), 150);
  }

  selectProduct(index: number, product: Product): void {
    this.lineItems.at(index).patchValue({
      description: product.name,
      unitPrice: product.price,
      quantity: 1,
      productId: product.id
    });
    this.openSuggestionsForIndex = null;
  }

  /** Free-text edits detach the line item from whatever catalog product it was linked to. */
  onDescriptionEdited(index: number): void {
    const group = this.lineItems.at(index);
    const linkedProductId = group.get('productId')?.value;
    if (!linkedProductId) {
      return;
    }

    const linkedProduct = this.products.find((product) => product.id === linkedProductId);
    if (linkedProduct && linkedProduct.name !== group.get('description')?.value) {
      group.patchValue({ productId: null }, { emitEvent: false });
    }
  }

  // ---- Submit ----

  submit(): void {
    if (this.form.invalid || this.lineItems.length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.saveError = '';

    const lineItems: CreateDocumentLineItemRequest[] = this.lineItems.controls.map((control) => ({
      description: control.value.description,
      quantity: Number(control.value.quantity),
      unitPrice: Number(control.value.unitPrice),
      productId: control.value.productId
    }));

    if (this.isEditMode && this.documentId) {
      this.submitEdit(this.documentId, lineItems);
    } else {
      this.submitCreate(lineItems);
    }
  }

  cancel(): void {
    this.router.navigate(['/documents']);
  }

  private submitCreate(lineItems: CreateDocumentLineItemRequest[]): void {
    const request: CreateDocumentRequest = {
      type: this.form.value.type,
      customerId: this.form.value.customerId,
      templateId: this.form.value.templateId,
      dueDate: this.form.value.dueDate,
      lineItems
    };

    // No point even trying the request while the browser already knows it's
    // offline (TASK-027) — go straight to the offline queue.
    if (!navigator.onLine) {
      this.saveOffline(request);
      return;
    }

    this.documentService.create(request).subscribe({
      next: (created) => this.router.navigate(['/documents'], { state: { highlightId: created.id } }),
      error: (error: HttpErrorResponse) => {
        // status 0 means the request never reached the server at all (dropped
        // connection, DNS failure, etc.) — navigator.onLine can be wrong, so
        // this catches what that check above misses.
        if (error.status === 0) {
          this.saveOffline(request);
          return;
        }

        this.saving = false;
        this.saveError = 'Could not create the document. Please try again.';
      }
    });
  }

  private saveOffline(request: CreateDocumentRequest): void {
    void this.offlineQueue.enqueue(request).then(() => {
      this.router.navigate(['/documents'], { state: { savedOffline: true } });
    });
  }

  private submitEdit(documentId: string, lineItems: CreateDocumentLineItemRequest[]): void {
    const request: UpdateDocumentRequest = {
      templateId: this.form.value.templateId,
      dueDate: this.form.value.dueDate,
      status: this.existingStatus,
      lineItems
    };

    this.documentService.update(documentId, request).subscribe({
      next: () => this.router.navigate(['/documents', documentId, 'preview']),
      error: () => {
        this.saving = false;
        this.saveError = 'Could not save your changes. Please try again.';
      }
    });
  }

  private populateForEdit(document: DocumentModel): void {
    this.existingStatus = document.status;

    this.form.patchValue({
      type: document.type,
      customerId: document.customerId,
      templateId: document.templateId,
      dueDate: document.dueDate
    });
    // Customer and document type are fixed once a document exists — the backend's
    // PUT endpoint doesn't accept them, so disable rather than silently ignore.
    this.form.get('type')?.disable();
    this.form.get('customerId')?.disable();

    document.lineItems.forEach((item) => {
      this.lineItems.push(
        this.fb.group({
          description: [item.description, Validators.required],
          quantity: [item.quantity, [Validators.required, Validators.min(0.01)]],
          unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]],
          productId: [item.productId]
        })
      );
    });
  }

  private populateDefaultsForCreate(templates: Template[]): void {
    const defaultTemplate = templates.find((template) => template.isDefault) ?? templates[0];

    this.form.patchValue({
      templateId: defaultTemplate?.id ?? '',
      dueDate: this.formatDate(this.addDays(new Date(), DEFAULT_DUE_DAYS))
    });

    this.addLineItem();
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
