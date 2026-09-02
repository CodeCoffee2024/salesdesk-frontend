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
import { WorkspaceProfileService } from '../../../core/services/workspace-profile.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
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
import { ISO_COUNTRIES, ISO_CURRENCIES } from '../../../core/constants/locale.constants';
import { EMPTY_CUSTOMER_ID, ParsedQuoteResult } from '../../../core/models/ai-quote-parse.model';

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

  readonly countries = ISO_COUNTRIES;
  readonly currencies = ISO_CURRENCIES;
  /** The workspace's own default — shown as the Currency select's starting point for a brand-new document (TASK-029). */
  workspaceDefaultCurrency = 'USD';

  /** TASK-033: "Paste a client message" modal, offered only when creating (not editing) a document. Opens automatically when the route carries ?mode=ai. */
  showAiParseModal = false;
  aiNotice: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly documentService: DocumentService,
    private readonly customerService: CustomerService,
    private readonly templateService: TemplateService,
    private readonly productService: ProductService,
    private readonly offlineQueue: OfflineQueueService,
    private readonly workspaceProfileService: WorkspaceProfileService,
    private readonly analytics: AnalyticsService
  ) {
    this.form = this.fb.group({
      type: ['Quote' as DocumentType, Validators.required],
      customerId: ['', Validators.required],
      templateId: ['', Validators.required],
      dueDate: ['', Validators.required],
      currency: ['USD', Validators.required],
      clientCountry: [null as string | null],
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
      workspace: this.workspaceProfileService.getCached(),
      document: this.isEditMode ? this.documentService.getById(this.documentId as string) : of(null)
    }).subscribe({
      next: ({ customers, templates, products, workspace, document }) => {
        this.customers = customers;
        this.templates = templates;
        this.products = products;
        this.workspaceDefaultCurrency = workspace.defaultCurrency;

        if (document) {
          this.populateForEdit(document);
        } else {
          this.populateDefaultsForCreate(templates, workspace.defaultCurrency, workspace.country);
        }

        this.loading = false;

        if (!this.isEditMode && this.route.snapshot.queryParamMap.get('mode') === 'ai') {
          this.showAiParseModal = true;
        }
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      }
    });
  }

  // ---- AI text parsing (TASK-033) ----

  openAiParseModal(): void {
    this.showAiParseModal = true;
  }

  onAiParseModalClosed(): void {
    this.showAiParseModal = false;
  }

  onAiParsed(result: ParsedQuoteResult): void {
    this.showAiParseModal = false;

    const noticeParts: string[] = [];

    if (result.customerId && result.customerId !== EMPTY_CUSTOMER_ID) {
      if (result.customerCreated) {
        noticeParts.push(`Created a new customer, ${result.customerName}.`);
      } else {
        noticeParts.push(`Matched the existing customer ${result.customerName}.`);
      }

      // The newly resolved customer needs to be in `this.customers` for the
      // select to show it and for `selectedCustomer`/clientCountry defaulting
      // to work — simplest correct fix is to refetch the list rather than
      // hand-construct a partial Customer from the parse result's few fields.
      this.customerService.getAll().subscribe((customers) => {
        this.customers = customers;
        this.form.patchValue({ customerId: result.customerId });
        this.onCustomerSelected();
      });
    } else {
      noticeParts.push("Couldn't identify a customer from that text. Pick or add one below.");
    }

    if (result.lineItems.length > 0) {
      this.lineItems.clear();
      result.lineItems.forEach((item) => {
        this.lineItems.push(
          this.fb.group({
            description: [item.description, Validators.required],
            quantity: [item.quantity, [Validators.required, Validators.min(0.01)]],
            unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]],
            productId: [null as string | null]
          })
        );
      });
    }

    if (result.suggestedDepositPercentage !== null) {
      noticeParts.push(`Mentioned a ${result.suggestedDepositPercentage}% deposit (there's no deposit field yet, so note it manually).`);
    }

    if (result.unresolvedFields.length > 0) {
      noticeParts.push(`Couldn't find: ${result.unresolvedFields.join(', ')}.`);
    }

    this.aiNotice = `Parsed via AI, review before sending. ${noticeParts.join(' ')}`;
  }

  /** Picks up the selected customer's own country the moment a customer is chosen, so the target-country override starts from a sensible default (TASK-029) — the user can still change it. Only applies on create; an existing document's override is left as whatever was explicitly set. */
  onCustomerSelected(): void {
    if (this.isEditMode) {
      return;
    }

    const customer = this.selectedCustomer;
    if (customer?.country) {
      this.form.patchValue({ clientCountry: customer.country });
    }
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
      lineItems,
      currency: this.form.value.currency,
      clientCountry: this.form.value.clientCountry
    };

    // No point even trying the request while the browser already knows it's
    // offline (TASK-027) — go straight to the offline queue.
    if (!navigator.onLine) {
      this.saveOffline(request);
      return;
    }

    this.documentService.create(request).subscribe({
      next: (created) => {
        this.trackFirstQuoteSent(created.type);
        this.router.navigate(['/documents'], { state: { highlightId: created.id } });
      },
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
      this.trackFirstQuoteSent(request.type);
      this.router.navigate(['/documents'], { state: { savedOffline: true } });
    });
  }

  /**
   * Third step of the marketing funnel (TASK-032 / TASK-DAY-BY-DAY-MARKET.md)
   * — fires on every successful document creation, not just the user's
   * literal first one: GA4's own Funnel Exploration report handles
   * "first occurrence per user," so this only needs to fire consistently.
   * Deliberately not fired from the edit flow (submitEdit) — that's not the
   * funnel action being measured.
   */
  private trackFirstQuoteSent(documentType: DocumentType): void {
    this.analytics.trackEvent('first_quote_sent', { document_type: documentType });
  }

  private submitEdit(documentId: string, lineItems: CreateDocumentLineItemRequest[]): void {
    const request: UpdateDocumentRequest = {
      templateId: this.form.value.templateId,
      dueDate: this.form.value.dueDate,
      status: this.existingStatus,
      lineItems,
      currency: this.form.value.currency,
      clientCountry: this.form.value.clientCountry
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
      dueDate: document.dueDate,
      currency: document.currency,
      clientCountry: document.clientCountry
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

  private populateDefaultsForCreate(templates: Template[], defaultCurrency: string, workspaceCountry: string): void {
    const defaultTemplate = templates.find((template) => template.isDefault) ?? templates[0];

    this.form.patchValue({
      templateId: defaultTemplate?.id ?? '',
      dueDate: this.formatDate(this.addDays(new Date(), DEFAULT_DUE_DAYS)),
      currency: defaultCurrency,
      clientCountry: workspaceCountry
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
