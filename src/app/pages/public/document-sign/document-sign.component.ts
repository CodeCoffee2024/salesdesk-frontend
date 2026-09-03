import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PublicDocumentService } from '../../../core/services/public-document.service';
import { PdfService } from '../../../core/services/pdf.service';
import { PublicDocument, SignDocumentRequest } from '../../../core/models/public-document.model';

/**
 * The anonymous client-facing document page (TASK-023/024) — reached via the
 * `/view/:token` link shared from a workspace's internal document preview. No
 * authentication, no app shell (see app.component's isPublicRoute list).
 */
@Component({
  selector: 'app-document-sign',
  templateUrl: './document-sign.component.html',
  styleUrls: ['./document-sign.component.scss']
})
export class DocumentSignComponent implements OnInit {
  token = '';
  document: PublicDocument | null = null;
  loading = true;
  notFound = false;

  showSignModal = false;
  signing = false;
  signError = '';

  showRevisionModal = false;
  revisionFeedback = '';
  requestingRevision = false;
  revisionError = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly publicDocumentService: PublicDocumentService,
    private readonly pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.fetch();
  }

  openSignModal(): void {
    this.signError = '';
    this.showSignModal = true;
  }

  closeSignModal(): void {
    this.showSignModal = false;
  }

  submitSignature(request: SignDocumentRequest): void {
    this.signing = true;
    this.signError = '';

    this.publicDocumentService.sign(this.token, request).subscribe({
      next: (updated) => {
        this.document = updated;
        this.signing = false;
        this.showSignModal = false;
      },
      error: () => {
        this.signing = false;
        this.signError = 'We could not record your signature. Please try again.';
      }
    });
  }

  openRevisionModal(): void {
    this.revisionError = '';
    this.revisionFeedback = '';
    this.showRevisionModal = true;
  }

  closeRevisionModal(): void {
    this.showRevisionModal = false;
  }

  submitRevisionRequest(): void {
    if (!this.revisionFeedback.trim()) {
      return;
    }

    this.requestingRevision = true;
    this.revisionError = '';

    this.publicDocumentService.requestRevision(this.token, this.revisionFeedback.trim()).subscribe({
      next: (updated) => {
        this.document = updated;
        this.requestingRevision = false;
        this.showRevisionModal = false;
      },
      error: () => {
        this.requestingRevision = false;
        this.revisionError = 'We could not send your request. Please try again.';
      }
    });
  }

  downloadPdf(): void {
    if (!this.document) {
      return;
    }

    this.pdfService
      .download(
        this.document,
        this.document.isSigned && this.document.signedByName && this.document.signedAtUtc
          ? {
              signerName: this.document.signedByName,
              signedAtUtc: this.document.signedAtUtc,
              signatureImageDataUrl: this.document.signatureImageDataUrl ?? '',
            }
          : null
      )
      .catch(() => undefined);
  }

  private fetch(): void {
    this.loading = true;

    this.publicDocumentService.getByToken(this.token).subscribe({
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
