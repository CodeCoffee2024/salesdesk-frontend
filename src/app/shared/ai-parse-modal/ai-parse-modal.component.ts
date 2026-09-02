import { Component, EventEmitter, Output } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DocumentService } from '../../core/services/document.service';
import { ParsedQuoteResult } from '../../core/models/ai-quote-parse.model';

const MAX_LENGTH = 5000;

/**
 * TASK-033 MVP: lets the user paste unstructured text (a WhatsApp message, email,
 * or note) and sends it to the backend's AI parser, which extracts a customer and
 * line items and returns them for the document form to pre-fill. Owns its own
 * loading/error state and the HTTP call itself, unlike ConfirmDialogComponent,
 * since there's real async work here rather than a plain yes/no.
 */
@Component({
  selector: 'app-ai-parse-modal',
  templateUrl: './ai-parse-modal.component.html',
  styleUrls: ['./ai-parse-modal.component.scss']
})
export class AiParseModalComponent {
  @Output() parsed = new EventEmitter<ParsedQuoteResult>();
  @Output() closed = new EventEmitter<void>();

  readonly maxLength = MAX_LENGTH;
  rawText = '';
  parsing = false;
  errorMessage = '';

  constructor(private readonly documentService: DocumentService) {}

  submit(): void {
    const text = this.rawText.trim();
    if (!text || this.parsing) {
      return;
    }

    this.parsing = true;
    this.errorMessage = '';

    this.documentService.parseText(text).subscribe({
      next: (result) => {
        this.parsing = false;
        this.parsed.emit(result);
      },
      error: (error: HttpErrorResponse) => {
        this.parsing = false;
        this.errorMessage = this.messageFor(error);
      }
    });
  }

  close(): void {
    if (this.parsing) {
      return;
    }
    this.closed.emit();
  }

  private messageFor(error: HttpErrorResponse): string {
    if (error.status === 503) {
      return "AI parsing isn't set up on this server yet. Fill in the form manually below.";
    }
    if (error.status === 502) {
      return 'The AI parser had trouble with that text. Try rewording it, or fill in the form manually.';
    }
    return 'Something went wrong parsing that text. Try again, or fill in the form manually.';
  }
}
