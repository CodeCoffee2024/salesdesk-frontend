import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../_auth-shell.scss']
})
export class ForgotPasswordComponent {
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  submitting = false;
  submitted = false;

  constructor(private readonly fb: FormBuilder, private readonly authService: AuthService) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    // Always shows the same confirmation, whether or not the address is
    // registered — see ForgotPasswordCommandHandler on the API.
    this.authService.forgotPassword(this.form.getRawValue() as { email: string }).subscribe({
      next: () => this.onSettled(),
      error: () => this.onSettled()
    });
  }

  private onSettled(): void {
    this.submitting = false;
    this.submitted = true;
  }
}
