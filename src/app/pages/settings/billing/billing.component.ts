import { Component, OnInit } from '@angular/core';
import { WorkspaceBillingService } from '../../../core/services/workspace-billing.service';
import { WorkspaceBilling } from '../../../core/models/workspace-billing.model';

/** TASK-031: shows the workspace's current subscription tier, and — for one of the first 100 registered accounts — a confirmation badge with the "Early 100 Free Year" promo's expiration date. */
@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
  loading = true;
  loadError = false;

  billing: WorkspaceBilling | null = null;

  constructor(private readonly workspaceBillingService: WorkspaceBillingService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;

    this.workspaceBillingService.get().subscribe({
      next: (billing) => {
        this.billing = billing;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  get isPremium(): boolean {
    return this.billing?.subscriptionTier === 'Premium';
  }
}
