import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { WorkspaceBillingService } from '../../../../core/services/workspace-billing.service';
import { BillingCycle, SubscriptionTier } from '../../../../core/models/workspace-billing.model';

/**
 * The fallback upgrade path for a workspace with no configured payment method —
 * not PH (GCash) and no card/PayPal gateway configured yet
 * (IPaymentGatewayService is a stub). Doesn't collect any payment; it just
 * notifies the platform admin, who arranges billing directly and approves the
 * tier change from a one-click emailed link.
 */
@Component({
  selector: 'app-upgrade-request-modal',
  templateUrl: './upgrade-request-modal.component.html',
  styleUrls: ['./upgrade-request-modal.component.scss']
})
export class UpgradeRequestModalComponent {
  @Input() tier: SubscriptionTier = 'Pro';
  @Input() billingCycle: BillingCycle = 'Monthly';
  @Output() submitted = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  note = '';
  submitting = false;
  submitError = '';

  constructor(private readonly workspaceBillingService: WorkspaceBillingService) {}

  submit(): void {
    this.submitting = true;
    this.submitError = '';

    this.workspaceBillingService
      .requestUpgrade({ tier: this.tier, billingCycle: this.billingCycle, note: this.note.trim() || null })
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
              : 'Something went wrong sending this request. Please try again.';
        }
      });
  }

  close(): void {
    this.closed.emit();
  }
}
