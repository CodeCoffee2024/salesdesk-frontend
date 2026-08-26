import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentService } from '../../../core/services/document.service';
import { PdfService } from '../../../core/services/pdf.service';
import { Document as DocumentModel, DocumentStatus } from '../../../core/models/document.model';

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface LifecycleAction {
  label: string;
  run: () => void;
}

@Component({
  selector: 'app-document-preview',
  templateUrl: './document-preview.component.html',
  styleUrls: ['./document-preview.component.scss']
})
export class DocumentPreviewComponent implements OnInit {
  documentId = '';

  document: DocumentModel | null = null;
  loading = true;
  notFound = false;

  updatingStatus = false;
  showDeleteConfirm = false;
  converting = false;
  actionError = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly documentService: DocumentService,
    private readonly pdfService: PdfService
  ) {}

  ngOnInit(): void {
    // Converting a quote and deleting/creating documents both navigate to this same route
    // with a different :id — Angular reuses the component instance, so the id must be read
    // from the paramMap observable rather than a one-time snapshot for the page to refresh.
    this.route.paramMap.subscribe((params) => {
      this.documentId = params.get('id') ?? '';
      this.document = null;
      this.showDeleteConfirm = false;
      this.actionError = '';

      if (!GUID_PATTERN.test(this.documentId)) {
        this.loading = false;
        this.notFound = true;
        return;
      }

      this.notFound = false;
      this.fetch();
    });
  }

  /** Only the transitions that make sense for this document's current type/status. */
  get lifecycleActions(): LifecycleAction[] {
    if (!this.document) {
      return [];
    }

    const actions: LifecycleAction[] = [];
    const { type, status } = this.document;

    if (status === 'Draft') {
      actions.push({ label: 'Mark as sent', run: () => this.setStatus('Sent') });
    }

    if (type === 'Quote' && status === 'Sent') {
      actions.push({ label: 'Mark as accepted', run: () => this.setStatus('Accepted') });
    }

    if (type === 'Invoice' && (status === 'Sent' || status === 'Overdue')) {
      actions.push({ label: 'Mark as paid', run: () => this.setStatus('Paid') });
    }

    return actions;
  }

  get canConvertToInvoice(): boolean {
    return !!this.document && this.document.type === 'Quote' && this.document.status === 'Accepted';
  }

  setStatus(status: DocumentStatus): void {
    if (!this.document) {
      return;
    }

    this.updatingStatus = true;
    this.actionError = '';

    this.documentService.updateStatus(this.document.id, status).subscribe({
      next: (updated) => {
        this.document = updated;
        this.updatingStatus = false;
      },
      error: () => {
        this.updatingStatus = false;
        this.actionError = 'Could not update the status. Please try again.';
      }
    });
  }

  convertToInvoice(): void {
    if (!this.document) {
      return;
    }

    this.converting = true;
    this.actionError = '';

    this.documentService.convertToInvoice(this.document.id).subscribe({
      next: (invoice) => this.router.navigate(['/documents', invoice.id, 'preview']),
      error: () => {
        this.converting = false;
        this.actionError = 'Could not convert this quote. Please try again.';
      }
    });
  }

  requestDelete(): void {
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  confirmDelete(): void {
    if (!this.document) {
      return;
    }

    this.documentService.delete(this.document.id).subscribe({
      next: () => this.router.navigate(['/documents']),
      error: () => {
        this.showDeleteConfirm = false;
        this.actionError = 'Could not delete this document. Please try again.';
      }
    });
  }

  printDocument(): void {
    window.print();
  }

  downloadPdf(): void {
    if (this.document) {
      this.pdfService.download(this.document);
    }
  }

  private fetch(): void {
    this.loading = true;

    this.documentService.getById(this.documentId).subscribe({
      next: (document) => {
        this.document = document;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notFound = true;
      }
    });
  }
}
