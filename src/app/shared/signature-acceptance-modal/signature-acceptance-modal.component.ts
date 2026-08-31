import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SignDocumentRequest } from '../../core/models/public-document.model';
import { SignatureValue } from '../signature-canvas/signature-canvas.component';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The "Accept & sign" flow (TASK-024 AC2): full name, email, an explicit agreement
 * checkbox, and the signature itself. Emits the fully-formed request only once every
 * field validates — the public document page never has to duplicate that logic.
 */
@Component({
  selector: 'app-signature-acceptance-modal',
  templateUrl: './signature-acceptance-modal.component.html',
  styleUrls: ['./signature-acceptance-modal.component.scss']
})
export class SignatureAcceptanceModalComponent {
  @Input() documentNumber = '';
  @Input() submitting = false;
  @Input() errorMessage = '';

  @Output() submitted = new EventEmitter<SignDocumentRequest>();
  @Output() cancelled = new EventEmitter<void>();

  signerName = '';
  signerEmail = '';
  agreedToTerms = false;
  touched = false;

  private signature: SignatureValue = { dataUrl: '', type: 'Drawn', isEmpty: true };

  onSignatureChange(value: SignatureValue): void {
    this.signature = value;
  }

  get isValid(): boolean {
    return (
      this.signerName.trim().length > 0 &&
      EMAIL_PATTERN.test(this.signerEmail.trim()) &&
      this.agreedToTerms &&
      !this.signature.isEmpty
    );
  }

  submit(): void {
    this.touched = true;
    if (!this.isValid || this.submitting) {
      return;
    }

    this.submitted.emit({
      signerName: this.signerName.trim(),
      signerEmail: this.signerEmail.trim(),
      agreedToTerms: this.agreedToTerms,
      signatureType: this.signature.type,
      signatureImageDataUrl: this.signature.dataUrl
    });
  }
}
