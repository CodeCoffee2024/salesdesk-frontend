import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingService, OnboardingStepStatus } from '../../core/services/onboarding.service';
import { TourService } from '../../core/services/tour.service';

/**
 * First-login setup checklist (TASK-029) — shown once per account (gated by
 * AuthService.currentUser.hasCompletedOnboarding, a persisted per-user flag, not
 * just a localStorage dismissal, so it doesn't reappear on another device either).
 * Step completion is read from real workspace data (see OnboardingService),
 * so a workspace that already has a logo/catalog/sent quote shows those steps
 * as done immediately rather than asking the user to redo them.
 *
 * Navigating to go complete a step only hides the modal for this session (it
 * comes back next login until actually dismissed) — only Skip / Finish counts
 * as "don't show again" and persists that to the backend, per the task's own
 * guardrail against popping up unprompted after a real dismissal.
 */
@Component({
  selector: 'app-onboarding-checklist',
  templateUrl: './onboarding-checklist.component.html',
  styleUrls: ['./onboarding-checklist.component.scss']
})
export class OnboardingChecklistComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  loading = true;
  status: OnboardingStepStatus = { profileComplete: false, catalogStarted: false, firstQuoteSent: false };

  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly tourService: TourService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.onboardingService.getStepStatus().subscribe({
      next: (status) => {
        this.status = status;
        this.loading = false;
      },
      // Not fatal — the checklist still renders with everything shown as "not
      // started" rather than blocking the user from dismissing it.
      error: () => (this.loading = false)
    });
  }

  get allStepsComplete(): boolean {
    return this.status.profileComplete && this.status.catalogStarted && this.status.firstQuoteSent;
  }

  goToStep(step: 1 | 2 | 3): void {
    const routes: Record<1 | 2 | 3, string> = {
      1: '/settings/workspace',
      2: '/products',
      3: '/documents/new'
    };
    void this.router.navigateByUrl(routes[step]);
    this.closed.emit();
  }

  startTour(): void {
    this.closed.emit();
    this.tourService.start();
  }

  /** Skip, Finish, and the × button all mean the same thing: don't show this again. */
  dismiss(): void {
    this.onboardingService.dismiss().subscribe();
    this.closed.emit();
  }
}
