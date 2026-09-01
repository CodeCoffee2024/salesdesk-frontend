import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type VerifyStatus = 'verifying' | 'success' | 'error' | 'missing-token';

/**
 * TASK-030: the landing page for the emailed /auth/verify-email?token=xyz link.
 * Exchanges the token for a verified session on load — no user interaction
 * required — then redirects to the dashboard. A failed/expired token falls
 * through to an inline "resend" form instead of a dead end, since the AC calls
 * for a way to request a new link right from this flow.
 */
@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['../_auth-shell.scss']
})
export class VerifyEmailComponent implements OnInit {
  status: VerifyStatus = 'verifying';

  readonly resendForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  resending = false;
  resendSent = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status = 'missing-token';
      return;
    }

    this.authService.verifyEmail({ token }).subscribe({
      next: () => {
        this.status = 'success';
        // Give the confirmation a moment to register before whisking the user
        // into the app, same as the reset-password page's pattern.
        setTimeout(() => this.router.navigateByUrl('/overview'), 1500);
      },
      error: () => (this.status = 'error')
    });
  }

  resend(): void {
    if (this.resendForm.invalid) {
      this.resendForm.markAllAsTouched();
      return;
    }

    this.resending = true;

    // Always shows the same confirmation, whether or not the address is
    // registered or already verified — see ResendVerificationEmailCommandHandler.
    this.authService.resendVerificationEmail(this.resendForm.getRawValue() as { email: string }).subscribe({
      next: () => this.onResendSettled(),
      error: () => this.onResendSettled()
    });
  }

  private onResendSettled(): void {
    this.resending = false;
    this.resendSent = true;
  }
}
