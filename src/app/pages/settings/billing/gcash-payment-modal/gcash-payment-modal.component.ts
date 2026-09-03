import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { WorkspaceBillingService } from '../../../../core/services/workspace-billing.service';
import { BillingCycle, GCashPaymentDetails, PricingTier, SubscriptionTier } from '../../../../core/models/workspace-billing.model';

const MAX_SCREENSHOT_BYTES = 2_000_000; // ~2MB, matches the backend's data-URL length cap with base64 overhead room to spare.

/**
 * TASK-039: "Pay via GCash" — the manual proof-of-payment flow for Philippine
 * subscribers, since no real payment gateway (PayMongo/Stripe/PayPal) is
 * configured yet. Submitting notifies a platform admin, who verifies the
 * reference number against the actual GCash app and approves it from an
 * emailed link; this modal only collects the claim, it never touches money.
 */
@Component({
  selector: 'app-gcash-payment-modal',
  templateUrl: './gcash-payment-modal.component.html',
  styleUrls: ['./gcash-payment-modal.component.scss']
})
export class GCashPaymentModalComponent implements OnInit {
  @Input() tier: SubscriptionTier = 'Pro';
  @Input() billingCycle: BillingCycle = 'Monthly';
  @Output() submitted = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  loading = true;
  loadError = false;
  details: GCashPaymentDetails | null = null;

  submitting = false;
  submitError = '';
  screenshotError = '';
  screenshotFileName = '';
  private screenshotDataUrl: string | null = null;

  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly workspaceBillingService: WorkspaceBillingService
  ) {
    this.form = this.fb.group({
      gCashReferenceNumber: ['', [Validators.required, Validators.pattern(/^\d{13}$/)]],
      senderName: ['', Validators.required],
      senderMobileNumber: ['', [Validators.required, Validators.pattern(/^(\+63|0)9\d{9}$/)]]
    });
  }

  ngOnInit(): void {
    this.workspaceBillingService.getGCashDetails().subscribe({
      next: (details) => {
        this.details = details;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  get selectedPricedTier(): PricingTier | undefined {
    return this.details?.tiers.find((t) => t.tier === this.tier);
  }

  get amountDue(): number {
    const pricedTier = this.selectedPricedTier;
    if (!pricedTier) {
      return 0;
    }
    return this.billingCycle === 'Annual' ? pricedTier.annualPrice : pricedTier.monthlyPrice;
  }

  onScreenshotSelected(event: Event): void {
    this.screenshotError = '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.screenshotDataUrl = null;
      this.screenshotFileName = '';
      return;
    }

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      this.screenshotError = 'Please choose a PNG or JPEG image.';
      input.value = '';
      return;
    }

    if (file.size > MAX_SCREENSHOT_BYTES) {
      this.screenshotError = 'That image is too large — please use a smaller screenshot.';
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.screenshotDataUrl = reader.result as string;
      this.screenshotFileName = file.name;
    };
    reader.onerror = () => {
      this.screenshotError = "Couldn't read that file. Please try again.";
    };
    reader.readAsDataURL(file);
  }

  removeScreenshot(): void {
    this.screenshotDataUrl = null;
    this.screenshotFileName = '';
    this.screenshotError = '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.submitError = '';

    this.workspaceBillingService
      .submitGCashPayment({
        tier: this.tier,
        billingCycle: this.billingCycle,
        gCashReferenceNumber: this.form.value.gCashReferenceNumber,
        senderName: this.form.value.senderName,
        senderMobileNumber: this.form.value.senderMobileNumber,
        screenshotDataUrl: this.screenshotDataUrl
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.submitted.emit();
        },
        error: (error: HttpErrorResponse) => {
          this.submitting = false;
          this.submitError =
            error.status === 400
              ? 'Please check the details above and try again.'
              : 'Something went wrong submitting this. Please try again.';
        }
      });
  }

  close(): void {
    this.closed.emit();
  }
}
