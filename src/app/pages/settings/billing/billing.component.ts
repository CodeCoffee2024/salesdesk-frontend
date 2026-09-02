import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { WorkspaceBillingService } from '../../../core/services/workspace-billing.service';
import { BillingCycle, PricingCatalog, PricingTier, SubscriptionTier, WorkspaceBilling } from '../../../core/models/workspace-billing.model';

/**
 * TASK-031/TASK-038: the workspace's current subscription tier and usage, the
 * "Early 100 Free Year" promo badge, and the regional (PH vs Global) pricing
 * catalog with an "Upgrade" action per paid tier. Checkout itself is a stub on
 * the backend today (no PayMongo/Stripe/PayPal account exists yet) — Upgrade
 * always fails with a clear "not available yet" message rather than pretending
 * to charge anyone.
 */
@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
  loading = true;
  loadError = false;

  billing: WorkspaceBilling | null = null;
  pricing: PricingCatalog | null = null;

  billingCycle: BillingCycle = 'Monthly';
  checkingOutTier: SubscriptionTier | null = null;
  checkoutError: string | null = null;

  constructor(private readonly workspaceBillingService: WorkspaceBillingService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;

    forkJoin({
      billing: this.workspaceBillingService.get(),
      pricing: this.workspaceBillingService.getPricing()
    }).subscribe({
      next: ({ billing, pricing }) => {
        this.billing = billing;
        this.pricing = pricing;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  isCurrentTier(tier: SubscriptionTier): boolean {
    return this.billing?.subscriptionTier === tier;
  }

  priceFor(tier: PricingTier): number {
    return this.billingCycle === 'Annual' ? tier.annualPrice : tier.monthlyPrice;
  }

  upgrade(tier: PricingTier): void {
    if (tier.tier === 'Free' || this.checkingOutTier) {
      return;
    }

    this.checkingOutTier = tier.tier;
    this.checkoutError = null;

    this.workspaceBillingService.createCheckoutSession(tier.tier, this.billingCycle).subscribe({
      next: (session) => {
        this.redirectTo(session.checkoutUrl);
      },
      error: (error: HttpErrorResponse) => {
        this.checkingOutTier = null;
        this.checkoutError =
          error.status === 503
            ? "Paid upgrades aren't available yet — check back soon."
            : 'Something went wrong starting checkout. Please try again.';
      }
    });
  }

  /** Isolated so tests can spy on it instead of triggering a real page navigation. */
  protected redirectTo(url: string): void {
    window.location.href = url;
  }
}
