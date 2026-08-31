import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['../_auth-shell.scss']
})
export class ResetPasswordComponent implements OnInit {
  readonly form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  token: string | null = null;
  submitting = false;
  errorMessage: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  submit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    this.authService.resetPassword({ token: this.token, newPassword: this.form.getRawValue().newPassword as string }).subscribe({
      next: () => this.router.navigateByUrl('/overview'),
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.errorMessage =
          error.status === 401 ? 'This reset link is invalid or has expired. Request a new one.' : 'Something went wrong. Please try again.';
      }
    });
  }
}
