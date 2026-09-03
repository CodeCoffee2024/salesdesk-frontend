import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
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
  linkCopied = false;

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

  /** trackBy for the *ngFor below: lifecycleActions is a getter that builds
   *  fresh {label, run} objects (with fresh closures) on every read, so
   *  without this Angular's default per-item identity check sees "different"
   *  objects on every change-detection cycle and destroys/recreates the
   *  buttons — exactly the bug that silently broke the template editor's
   *  "Insert field" dropdown (see template-editor.component.ts). Tracking by
   *  the stable label keeps the DOM nodes (and their listeners) alive across
   *  re-renders instead of swapping them out from under an in-flight click. */
  trackByLabel(_index: number, action: LifecycleAction): string {
    return action.label;
  }

  /** Only the transitions that make sense for this document's current type/status. */
  get lifecycleActions(): LifecycleAction[] {
    // TASK-024 guardrail: nothing about a signed document can change anymore —
    // the backend enforces this too (409), but hiding the actions avoids a
    // pointless round trip that would just fail.
    if (!this.document || this.document.isLocked) {
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

  /** TASK-037: mirrors Document.EnsureEditable on the backend — shown once a document has been dispatched and can't be edited directly until it's back in RevisionRequested. */
  get isLockedFromEditing(): boolean {
    return !!this.document && !this.document.isLocked && this.document.status !== 'Draft' && this.document.status !== 'RevisionRequested';
  }

  /** Mirrors documents-list's canEdit — Draft (never sent) and RevisionRequested (client asked for changes) are the only editable states. */
  get canEdit(): boolean {
    return !!this.document && !this.document.isLocked && (this.document.status === 'Draft' || this.document.status === 'RevisionRequested');
  }

  edit(): void {
    if (!this.document) {
      return;
    }

    this.router.navigate(['/documents', this.document.id, 'edit']);
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
    // window.print() has nothing to talk to inside the Capacitor native app's
    // WebView (no browser chrome, no print dialog). Fall back to the same
    // download-and-share flow, whose share sheet exposes a system Print
    // action on most Android setups. Regular web keeps the normal print dialog.
    if (Capacitor.isNativePlatform()) {
      this.downloadPdf();
      return;
    }

    window.print();
  }

  downloadPdf(): void {
    if (!this.document) {
      return;
    }

    this.pdfService
      .download(
        this.document,
        this.document.signature
          ? {
              signerName: this.document.signature.signerName,
              signedAtUtc: this.document.signature.signedAtUtc,
              signatureImageDataUrl: this.document.signature.signatureImageDataUrl
            }
          : null
      )
      .catch(() => (this.actionError = 'Could not generate the PDF. Please try again.'));
  }

  get publicLink(): string {
    return this.document ? `${window.location.origin}/view/${this.document.publicToken}` : '';
  }

  copyPublicLink(): void {
    if (!this.publicLink) {
      return;
    }

    navigator.clipboard.writeText(this.publicLink).then(() => {
      this.linkCopied = true;
      setTimeout(() => (this.linkCopied = false), 2000);
    });
  }

  /** Web Share API isn't available on every browser (notably most desktop browsers) — shown only where it is, with "Copy client link" as the universal fallback. */
  get canShare(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  }

  shareDocument(): void {
    if (!this.document || !this.publicLink) {
      return;
    }

    navigator
      .share({
        title: `${this.document.type} ${this.document.documentNumber}`,
        text: `Here's your ${this.document.type.toLowerCase()}: ${this.document.documentNumber}`,
        url: this.publicLink
      })
      // A user cancelling the native share sheet rejects with AbortError — not an error worth surfacing.
      .catch(() => undefined);
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
