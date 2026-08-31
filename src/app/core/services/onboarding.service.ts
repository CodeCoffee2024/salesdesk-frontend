import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { WorkspaceProfileService } from './workspace-profile.service';
import { ProductService } from './product.service';
import { DocumentService } from './document.service';

export interface OnboardingStepStatus {
  profileComplete: boolean;
  catalogStarted: boolean;
  firstQuoteSent: boolean;
}

/**
 * Onboarding checklist/tour state (TASK-029). Step completion is computed from
 * data that already exists (workspace logo, catalog items, sent quotes) rather
 * than tracked as separate flags — a studio that already has products and has
 * sent a quote shouldn't be told to go do those things again just because a
 * dedicated "step done" bit was never set. Only the final "don't show this
 * checklist again" decision (AuthService.completeOnboarding) is a real,
 * persisted flag, since that's a preference no amount of business data can derive.
 */
@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  constructor(
    private readonly authService: AuthService,
    private readonly workspaceProfileService: WorkspaceProfileService,
    private readonly productService: ProductService,
    private readonly documentService: DocumentService
  ) {}

  /** Whether the checklist/tour should be offered at all right now. */
  shouldOffer(): boolean {
    const user = this.authService.currentUser;
    return !!user && !user.hasCompletedOnboarding;
  }

  getStepStatus(): Observable<OnboardingStepStatus> {
    return forkJoin({
      profile: this.workspaceProfileService.get(),
      products: this.productService.getAll(),
      quotes: this.documentService.getAll({ type: 'quote' })
    }).pipe(
      map(({ profile, products, quotes }) => ({
        profileComplete: !!profile.logoUrl,
        catalogStarted: products.length > 0,
        firstQuoteSent: quotes.some((quote) => quote.status !== 'Draft')
      }))
    );
  }

  /** Skipping the tour, finishing it, or dismissing the checklist are all the same signal — never show it again. */
  dismiss(): Observable<void> {
    return this.authService.completeOnboarding();
  }
}
