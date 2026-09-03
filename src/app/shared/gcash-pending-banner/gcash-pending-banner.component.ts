import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { WorkspaceBillingService } from '../../core/services/workspace-billing.service';
import { PendingGCashSubmission } from '../../core/models/workspace-billing.model';

/**
 * TASK-039: "GCash Payment Received..." banner, rendered app-wide next to
 * ImpersonationBannerComponent/EmailVerificationBannerComponent — same
 * reasoning: a workspace with a payment claim pending admin verification
 * should see this no matter where it navigates, not just on /settings/billing.
 * Fetched once per app session (a manual-verification claim is checked on a
 * 1-12 hour SLA, not real-time, so refetching on every navigation buys nothing);
 * the guardrail this backs is "never lock the user out while pending" — this
 * component only informs, the rest of the app stays fully usable underneath it.
 */
@Component({
  selector: 'app-gcash-pending-banner',
  templateUrl: './gcash-pending-banner.component.html',
  styleUrls: ['./gcash-pending-banner.component.scss']
})
export class GCashPendingBannerComponent implements OnInit {
  pending: PendingGCashSubmission | null = null;

  private hasFetched = false;

  constructor(
    private readonly authService: AuthService,
    private readonly workspaceBillingService: WorkspaceBillingService
  ) {}

  ngOnInit(): void {
    // Only worth asking for once a session actually exists — an anonymous/
    // public-route visitor has no workspace billing state to fetch. Fetched
    // once per "a user became present" transition, same guard AppComponent
    // uses for onboarding, not on every currentUser$ emission.
    this.authService.currentUser$.subscribe((user) => {
      if (user && !this.hasFetched) {
        this.hasFetched = true;
        this.workspaceBillingService.get().subscribe({
          next: (billing) => (this.pending = billing.pendingGCashSubmission),
          error: () => undefined
        });
      } else if (!user) {
        this.hasFetched = false;
        this.pending = null;
      }
    });
  }
}
