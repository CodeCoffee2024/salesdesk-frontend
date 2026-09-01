import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../_auth-shell.scss', './login.component.scss']
})
export class LoginComponent {
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submitting = false;
  errorMessage: string | null = null;

  // TASK-030 AC: "provide an option on the login page to request a new
  // verification link" — a small inline form rather than a separate route,
  // since it's reachable before the user has even signed in.
  readonly resendForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  showResendVerification = false;
  resendingVerification = false;
  verificationResent = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    this.authService.login(this.form.getRawValue() as { email: string; password: string }).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/overview';
        this.router.navigateByUrl(returnUrl);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.errorMessage = error.status === 401 ? 'Invalid email or password.' : 'Something went wrong. Please try again.';
      }
    });
  }

  toggleResendVerification(): void {
    this.showResendVerification = !this.showResendVerification;
    this.verificationResent = false;
  }

  resendVerification(): void {
    if (this.resendForm.invalid) {
      this.resendForm.markAllAsTouched();
      return;
    }

    this.resendingVerification = true;

    // Always shows the same confirmation, whether or not the address is
    // registered or already verified — see ResendVerificationEmailCommandHandler.
    this.authService.resendVerificationEmail(this.resendForm.getRawValue() as { email: string }).subscribe({
      next: () => this.onResendSettled(),
      error: () => this.onResendSettled()
    });
  }

  private onResendSettled(): void {
    this.resendingVerification = false;
    this.verificationResent = true;
  }
}
