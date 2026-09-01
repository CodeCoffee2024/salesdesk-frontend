import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUser } from '../../core/models/auth.model';

/**
 * TASK-030 AC: a persistent, route-agnostic banner for a logged-in but
 * unverified user, rendered once at the root of AppComponent's template next to
 * ImpersonationBannerComponent — same reasoning: it needs to stay visible no
 * matter where the session navigates, not just on one page.
 */
@Component({
  selector: 'app-email-verification-banner',
  templateUrl: './email-verification-banner.component.html',
  styleUrls: ['./email-verification-banner.component.scss']
})
export class EmailVerificationBannerComponent {
  readonly currentUser$: Observable<CurrentUser | null> = this.authService.currentUser$;

  sending = false;
  sent = false;

  constructor(private readonly authService: AuthService) {}

  resend(email: string): void {
    if (this.sending) {
      return;
    }

    this.sending = true;
    this.sent = false;

    // Always resolves the same way whether or not the resend actually found a
    // matching, still-unverified account — see ResendVerificationEmailCommandHandler.
    this.authService.resendVerificationEmail({ email }).subscribe({
      next: () => this.onSettled(),
      error: () => this.onSettled()
    });
  }

  private onSettled(): void {
    this.sending = false;
    this.sent = true;
  }
}
